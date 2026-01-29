const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || './data';
const CLEANUP_DAYS = parseInt(process.env.CLEANUP_DAYS || '7');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new Database(path.join(DATA_DIR, 'emails.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    to_name TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    preview TEXT,
    folder TEXT DEFAULT 'inbox',
    is_read INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    labels TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_emails_to_email ON emails(to_email);
  CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp);
  
  CREATE TABLE IF NOT EXISTS email_attachments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
  );
`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// Generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============= API Routes =============

// Get emails by recipient address
app.get('/api/emails', (req, res) => {
  try {
    const { to_email } = req.query;
    
    if (!to_email) {
      return res.status(400).json({ error: 'to_email parameter required' });
    }

    const emails = db.prepare(`
      SELECT * FROM emails 
      WHERE LOWER(to_email) = LOWER(?) 
      ORDER BY timestamp DESC
    `).all(to_email);

    res.json(emails.map(email => ({
      ...email,
      is_read: Boolean(email.is_read),
      is_starred: Boolean(email.is_starred),
      labels: email.labels ? JSON.parse(email.labels) : []
    })));
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get single email
app.get('/api/emails/:id', (req, res) => {
  try {
    const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({
      ...email,
      is_read: Boolean(email.is_read),
      is_starred: Boolean(email.is_starred),
      labels: email.labels ? JSON.parse(email.labels) : []
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Create new email (for receiving emails from external sources)
app.post('/api/emails', (req, res) => {
  try {
    const { from_name, from_email, to_name, to_email, subject, body, preview } = req.body;
    
    if (!from_email || !to_email || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO emails (id, from_name, from_email, to_name, to_email, subject, body, preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, from_name || from_email.split('@')[0], from_email, to_name, to_email, subject, body, preview || body.substring(0, 100));

    res.status(201).json({ id, message: 'Email created' });
  } catch (error) {
    console.error('Error creating email:', error);
    res.status(500).json({ error: 'Failed to create email' });
  }
});

// Update email (mark as read, star, move to folder)
app.patch('/api/emails/:id', (req, res) => {
  try {
    const { is_read, is_starred, folder } = req.body;
    const updates = [];
    const values = [];

    if (is_read !== undefined) {
      updates.push('is_read = ?');
      values.push(is_read ? 1 : 0);
    }
    if (is_starred !== undefined) {
      updates.push('is_starred = ?');
      values.push(is_starred ? 1 : 0);
    }
    if (folder !== undefined) {
      updates.push('folder = ?');
      values.push(folder);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const stmt = db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ message: 'Email updated' });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Delete email
app.delete('/api/emails/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM emails WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ message: 'Email deleted' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

// Get attachments for an email
app.get('/api/emails/:id/attachments', (req, res) => {
  try {
    const attachments = db.prepare('SELECT * FROM email_attachments WHERE email_id = ?').all(req.params.id);
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const totalEmails = db.prepare('SELECT COUNT(*) as count FROM emails').get();
    const totalDomains = db.prepare('SELECT COUNT(DISTINCT SUBSTR(to_email, INSTR(to_email, "@") + 1)) as count FROM emails').get();
    const dbSize = fs.statSync(path.join(DATA_DIR, 'emails.db')).size;

    res.json({
      total_emails: totalEmails.count,
      total_domains: totalDomains.count,
      db_size_mb: (dbSize / 1024 / 1024).toFixed(2),
      cleanup_days: CLEANUP_DAYS
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= Auto Cleanup =============

function cleanupOldEmails() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
    
    const result = db.prepare(`
      DELETE FROM emails 
      WHERE timestamp < datetime(?)
    `).run(cutoffDate.toISOString());

    if (result.changes > 0) {
      console.log(`[Cleanup] Deleted ${result.changes} emails older than ${CLEANUP_DAYS} days`);
    }
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldEmails, 60 * 60 * 1000);
// Run cleanup on startup
cleanupOldEmails();

// ============= SPA Fallback =============

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============= Start Server =============

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         📧 Temporary Mail Server                  ║
╠═══════════════════════════════════════════════════╣
║  Server running on http://0.0.0.0:${PORT}            ║
║  Data directory: ${DATA_DIR}                        
║  Auto cleanup: ${CLEANUP_DAYS} days                           ║
║  Memory optimized for 1GB RAM VPS                 ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});
