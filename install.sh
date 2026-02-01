#!/bin/bash

# ╔═══════════════════════════════════════════════════╗
# ║     📧 Temporary Mail - Quick Install Script      ║
# ╚═══════════════════════════════════════════════════╝

set -e

# Prevent any interactive apt/dpkg prompts (critical for curl|bash installs)
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
export APT_LISTCHANGES_FRONTEND=none
export TERM=dumb

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

# Function to wait for apt locks
wait_for_apt_lock() {
    echo -e "${YELLOW}Checking for apt locks...${NC}"
    local max_wait=120
    local waited=0
    
    while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || \
          fuser /var/lib/dpkg/lock >/dev/null 2>&1 || \
          fuser /var/cache/apt/archives/lock >/dev/null 2>&1; do
        if [ $waited -eq 0 ]; then
            echo -e "${YELLOW}Waiting for other apt processes to finish...${NC}"
        fi
        sleep 5
        waited=$((waited + 5))
        if [ $waited -ge $max_wait ]; then
            echo -e "${RED}Timeout waiting for apt lock. Forcing release...${NC}"
            # Kill any stuck apt/dpkg processes
            pkill -9 apt || true
            pkill -9 dpkg || true
            sleep 2
            # Remove lock files
            rm -f /var/lib/dpkg/lock-frontend
            rm -f /var/lib/dpkg/lock
            rm -f /var/cache/apt/archives/lock
            dpkg --configure -a || true
            break
        fi
        echo -e "${YELLOW}Still waiting... ($waited seconds)${NC}"
    done
    
    if [ $waited -gt 0 ] && [ $waited -lt $max_wait ]; then
        echo -e "${GREEN}Apt locks released!${NC}"
    fi
}

# Configure needrestart to never open the “Daemons using outdated libraries” dialog
configure_needrestart_noninteractive() {
    # Prefer conf.d override (won't clobber distro config)
    mkdir -p /etc/needrestart/conf.d
    cat > /etc/needrestart/conf.d/99-temp-mail-noninteractive.conf <<'EOF'
$nrconf{ui} = 'none';
$nrconf{restart} = 'a';
$nrconf{kernelhints} = -1;
EOF
}

APT_INSTALL_ARGS=(
    -yq
    -o Dpkg::Options::=--force-confdef
    -o Dpkg::Options::=--force-confold
    -o DPkg::Lock::Timeout=120
)

apt_update() {
    wait_for_apt_lock
    apt-get -yq update </dev/null
}

apt_install() {
    wait_for_apt_lock
    apt-get "${APT_INSTALL_ARGS[@]}" install "$@" </dev/null
}

apt_remove() {
    wait_for_apt_lock
    apt-get "${APT_INSTALL_ARGS[@]}" remove "$@" </dev/null
}

echo -e "${YELLOW}[1/8] Preparing system...${NC}"
configure_needrestart_noninteractive
wait_for_apt_lock
apt_update
wait_for_apt_lock
apt_install curl git

echo -e "${YELLOW}[2/8] Installing Node.js 20...${NC}"
# Remove old nodejs if exists
apt_remove nodejs npm || true

# Install Node.js 20 from NodeSource
wait_for_apt_lock
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
wait_for_apt_lock
apt_install nodejs

# Verify Node.js version
NODE_VERSION=$(node -v 2>/dev/null || echo "none")
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

if [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
    echo -e "${RED}Failed to install Node.js 20. Current version: $NODE_VERSION${NC}"
    echo -e "${YELLOW}Trying alternative method...${NC}"
    # Alternative: use n version manager
    npm install -g n || true
    n 20 || true
    NODE_VERSION=$(node -v 2>/dev/null || echo "none")
    echo -e "${GREEN}Node.js version after retry: $NODE_VERSION${NC}"
fi

echo -e "${YELLOW}[3/8] Installing Nginx...${NC}"
wait_for_apt_lock
apt_install nginx

# Install PM2
echo -e "${YELLOW}[4/8] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo -e "${YELLOW}[5/8] Creating user and directories...${NC}"
# Create user if not exists
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/false $USER
fi

# Create directories
mkdir -p $INSTALL_DIR
mkdir -p $DATA_DIR
chown -R $USER:$USER $DATA_DIR

echo -e "${YELLOW}[6/8] Cloning repository...${NC}"
cd /tmp
rm -rf halo-s-pal
git clone https://github.com/Senjakun/halo-s-pal.git
cd halo-s-pal

echo -e "${YELLOW}[7/8] Building frontend...${NC}"
npm install
npm run build

echo -e "${YELLOW}[8/8] Setting up backend...${NC}"
# Copy files
cp -r server/* $INSTALL_DIR/
cp -r dist $INSTALL_DIR/

cd $INSTALL_DIR
npm install --production

# Set permissions
chown -R $USER:$USER $INSTALL_DIR

echo -e "${YELLOW}Setting up PM2...${NC}"
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

echo -e "${YELLOW}Setting up Nginx...${NC}"
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
rm -rf /tmp/halo-s-pal

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
