# 📧 Temporary Mail Portal

Portal email sementara yang ringan dan efisien untuk VPS dengan RAM rendah (1GB).

## ✨ Fitur

- ✅ **Multi-domain support** - Terima email dari domain manapun
- ✅ **File-based storage** - SQLite database, ringan dan cepat
- ✅ **Auto cleanup** - Hapus email otomatis setelah 7 hari
- ✅ **Memory efficient** - Optimized untuk VPS 1GB RAM
- ✅ **No authentication** - Langsung cek inbox tanpa login
- ✅ **Modern UI** - Tampilan seperti Zync.site

## 📋 Requirements

- Node.js 18+ 
- VPS dengan minimal 1GB RAM
- Domain yang pointing ke IP VPS

## 🚀 Quick Install (VPS)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/your-portal-mail.git
cd your-portal-mail
```

### 2. Install Dependencies & Build Frontend

```bash
# Install frontend dependencies
npm install

# Build frontend
npm run build

# Copy build ke server folder
cp -r dist server/
```

### 3. Setup Backend

```bash
cd server

# Install server dependencies
npm install

# Start server
npm start
```

Server akan berjalan di port 3001.

### 4. Setup dengan PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server dengan PM2
cd server
pm2 start index.js --name "temp-mail"

# Auto start on boot
pm2 startup
pm2 save
```

### 5. Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mail
```

Paste konfigurasi ini:

```nginx
server {
    listen 80;
    server_name mail.yourdomain.com yourdomain.com;

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
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/mail /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mail.yourdomain.com
```

## 📝 One-Line Install Script

Jalankan ini di VPS baru:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/your-portal-mail/main/install.sh | sudo bash
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Port server |
| `DATA_DIR` | ./data | Direktori penyimpanan database |
| `CLEANUP_DAYS` | 7 | Hapus email setelah X hari |

Contoh:

```bash
PORT=3001 DATA_DIR=/var/lib/tempmail CLEANUP_DAYS=7 node index.js
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails?to_email=xxx` | Get emails by recipient |
| GET | `/api/emails/:id` | Get single email |
| POST | `/api/emails` | Create new email |
| PATCH | `/api/emails/:id` | Update email (read/star/folder) |
| DELETE | `/api/emails/:id` | Delete email |
| GET | `/api/stats` | Get server stats |
| GET | `/api/health` | Health check |

## 📧 Menerima Email dari Luar

Untuk menerima email asli, kamu perlu setup MTA (Mail Transfer Agent) seperti Postfix:

### Setup Postfix

```bash
sudo apt install postfix
```

Pilih "Internet Site" dan masukkan domain kamu.

### Konfigurasi Postfix

Edit `/etc/postfix/main.cf`:

```
myhostname = mail.yourdomain.com
mydestination = $myhostname, yourdomain.com, localhost
mynetworks = 127.0.0.0/8
```

### Script untuk Forward Email ke API

Buat file `/usr/local/bin/mail-to-api.sh`:

```bash
#!/bin/bash
# Parse email dan kirim ke API
# Implementasi tergantung kebutuhan
```

## 📊 Monitoring

```bash
# Check status
pm2 status

# Check logs
pm2 logs temp-mail

# Check memory usage
pm2 monit
```

## 🔒 Security Notes

- Aplikasi ini **tidak memiliki authentication**
- Siapapun bisa melihat email dari alamat manapun
- Gunakan untuk **temporary/disposable email** saja
- Jangan gunakan untuk email sensitif

## 📁 Struktur Folder

```
your-portal-mail/
├── src/                 # Frontend source
├── server/              # Backend server
│   ├── index.js         # Express server
│   ├── package.json     
│   └── data/            # SQLite database
│       └── emails.db
├── dist/                # Built frontend
└── README.md
```

## 🐛 Troubleshooting

### Port sudah digunakan

```bash
# Cek proses di port 3001
lsof -i :3001

# Kill jika perlu
kill -9 <PID>
```

### Database error

```bash
# Reset database
rm server/data/emails.db
pm2 restart temp-mail
```

### Memory tinggi

```bash
# Restart server
pm2 restart temp-mail

# Cek memory
free -h
```

## 📄 License

MIT License
