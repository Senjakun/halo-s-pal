/**
 * SENA MAIL SERVER
 * ================
 * Catch-all email server dengan web interface
 * Untuk VPS Ubuntu 22
 *
 * Fitur:
 * - SMTP Server (port 25) untuk menerima email
 * - Web Server (port 3000) untuk mailbox interface
 * - SQLite database untuk penyimpanan email
 * - Tanpa login - masukkan email@domain langsung lihat inbox
 */

const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const Database = require('better-sqlite3');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// ==================== KONFIGURASI ====================
const CONFIG = {
  WEB_PORT: process.env.WEB_PORT || 3000,
  SMTP_PORT: process.env.SMTP_PORT || 25,
  DB_PATH: process.env.DB_PATH || './data/emails.db',
  MAX_EMAIL_SIZE: 10 * 1024 * 1024, // 10MB
  EMAIL_RETENTION_DAYS: 7, // Hapus email setelah 7 hari
  ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : ['*'], // '*' = semua domain
};

// ==================== DATABASE SETUP ====================
// Buat folder data jika belum ada
const dataDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(CONFIG.DB_PATH);

// Buat tabel emails
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    from_name TEXT,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    attachments TEXT,
    is_read INTEGER DEFAULT 0,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_to_email ON emails(to_email);
  CREATE INDEX IF NOT EXISTS idx_received_at ON emails(received_at);
`);

console.log('📦 Database initialized');

// ==================== SMTP SERVER ====================
const smtpServer = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['AUTH'],
  size: CONFIG.MAX_EMAIL_SIZE,

  // Validasi penerima
  onRcptTo(address, session, callback) {
    const domain = address.address.split('@')[1];

    if (CONFIG.ALLOWED_DOMAINS[0] !== '*' && !CONFIG.ALLOWED_DOMAINS.includes(domain)) {
      return callback(new Error('Domain tidak diizinkan'));
    }

    callback();
  },

  // Terima dan simpan email
  onData(stream, session, callback) {
    let emailData = '';

    stream.on('data', (chunk) => {
      emailData += chunk.toString();
    });

    stream.on('end', async () => {
      try {
        const parsed = await simpleParser(emailData);

        // Ambil penerima dari envelope
        const recipients = session.envelope.rcptTo.map(r => r.address.toLowerCase());

        // Simpan email untuk setiap penerima
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO emails
          (message_id, from_name, from_email, to_email, subject, body_text, body_html, attachments)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const toEmail of recipients) {
          const attachments = parsed.attachments?.map(a => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size
          })) || [];

          insertStmt.run(
            parsed.messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            parsed.from?.value?.[0]?.name || '',
            parsed.from?.value?.[0]?.address || 'unknown@unknown.com',
            toEmail,
            parsed.subject || '(No Subject)',
            parsed.text || '',
            parsed.html || parsed.textAsHtml || '',
            JSON.stringify(attachments)
          );
        }

        console.log(`📧 Email diterima: ${parsed.from?.value?.[0]?.address} -> ${recipients.join(', ')}`);
        callback();

      } catch (err) {
        console.error('❌ Error parsing email:', err.message);
        callback(new Error('Error processing email'));
      }
    });
  }
});

smtpServer.on('error', (err) => {
  console.error('❌ SMTP Error:', err.message);
});

// ==================== WEB SERVER ====================
const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get emails untuk alamat tertentu
app.get('/api/emails/:address', (req, res) => {
  const address = req.params.address.toLowerCase();

  const emails = db.prepare(`
    SELECT id, from_name, from_email, subject,
           substr(body_text, 1, 200) as preview,
           is_read, received_at
    FROM emails
    WHERE to_email = ?
    ORDER BY received_at DESC
    LIMIT 50
  `).all(address);

  res.json(emails);
});

// API: Get single email detail
app.get('/api/email/:id', (req, res) => {
  const email = db.prepare(`
    SELECT * FROM emails WHERE id = ?
  `).get(req.params.id);

  if (!email) {
    return res.status(404).json({ error: 'Email tidak ditemukan' });
  }

  // Mark as read
  db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').run(req.params.id);

  email.attachments = JSON.parse(email.attachments || '[]');
  res.json(email);
});

// API: Delete email
app.delete('/api/email/:id', (req, res) => {
  db.prepare('DELETE FROM emails WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// API: Get stats
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_emails,
      COUNT(DISTINCT to_email) as unique_addresses,
      COUNT(DISTINCT from_email) as unique_senders
    FROM emails
  `).get();

  res.json(stats);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== CLEANUP JOB ====================
function cleanupOldEmails() {
  const deleted = db.prepare(`
    DELETE FROM emails
    WHERE received_at < datetime('now', '-${CONFIG.EMAIL_RETENTION_DAYS} days')
  `).run();

  if (deleted.changes > 0) {
    console.log(`🗑️ Deleted ${deleted.changes} old emails`);
  }
}

// Jalankan cleanup setiap jam
setInterval(cleanupOldEmails, 60 * 60 * 1000);

// ==================== START SERVERS ====================
smtpServer.listen(CONFIG.SMTP_PORT, () => {
  console.log(`📮 SMTP Server running on port ${CONFIG.SMTP_PORT}`);
});

app.listen(CONFIG.WEB_PORT, () => {
  console.log(`🌐 Web Server running on http://localhost:${CONFIG.WEB_PORT}`);
  console.log(`\n✅ Sena Mail Server siap!`);
  console.log(`   - Buka http://YOUR-IP:${CONFIG.WEB_PORT} di browser`);
  console.log(`   - Setting MX record domain ke IP server ini\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  smtpServer.close();
  db.close();
  process.exit(0);
});
