#!/bin/bash

# ╔═══════════════════════════════════════════════════╗
# ║     📧 Temporary Mail - Quick Install Script      ║
# ╚═══════════════════════════════════════════════════╝

set -e

echo "╔═══════════════════════════════════════════════════╗"
echo "║     📧 Temporary Mail - Quick Install             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Variables
INSTALL_DIR="/opt/temp-mail"
DATA_DIR="/var/lib/temp-mail"
USER="tempmail"

echo -e "${YELLOW}[1/7] Installing dependencies...${NC}"
apt update
apt install -y curl git nginx

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${YELLOW}[2/7] Creating user and directories...${NC}"
# Create user if not exists
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/false $USER
fi

# Create directories
mkdir -p $INSTALL_DIR
mkdir -p $DATA_DIR
chown -R $USER:$USER $DATA_DIR

echo -e "${YELLOW}[3/7] Cloning repository...${NC}"
cd /tmp
rm -rf your-portal-mail
git clone https://github.com/YOUR_USERNAME/your-portal-mail.git
cd your-portal-mail

echo -e "${YELLOW}[4/7] Building frontend...${NC}"
npm install
npm run build

echo -e "${YELLOW}[5/7] Setting up backend...${NC}"
# Copy files
cp -r server/* $INSTALL_DIR/
cp -r dist $INSTALL_DIR/

cd $INSTALL_DIR
npm install --production

# Set permissions
chown -R $USER:$USER $INSTALL_DIR

echo -e "${YELLOW}[6/7] Setting up PM2...${NC}"
# Create ecosystem file
cat > $INSTALL_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'temp-mail',
    script: 'index.js',
    cwd: '$INSTALL_DIR',
    user: '$USER',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATA_DIR: '$DATA_DIR',
      CLEANUP_DAYS: 7
    },
    max_memory_restart: '500M',
    error_file: '/var/log/temp-mail/error.log',
    out_file: '/var/log/temp-mail/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

# Create log directory
mkdir -p /var/log/temp-mail
chown -R $USER:$USER /var/log/temp-mail

# Start with PM2
pm2 start $INSTALL_DIR/ecosystem.config.js
pm2 save
pm2 startup

echo -e "${YELLOW}[7/7] Setting up Nginx...${NC}"
# Create nginx config
cat > /etc/nginx/sites-available/temp-mail << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/temp-mail /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx

# Cleanup
rm -rf /tmp/your-portal-mail

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Installation Complete!                     ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  📧 Your Temporary Mail is ready!                 ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  🌐 Access: http://YOUR_SERVER_IP                 ║${NC}"
echo -e "${GREEN}║  📁 Data: $DATA_DIR                    ║${NC}"
echo -e "${GREEN}║  📊 Logs: pm2 logs temp-mail                      ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  🔒 For SSL, run:                                 ║${NC}"
echo -e "${GREEN}║  certbot --nginx -d yourdomain.com                ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Show status
pm2 status
