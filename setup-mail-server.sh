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
virtual_transport = mailtoapi

# Ensure single-recipient delivery so ${original_recipient} is reliable
mailtoapi_destination_recipient_limit = 1

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

LOG="/var/log/mail-to-api.log"

# Postfix can pass these as argv macros (preferred, because it includes the real recipient)
ORIGINAL_RECIPIENT_RAW="${1:-}"
RECIPIENT_RAW="${2:-}"

sanitize_addr() {
    # remove CR, surrounding <>, and trim
    echo "$1" | tr -d '\r' | sed 's/[<>]//g' | sed 's/^[ \t]*//;s/[ \t]*$//'
}

# Read email from stdin
EMAIL_CONTENT=$(cat)

echo "========== $(date) ==========" >> $LOG

# Parse headers (fallback only)
FROM_HEADER=$(echo "$EMAIL_CONTENT" | grep -m1 -i "^From:" | sed 's/^[Ff]rom: //')
TO_HEADER=$(echo "$EMAIL_CONTENT" | grep -m1 -i "^To:" | sed 's/^[Tt]o: //')
DELIVERED_TO=$(echo "$EMAIL_CONTENT" | grep -m1 -i "^Delivered-To:" | sed 's/^[Dd]elivered-[Tt]o: //')
SUBJECT_HEADER=$(echo "$EMAIL_CONTENT" | grep -m1 -i "^Subject:" | sed 's/^[Ss]ubject: //')

# Extract email addresses using grep
FROM_EMAIL=$(sanitize_addr "$(echo "$FROM_HEADER" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)")

# Prefer ORIGINAL_RECIPIENT if provided by Postfix
TO_EMAIL=""
if [ -n "$ORIGINAL_RECIPIENT_RAW" ]; then
    TO_EMAIL=$(sanitize_addr "$ORIGINAL_RECIPIENT_RAW")
fi

# Fallback to recipient arg
if [ -z "$TO_EMAIL" ] && [ -n "$RECIPIENT_RAW" ]; then
    TO_EMAIL=$(sanitize_addr "$RECIPIENT_RAW")
fi

# Fallback to headers
if [ -z "$TO_EMAIL" ]; then
    TO_EMAIL=$(sanitize_addr "$(echo "$TO_HEADER" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)")
fi

# Fallback to Delivered-To header if still empty
if [ -z "$TO_EMAIL" ]; then
    TO_EMAIL=$(sanitize_addr "$(echo "$DELIVERED_TO" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)")
fi

# Extract from name (text before email)
FROM_NAME=$(echo "$FROM_HEADER" | sed 's/<.*>//g' | sed 's/^[ \t]*//;s/[ \t]*$//' | head -c 100)
if [ -z "$FROM_NAME" ]; then
    FROM_NAME="$FROM_EMAIL"
fi

# Get body (everything after first blank line, decode if needed)
BODY=$(echo "$EMAIL_CONTENT" | sed -n '/^$/,$p' | tail -n +2 | head -c 50000)

# Clean up body - remove HTML if it looks like HTML
if echo "$BODY" | grep -q "<html"; then
    # Extract text from HTML (basic)
    BODY=$(echo "$BODY" | sed 's/<[^>]*>//g' | sed 's/&nbsp;/ /g' | sed 's/&amp;/\&/g')
fi

echo "Args original_recipient: $ORIGINAL_RECIPIENT_RAW" >> $LOG
echo "Args recipient: $RECIPIENT_RAW" >> $LOG
echo "From: $FROM_EMAIL" >> $LOG
echo "To: $TO_EMAIL" >> $LOG
echo "Subject: $SUBJECT_HEADER" >> $LOG

# Validate required fields
if [ -z "$FROM_EMAIL" ] || [ -z "$TO_EMAIL" ]; then
    echo "ERROR: Missing from or to email" >> $LOG
    exit 0
fi

# Create JSON payload using jq if available, otherwise use python
if command -v jq &> /dev/null; then
    PAYLOAD=$(jq -n \
        --arg fn "$FROM_NAME" \
        --arg fe "$FROM_EMAIL" \
        --arg te "$TO_EMAIL" \
        --arg su "$SUBJECT_HEADER" \
        --arg bo "$BODY" \
        --arg pr "$(echo "$BODY" | head -c 150)" \
        '{from_name: $fn, from_email: $fe, to_email: $te, subject: $su, body: $bo, preview: $pr}')
else
    # Escape for JSON using python
    PAYLOAD=$(python3 << PYTHON
import json
print(json.dumps({
    "from_name": """$FROM_NAME""",
    "from_email": "$FROM_EMAIL",
    "to_email": "$TO_EMAIL",
    "subject": """$SUBJECT_HEADER""",
    "body": """$BODY"""[:50000],
    "preview": """$BODY"""[:150]
}))
PYTHON
)
fi

# Send to API
RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/emails \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>&1)

echo "API Response: $RESPONSE" >> $LOG
echo "" >> $LOG

exit 0
SCRIPT

chmod +x /usr/local/bin/mail-to-api.sh

# Install jq for better JSON handling
apt-get install -yq jq || true

# Create log file
touch /var/log/mail-to-api.log
chmod 666 /var/log/mail-to-api.log

# ============= Configure Master.cf =============
echo -e "${YELLOW}[4/5] Configuring mail transport...${NC}"

# Remove older custom config (from previous script versions)
sed -i \
  -e '/^# Forward to API$/d' \
  -e '/^pipe[[:space:]]\+unix[[:space:]]\+-[[:space:]]\+n[[:space:]]\+n[[:space:]]\+-[[:space:]]\+10[[:space:]]\+pipe$/d' \
  -e '/^[[:space:]]\+flags=Rq user=nobody argv=\/usr\/local\/bin\/mail-to-api\.sh$/d' \
  /etc/postfix/master.cf

# Add mailtoapi transport if not exists
if ! grep -q "^mailtoapi[[:space:]]\+unix" /etc/postfix/master.cf; then
    cat >> /etc/postfix/master.cf << 'EOF'

# Forward to API (pass original recipient so inbox shows the real address)
mailtoapi  unix  -       n       n       -       10      pipe
  flags=Rq user=nobody argv=/usr/local/bin/mail-to-api.sh ${original_recipient} ${recipient}
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
