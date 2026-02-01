#!/bin/bash

# ============================================
# SENA MAIL SERVER - UNINSTALLER
# Membersihkan instalasi sebelumnya
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}"
echo "╔═══════════════════════════════════════════╗"
echo "║     🗑️  SENA MAIL SERVER UNINSTALLER      ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root (sudo)${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  This will remove:${NC}"
echo "   - Sena Mail systemd service"
echo "   - Application files in /opt/sena-mail"
echo "   - Nginx configuration"
echo "   - Email database (optional)"
echo ""

read -p "Continue with uninstall? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo -e "${RED}Uninstall cancelled.${NC}"
  exit 0
fi

echo ""
echo -e "${CYAN}🔧 Step 1/4: Stopping service...${NC}"
systemctl stop sena-mail 2>/dev/null || true
systemctl disable sena-mail 2>/dev/null || true
rm -f /etc/systemd/system/sena-mail.service
systemctl daemon-reload
echo -e "${GREEN}✓ Service removed${NC}"

echo ""
echo -e "${CYAN}🔧 Step 2/4: Removing Nginx config...${NC}"
rm -f /etc/nginx/sites-enabled/sena-mail
rm -f /etc/nginx/sites-available/sena-mail
nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
echo -e "${GREEN}✓ Nginx config removed${NC}"

echo ""
echo -e "${CYAN}🔧 Step 3/4: Removing application files...${NC}"
rm -rf /opt/sena-mail
echo -e "${GREEN}✓ Application files removed${NC}"

echo ""
echo -e "${CYAN}🔧 Step 4/4: Cleaning up...${NC}"
# Remove any old service names (in case different naming was used)
systemctl stop mail-server 2>/dev/null || true
systemctl disable mail-server 2>/dev/null || true
rm -f /etc/systemd/system/mail-server.service

systemctl stop temp-mail 2>/dev/null || true
systemctl disable temp-mail 2>/dev/null || true
rm -f /etc/systemd/system/temp-mail.service

systemctl daemon-reload
echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║        ✅ UNINSTALL COMPLETE!             ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}📋 Notes:${NC}"
echo "   - Node.js and Nginx were NOT removed"
echo "   - Firewall rules were NOT changed"
echo "   - You can now install the new version"
echo ""
echo -e "${YELLOW}To install fresh:${NC}"
echo "   curl -fsSL https://raw.githubusercontent.com/Senjakun/halo-s-pal/main/vps-mail-server/install.sh | sudo bash"
echo ""
