const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:PG18_Admin_9a8f7d@65.75.201.219:5432/fama_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err.message);
});

// Initialize tables if not exist and seed from store if empty
async function initDb(initialStore) {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "KPFAMA_tasks" (
            id VARCHAR(100) PRIMARY KEY,
            ref VARCHAR(100),
            title TEXT NOT NULL,
            recipient_category VARCHAR(50),
            recipient_role VARCHAR(200),
            officer VARCHAR(200),
            officer_id VARCHAR(100),
            email VARCHAR(200),
            department VARCHAR(200),
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            status_text VARCHAR(100),
            sla_days INT DEFAULT 3,
            sla_status VARCHAR(100),
            date_issued VARCHAR(100),
            minit TEXT,
            progress INT DEFAULT 0,
            last_update VARCHAR(100),
            notes TEXT,
            action_report TEXT,
            source_email_id VARCHAR(100),
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "KPFAMA_emails" (
            id VARCHAR(100) PRIMARY KEY,
            ref VARCHAR(100),
            subject TEXT,
            sender TEXT,
            sender_name TEXT,
            date VARCHAR(100),
            raw_date TEXT,
            priority VARCHAR(50),
            priority_class VARCHAR(50),
            status VARCHAR(50),
            ai TEXT,
            body TEXT,
            clean_body TEXT,
            raw_headers TEXT,
            attachments JSONB,
            minit TEXT,
            assigned_to TEXT,
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "KPFAMA_sheets" (
            id VARCHAR(100) PRIMARY KEY,
            ref VARCHAR(100),
            timestamp VARCHAR(100),
            subject TEXT,
            sender TEXT,
            assigned_to TEXT,
            dg_minit TEXT,
            priority VARCHAR(50),
            status VARCHAR(100),
            sla_date VARCHAR(100),
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "KPFAMA_logs" (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            user_action TEXT,
            category VARCHAR(100),
            status VARCHAR(50),
            details JSONB
        );

        CREATE TABLE IF NOT EXISTS "KPFAMA_settings" (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Check if tasks table is empty
      const countRes = await client.query('SELECT COUNT(*) FROM "KPFAMA_tasks"');
      const count = parseInt(countRes.rows[0].count, 10);

      if (count === 0 && initialStore && initialStore.tasks && initialStore.tasks.length > 0) {
        console.log(`[DB] Seeding KPFAMA_* tables with ${initialStore.tasks.length} initial directives...`);
        for (const t of initialStore.tasks) {
          await client.query(`
            INSERT INTO "KPFAMA_tasks" 
            (id, ref, title, recipient_category, recipient_role, officer, officer_id, email, department, status, status_text, sla_days, sla_status, date_issued, minit, progress, last_update, notes, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO NOTHING
          `, [
            String(t.id), t.ref || '', t.title || '', t.recipientCategory || '', t.recipientRole || '',
            t.officer || '', t.officerId || '', t.email || '', t.department || '', t.status || 'pending',
            t.statusText || '', t.slaDays || 0, t.slaStatus || '', t.dateIssued || '', t.minit || '',
            t.progress || 0, t.lastUpdate || '', t.notes || '', JSON.stringify(t)
          ]);
        }

        if (initialStore.emails && initialStore.emails.length > 0) {
          for (const e of initialStore.emails) {
            await client.query(`
              INSERT INTO "KPFAMA_emails"
              (id, ref, subject, sender, sender_name, date, raw_date, priority, priority_class, status, ai, body, clean_body, raw_headers, attachments, minit, assigned_to, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              ON CONFLICT (id) DO NOTHING
            `, [
              String(e.id), e.ref || '', e.subject || '', e.sender || '', e.senderName || '', e.date || '',
              e.rawDate || '', e.priority || '', e.priorityClass || '', e.status || '', e.ai || '',
              e.body || '', e.cleanBody || '', e.rawHeaders || '', JSON.stringify(e.attachments || []),
              e.minit || null, e.assignedTo || null, JSON.stringify(e)
            ]);
          }
        }

        if (initialStore.sheets && initialStore.sheets.length > 0) {
          for (const s of initialStore.sheets) {
            await client.query(`
              INSERT INTO "KPFAMA_sheets"
              (id, ref, timestamp, subject, sender, assigned_to, dg_minit, priority, status, sla_date, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO NOTHING
            `, [
              String(s.ref || Math.random()), s.ref || '', s.timestamp || '', s.subject || '',
              s.sender || '', s.assignedTo || '', s.dgMinit || '', s.priority || '',
              s.status || '', s.slaDate || '', JSON.stringify(s)
            ]);
          }
        }
        console.log(`[DB] Seeding completed successfully into KPFAMA_* tables.`);
      }

      console.log(`[DB] KPFAMA PostgreSQL connected & verified.`);
    } finally {
      client.release();
    }
    return true;
  } catch (err) {
    console.error(`[DB] Warning: PostgreSQL not reachable (${err.message}). Using local JSON store.`);
    return false;
  }
}

// Load store from PostgreSQL
async function loadStoreFromDb() {
  try {
    const tasksRes = await pool.query('SELECT raw_data FROM "KPFAMA_tasks" ORDER BY updated_at DESC');
    const emailsRes = await pool.query('SELECT raw_data FROM "KPFAMA_emails" ORDER BY created_at DESC');
    const sheetsRes = await pool.query('SELECT raw_data FROM "KPFAMA_sheets" ORDER BY created_at DESC');
    const logsRes = await pool.query('SELECT * FROM "KPFAMA_logs" ORDER BY id DESC LIMIT 50');

    return {
      tasks: tasksRes.rows.map(r => r.raw_data),
      emails: emailsRes.rows.map(r => r.raw_data),
      sheets: sheetsRes.rows.map(r => r.raw_data),
      logs: logsRes.rows.map(r => ({
        time: r.timestamp,
        text: r.user_action,
        status: r.status,
        color: r.category
      }))
    };
  } catch (e) {
    console.error('[DB] Failed to load store from PostgreSQL:', e.message);
    return null;
  }
}

// Save or update a single task
async function upsertTaskInDb(task) {
  try {
    await pool.query(`
      INSERT INTO "KPFAMA_tasks" 
      (id, ref, title, recipient_category, recipient_role, officer, officer_id, email, department, status, status_text, sla_days, sla_status, date_issued, minit, progress, last_update, notes, raw_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        status_text = EXCLUDED.status_text,
        progress = EXCLUDED.progress,
        sla_status = EXCLUDED.sla_status,
        last_update = EXCLUDED.last_update,
        notes = EXCLUDED.notes,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
    `, [
      String(task.id), task.ref || '', task.title || '', task.recipientCategory || '', task.recipientRole || '',
      task.officer || '', task.officerId || '', task.email || '', task.department || '', task.status || 'pending',
      task.statusText || '', task.slaDays || 0, task.slaStatus || '', task.dateIssued || '', task.minit || '',
      task.progress || 0, task.lastUpdate || '', task.notes || '', JSON.stringify(task)
    ]);
  } catch (e) {
    console.error('[DB] Error upserting task in KPFAMA_tasks:', e.message);
  }
}

// Save or update a single sheet row
async function upsertSheetInDb(sheet) {
  try {
    await pool.query(`
      INSERT INTO "KPFAMA_sheets" 
      (id, ref, timestamp, subject, sender, assigned_to, dg_minit, priority, status, sla_date, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        raw_data = EXCLUDED.raw_data
    `, [
      String(sheet.ref || Math.random()), sheet.ref || '', sheet.timestamp || '', sheet.subject || '',
      sheet.sender || '', sheet.assignedTo || '', sheet.dgMinit || '', sheet.priority || '',
      sheet.status || '', sheet.slaDate || '', JSON.stringify(sheet)
    ]);
  } catch (e) {
    console.error('[DB] Error upserting sheet in KPFAMA_sheets:', e.message);
  }
}

// Save activity log
async function logActivityInDb(action, category, status, details = {}) {
  try {
    await pool.query(`
      INSERT INTO "KPFAMA_logs" (user_action, category, status, details)
      VALUES ($1, $2, $3, $4)
    `, [action, category, status, JSON.stringify(details)]);
  } catch (e) {
    console.error('[DB] Error writing to KPFAMA_logs:', e.message);
  }
}

module.exports = {
  pool,
  initDb,
  loadStoreFromDb,
  upsertTaskInDb,
  upsertSheetInDb,
  logActivityInDb
};
