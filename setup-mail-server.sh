#!/bin/bash

# ╔═══════════════════════════════════════════════════╗
# ║     📧 Mail Server Setup (Postfix + Forward)      ║
# ╚═══════════════════════════════════════════════════╝

set -e

export DEBIAN_FRONTEND=noninteractive

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Get domain from argument or ask
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
    echo -n "Enter your primary domain (e.g., quinyukie.com): "
    read -r DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain is required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Setting up mail server for: $DOMAIN${NC}"
echo -e "${YELLOW}This will configure Postfix to receive emails for ANY domain pointing to this server${NC}"
echo ""

# ============= Install Postfix =============
echo -e "${YELLOW}[1/5] Installing Postfix...${NC}"

# Pre-configure postfix to avoid prompts
debconf-set-selections <<< "postfix postfix/mailname string $DOMAIN"
debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"

apt-get update -yq
apt-get install -yq postfix mailutils

# ============= Configure Postfix =============
echo -e "${YELLOW}[2/5] Configuring Postfix...${NC}"

# Backup original config
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Create new config
cat > /etc/postfix/main.cf << EOF
# Basic settings
smtpd_banner = \$myhostname ESMTP
biff = no
append_dot_mydomain = no
readme_directory = no

# TLS parameters (optional, for security)
smtpd_use_tls = no

# Network settings
myhostname = mail.$DOMAIN
mydomain = $DOMAIN
myorigin = \$mydomain
inet_interfaces = all
inet_protocols = ipv4

# Accept mail for ANY domain (catch-all)
mydestination = 
local_recipient_maps = 
local_transport = error:local mail delivery is disabled

# Virtual mailbox - catch all emails
virtual_alias_maps = regexp:/etc/postfix/virtual_regexp
virtual_mailbox_domains = regexp:/etc/postfix/virtual_domains_regexp
virtual_transport = pipe:flags=Rq user=nobody argv=/usr/local/bin/mail-to-api.sh

# Queue settings
maximal_queue_lifetime = 1d
bounce_queue_lifetime = 1d

# Size limits
message_size_limit = 10240000
mailbox_size_limit = 0

# Security
smtpd_recipient_restrictions = permit_mynetworks, reject_unauth_destination
EOF

# Create virtual domain regexp (accept ANY domain)
cat > /etc/postfix/virtual_domains_regexp << 'EOF'
/^.*$/  OK
EOF

# Create virtual alias regexp (catch all addresses)
cat > /etc/postfix/virtual_regexp << 'EOF'
/^(.*)@(.*)$/  catchall
EOF

# ============= Create Mail-to-API Script =============
echo -e "${YELLOW}[3/5] Creating mail forwarder script...${NC}"

cat > /usr/local/bin/mail-to-api.sh << 'SCRIPT'
#!/bin/bash

# Read email from stdin
EMAIL_CONTENT=$(cat)

# Parse headers
FROM_LINE=$(echo "$EMAIL_CONTENT" | grep -m1 "^From:" | sed 's/^From: //')
TO_LINE=$(echo "$EMAIL_CONTENT" | grep -m1 "^To:" | sed 's/^To: //')
SUBJECT_LINE=$(echo "$EMAIL_CONTENT" | grep -m1 "^Subject:" | sed 's/^Subject: //')

# Extract email addresses
FROM_EMAIL=$(echo "$FROM_LINE" | grep -oP '[\w\.\-]+@[\w\.\-]+' | head -1)
FROM_NAME=$(echo "$FROM_LINE" | sed 's/<.*>//g' | sed 's/^[ \t]*//;s/[ \t]*$//' | head -c 100)
TO_EMAIL=$(echo "$TO_LINE" | grep -oP '[\w\.\-]+@[\w\.\-]+' | head -1)

# Get body (everything after first blank line)
BODY=$(echo "$EMAIL_CONTENT" | sed -n '/^$/,$p' | tail -n +2)

# Escape for JSON
escape_json() {
    echo "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

FROM_NAME_JSON=$(escape_json "$FROM_NAME")
FROM_EMAIL_JSON=$(escape_json "$FROM_EMAIL")
TO_EMAIL_JSON=$(escape_json "$TO_EMAIL")
SUBJECT_JSON=$(escape_json "$SUBJECT_LINE")
BODY_JSON=$(escape_json "$BODY")
PREVIEW_JSON=$(escape_json "$(echo "$BODY" | head -c 150)")

# Send to API
curl -s -X POST http://127.0.0.1:3001/api/emails \
  -H "Content-Type: application/json" \
  -d "{
    \"from_name\": $FROM_NAME_JSON,
    \"from_email\": $FROM_EMAIL_JSON,
    \"to_email\": $TO_EMAIL_JSON,
    \"subject\": $SUBJECT_JSON,
    \"body\": $BODY_JSON,
    \"preview\": $PREVIEW_JSON
  }" >> /var/log/mail-to-api.log 2>&1

exit 0
SCRIPT

chmod +x /usr/local/bin/mail-to-api.sh

# Create log file
touch /var/log/mail-to-api.log
chmod 666 /var/log/mail-to-api.log

# ============= Configure Master.cf =============
echo -e "${YELLOW}[4/5] Configuring mail transport...${NC}"

# Add pipe transport if not exists
if ! grep -q "mail-to-api" /etc/postfix/master.cf; then
    cat >> /etc/postfix/master.cf << 'EOF'

# Forward to API
pipe      unix  -       n       n       -       10      pipe
  flags=Rq user=nobody argv=/usr/local/bin/mail-to-api.sh
EOF
fi

# ============= Restart Services =============
echo -e "${YELLOW}[5/5] Starting services...${NC}"

# Reload postfix
postfix check
systemctl restart postfix
systemctl enable postfix

# ============= Firewall =============
echo -e "${YELLOW}Opening port 25 (SMTP)...${NC}"
ufw allow 25/tcp 2>/dev/null || iptables -A INPUT -p tcp --dport 25 -j ACCEPT 2>/dev/null || true

# ============= Done =============
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Mail Server Setup Complete!                ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  📧 Postfix is now receiving emails               ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  🔧 For each domain, add MX record:               ║${NC}"
echo -e "${GREEN}║     Type: MX                                      ║${NC}"
echo -e "${GREEN}║     Name: @                                       ║${NC}"
echo -e "${GREEN}║     Mail Server: mail.$DOMAIN            ║${NC}"
echo -e "${GREEN}║     Priority: 10                                  ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  📊 Check logs: tail -f /var/log/mail-to-api.log  ║${NC}"
echo -e "${GREEN}║  📊 Mail logs: tail -f /var/log/mail.log          ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Test
echo -e "${YELLOW}Testing Postfix status...${NC}"
systemctl status postfix --no-pager | head -5
