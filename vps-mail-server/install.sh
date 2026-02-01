#!/bin/bash

# ============================================
# SENA MAIL SERVER - AUTO INSTALLER
# For Ubuntu 22.04 LTS
# Usage: curl ... | sudo bash -s -- -d example.com
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
PRIMARY_DOMAIN=""
SITE_NAME="Sena Hub"
AUTHOR_NAME="Sena"
AUTO_CONFIRM=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--domain)
      PRIMARY_DOMAIN="$2"
      shift 2
      ;;
    -n|--name)
      SITE_NAME="$2"
      shift 2
      ;;
    -a|--author)
      AUTHOR_NAME="$2"
      shift 2
      ;;
    -y|--yes)
      AUTO_CONFIRM=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     📮 SENA MAIL SERVER INSTALLER         ║"
echo "║         For Ubuntu 22.04 LTS              ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root (sudo)${NC}"
  exit 1
fi

# Get user input if not provided via arguments
echo -e "${CYAN}📝 Configuration${NC}"
echo ""

# Only prompt if running interactively AND domain not provided
if [ -z "$PRIMARY_DOMAIN" ]; then
  if [ -t 0 ]; then
    read -p "🌐 Enter primary domain for web access (e.g., example.com): " PRIMARY_DOMAIN
  fi
  if [ -z "$PRIMARY_DOMAIN" ]; then
    echo -e "${RED}❌ Primary domain is required!${NC}"
    echo -e "${YELLOW}Usage: curl ... | sudo bash -s -- -d yourdomain.com${NC}"
    echo -e "${YELLOW}   Or: sudo bash install.sh -d yourdomain.com${NC}"
    exit 1
  fi
fi

if [ -t 0 ] && [ "$AUTO_CONFIRM" = false ]; then
  read -p "✨ Enter website name [default: $SITE_NAME]: " INPUT_SITE_NAME
  SITE_NAME=${INPUT_SITE_NAME:-$SITE_NAME}

  read -p "👤 Enter your name for credits [default: $AUTHOR_NAME]: " INPUT_AUTHOR_NAME
  AUTHOR_NAME=${INPUT_AUTHOR_NAME:-$AUTHOR_NAME}
fi

echo ""
echo -e "${YELLOW}📋 Configuration Summary:${NC}"
echo -e "   Primary Domain: ${GREEN}$PRIMARY_DOMAIN${NC}"
echo -e "   Allowed Mail Domains: ${GREEN}* (all domains)${NC}"
echo -e "   Site Name: ${GREEN}$SITE_NAME${NC}"
echo -e "   Author: ${GREEN}$AUTHOR_NAME${NC}"
echo ""

if [ -t 0 ] && [ "$AUTO_CONFIRM" = false ]; then
  read -p "Continue with installation? (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}Installation cancelled.${NC}"
    exit 0
  fi
else
  echo -e "${CYAN}Running in non-interactive mode...${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Step 1/6: Installing dependencies...${NC}"
apt update
apt install -y curl git nginx

# Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
  echo -e "${BLUE}📦 Installing Node.js 20...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

apt install -y build-essential python3

echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${BLUE}🔧 Step 2/6: Cloning repository...${NC}"
cd /opt
rm -rf sena-mail
git clone https://github.com/Senjakun/your-portal-mail.git sena-mail
cd sena-mail/vps-mail-server

echo -e "${GREEN}✓ Repository cloned${NC}"

echo ""
echo -e "${BLUE}🔧 Step 3/6: Installing npm packages...${NC}"
npm install
mkdir -p data

echo -e "${GREEN}✓ Packages installed${NC}"

echo ""
echo -e "${BLUE}🔧 Step 4/6: Customizing website...${NC}"

# Update index.html with custom name
sed -i "s/Sena Hub/$SITE_NAME/g" public/index.html
sed -i "s/Made with 💜 by Sena/Made with 💜 by $AUTHOR_NAME/g" public/index.html
sed -i "s/<title>✨ Sena Hub/<title>✨ $SITE_NAME/g" public/index.html

echo -e "${GREEN}✓ Website customized${NC}"

echo ""
echo -e "${BLUE}🔧 Step 5/6: Setting up systemd service...${NC}"

cat > /etc/systemd/system/sena-mail.service << EOF
[Unit]
Description=Sena Mail Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sena-mail/vps-mail-server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=WEB_PORT=3000
Environment=SMTP_PORT=25
Environment=ALLOWED_DOMAINS=*

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sena-mail
systemctl start sena-mail

echo -e "${GREEN}✓ Service configured${NC}"

echo ""
echo -e "${BLUE}🔧 Step 6/6: Configuring Nginx...${NC}"

rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/sena-mail << EOF
server {
    listen 80;
    server_name $PRIMARY_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/sena-mail /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Configure firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 25/tcp
ufw --force enable

echo -e "${GREEN}✓ Nginx configured${NC}"

echo ""
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════╗"
echo "║        ✅ INSTALLATION COMPLETE!          ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}🎉 Your mail server is ready!${NC}"
echo ""
VPS_IP=$(curl -s ifconfig.me)

echo -e "${CYAN}📋 Next Steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Setup DNS for ANY domain you want:${NC}"
echo -e "   ${CYAN}A Record:${NC}   mail → $VPS_IP"
echo -e "   ${CYAN}MX Record:${NC}  @ → mail.yourdomain.com (priority 10)"
echo ""
echo -e "   ${GREEN}✓ All domains pointing to this IP will work!${NC}"
echo -e "   ${GREEN}✓ No need to configure domain list - accepts all${NC}"
echo ""
echo -e "2. ${YELLOW}If using Cloudflare:${NC}"
echo -e "   - Set 'mail' A record to ${CYAN}DNS only${NC} (grey cloud)"
echo -e "   - Set SSL/TLS mode to 'Flexible' or 'Full'"
echo ""
echo -e "3. ${YELLOW}Install SSL (recommended):${NC}"
echo -e "   sudo apt install certbot python3-certbot-nginx"
echo -e "   sudo certbot --nginx -d $PRIMARY_DOMAIN"
echo ""
echo -e "4. ${YELLOW}Access your site:${NC}"
echo -e "   http://$PRIMARY_DOMAIN"
echo ""
echo -e "${PURPLE}📮 Enjoy your mail server!${NC}"
echo ""

# Show service status
echo -e "${CYAN}📊 Service Status:${NC}"
systemctl status sena-mail --no-pager
