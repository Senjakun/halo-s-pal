# 📮 Sena Mail Server

Catch-all email server dengan web interface untuk VPS Ubuntu 22.
Mirip seperti zync.site - tanpa login, cukup masukkan email@domain dan lihat inbox.

---

## 🚀 INSTALL SEKALI JALAN (Copy-Paste)

SSH ke VPS Ubuntu 22 Anda, lalu jalankan command ini:

```bash
curl -fsSL https://raw.githubusercontent.com/Senjakun/halo-s-pal/main/vps-mail-server/install.sh | sudo bash
```

Script akan meminta:
- 🌐 **Domain** - Domain untuk mail server (contoh: `example.com`)
- ✨ **Nama Website** - Nama yang tampil di header (contoh: `My Mail Hub`)
- 👤 **Nama Author** - Nama untuk credits di footer

Setelah selesai, tinggal setup DNS dan website langsung jalan!

---

## ✨ Fitur

- 📧 **Temporary Mail** - Terima email tanpa registrasi
- 🔐 **2FA / TOTP Generator** - Generate kode autentikasi
- 🔑 **Password Generator** - Buat password aman
- 📍 **Address Generator** - Generate alamat US random
- 🔄 **Auto Cleanup** - Email dihapus otomatis setelah 7 hari
- ⚡ **Real-time** - Auto-refresh inbox setiap 10 detik
- 🌐 **Multi-domain** - Terima email dari domain manapun

---

## 📋 Manual Installation

### Step 1: Persiapan Server

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools untuk better-sqlite3
sudo apt install -y build-essential python3

# Install Nginx
sudo apt install -y nginx

# Verifikasi instalasi
node --version  # Harus v20.x
npm --version
```

### Step 2: Clone & Install Aplikasi

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/Senjakun/halo-s-pal.git sena-mail
cd sena-mail/vps-mail-server

# Install dependencies
sudo npm install

# Buat folder data
sudo mkdir -p data
```

### Step 3: Setup Systemd Service

```bash
sudo nano /etc/systemd/system/sena-mail.service
```

Paste konten berikut:

```ini
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
```

Enable dan start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable sena-mail
sudo systemctl start sena-mail
```

### Step 4: Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/sena-mail
```

Paste konten berikut (ganti `example.com` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -sf /etc/nginx/sites-available/sena-mail /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Setup SSL (Opsional tapi Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

---

## 🌐 DNS Setup

Untuk menerima email, setup DNS di domain Anda:

### MX Record
| Type | Host | Value | Priority |
|------|------|-------|----------|
| MX | @ | mail.yourdomain.com | 10 |

### A Record
| Type | Host | Value |
|------|------|-------|
| A | mail | IP_VPS_ANDA |
| A | @ | IP_VPS_ANDA |

### Jika menggunakan Cloudflare:
- Set A record untuk `mail` ke **DNS only** (grey cloud)
- MX record tidak bisa diproxy

---

## 🔧 Konfigurasi

Environment variables yang tersedia:

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_PORT` | 3000 | Port web server |
| `SMTP_PORT` | 25 | Port SMTP server |
| `DB_PATH` | ./data/emails.db | Path database SQLite |
| `ALLOWED_DOMAINS` | * | Domain yang diizinkan (pisahkan dengan koma, atau * untuk semua) |

---

## 📊 Monitoring

```bash
# Status service
sudo systemctl status sena-mail

# Logs
sudo journalctl -u sena-mail -f

# Restart
sudo systemctl restart sena-mail
```

---

## 🔐 Firewall

Pastikan port berikut terbuka:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 25/tcp
sudo ufw enable
```

---

## 🐛 Troubleshooting

### Port 25 sudah digunakan
```bash
sudo lsof -i :25
sudo kill -9 <PID>
```

### Database error
```bash
cd /opt/sena-mail/vps-mail-server
rm -rf data/emails.db
sudo systemctl restart sena-mail
```

### SMTP tidak bisa terima email
- Pastikan port 25 tidak diblokir oleh provider VPS
- Beberapa provider (AWS, Google Cloud) memblokir port 25 by default
- Cek dengan: `telnet mail.yourdomain.com 25`

---

## 📄 License

MIT License
