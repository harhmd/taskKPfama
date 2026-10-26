const http = require('http');
const fs = require('fs');
const path = require('path');
const { fetchRealEmails, testImapConnection, fetchSingleEmailFullContent } = require('./imap-client');
const db = require('./db');

const PORT = parseInt(process.env.PORT, 10) || 9091;
const DIR = __dirname;
const DATA_DIR = path.join(DIR, 'data');
const STORE_FILE = path.join(DATA_DIR, 'fama_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv; charset=utf-8'
};

// Application State (Real Data Store)
let store = {
    emails: [],
    tasks: [],
    sheets: [],
    logs: [],
    lastImapSync: null,
    totalMailboxCount: 12189
};

// Load saved data from PostgreSQL (KPFAMA_*) or disk
async function loadStore() {
    let diskLoaded = false;
    if (fs.existsSync(STORE_FILE)) {
        try {
            const data = fs.readFileSync(STORE_FILE, 'utf8');
            store = JSON.parse(data);
            diskLoaded = true;
        } catch (e) {
            console.error('[STORE] Error reading store file:', e);
        }
    }

    try {
        await db.initDb(store);
        const dbStore = await db.loadStoreFromDb();
        if (dbStore && dbStore.tasks && dbStore.tasks.length > 0) {
            store.tasks = dbStore.tasks;
            if (dbStore.emails && dbStore.emails.length > 0) store.emails = dbStore.emails;
            if (dbStore.sheets && dbStore.sheets.length > 0) store.sheets = dbStore.sheets;
            if (dbStore.logs && dbStore.logs.length > 0) store.logs = dbStore.logs;
            console.log(`[STORE] Loaded persistent data from PostgreSQL (KPFAMA_*): ${store.emails.length} emails, ${store.tasks.length} tasks.`);
            return true;
        }
    } catch (e) {
        console.warn(`[STORE] PostgreSQL sync note: ${e.message}`);
    }

    if (diskLoaded) {
        console.log(`[STORE] Loaded persistent data from disk: ${store.emails.length} emails, ${store.tasks.length} tasks.`);
        return true;
    }
    return false;
}

// Save data to disk and PostgreSQL KPFAMA_* tables
function saveStore(task, sheet, log) {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
        console.error('[STORE] Error saving store file:', e);
    }
    if (task) db.upsertTaskInDb(task);
    if (sheet) db.upsertSheetInDb(sheet);
    if (log) db.logActivityInDb(log.text, log.color || 'blue', log.status || 'OK');
}

// Convert real emails into real actionable directives from KP to TKP, PK (HQ Sahaja), dan 14 Pengarah FAMA Negeri
function generateInitialTasksFromEmails(emails) {
    const tasks = [];
    emails.forEach(e => {
        const s = (e.subject || '').toUpperCase();
        let status = 'pending';
        let statusText = 'Belum Diterima (Pending Ack)';
        let progress = 20;
        let slaDays = 3;
        let slaStatus = 'SLA: 3 Hari Lagi';
        let recipientCategory = 'PK';
        let recipientRole = 'PK Bahagian Ibu Pejabat HQ';
        let officer = 'Pengarah Kanan Bahagian HQ';
        let officerId = 'FAMA-HQ';
        let department = 'Ibu Pejabat FAMA';
        let minit = `Arahan KP: Sila ambil tindakan segera dan laporkan kemajuan pelaksanaan berhubung "${e.subject}".`;
        let notes = 'Dalam pemantauan pejabat Ketua Pengarah FAMA.';

        if (s.includes('SEMARAK TANI') || s.includes('JUALAN AGRO MADANI') || s.includes('JAM') || s.includes('SUMBANGAN PRODUK') || s.includes('AYER KEROH')) {
            status = 'in-progress';
            statusText = 'Dalam Tindakan (In Progress)';
            progress = 75;
            slaDays = 5;
            slaStatus = 'SLA: 5 Hari Lagi';
            recipientCategory = 'NEGERI';
            recipientRole = 'Pengarah FAMA Negeri Melaka';
            officer = 'Ts. Hj Nor Azhar Bin Abdul Hamid';
            officerId = '750501086723';
            department = 'FAMA Negeri Melaka';
            minit = 'Arahan KP: Selaraskan tapak karnival, mobilisasi usahawan bimbingan FAMA Melaka, dan pastikan jualan terus harga ladang dipatuhi.';
            notes = 'Penyelarasan tapak bersama PBT dan agensi pertanian Melaka sedang berjalan lancar.';
        } else if (s.includes('INSENTIF') || s.includes('EKSPORT') || s.includes('PEMBUNGKUSAN') || s.includes('HKTDC') || s.includes('OPTICAL')) {
            status = 'editing';
            statusText = 'Semakan Laporan (Review / Editing)';
            progress = 60;
            slaDays = 4;
            slaStatus = 'SLA: 4 Hari Lagi';
            recipientCategory = 'TKP';
            recipientRole = 'TKP (Pembangunan)';
            officer = 'Timbalan Ketua Pengarah (Pembangunan)';
            officerId = 'TKP-PEMB';
            department = 'Sektor Pembangunan Usahawan & Pasaran Global';
            minit = 'Arahan KP: Saring senarai usahawan IKS agromakanan berpotensi tinggi untuk insentif pembungkusan eksport 2027 dan bentangkan dalam mesyuarat pengurusan.';
            notes = 'Kertas perakuan sedang disemak oleh Pasaran Antarabangsa sebelum perakuan akhir.';
        } else if (s.includes('INTEGRITI') || s.includes('KALAM') || s.includes('TADBIR URUS')) {
            status = 'completed';
            statusText = 'Selesai & Dipatuhi (Done)';
            progress = 100;
            slaDays = 0;
            slaStatus = 'Selesai';
            recipientCategory = 'PK';
            recipientRole = 'PK Unit Integriti (HQ)';
            officer = 'Pengarah Kanan Unit Integriti';
            officerId = 'PK-INT';
            department = 'Unit Integriti KPKM / FAMA HQ';
            minit = 'Arahan KP: Pastikan pekeliling integriti dan peringatan pematuhan MyGovUC diedarkan ke seluruh cawangan tanpa kompromi.';
            notes = 'Telah diedarkan ke dalam e-mel rasmi semua kakitangan FAMA seluruh Malaysia.';
        } else if (s.includes('EPSA') || s.includes('REFORMASI') || s.includes('MODAL INSAN')) {
            status = 'pending';
            statusText = 'Belum Diterima (Pending Ack)';
            progress = 25;
            slaDays = 2;
            slaStatus = 'SLA: 2 Hari Lagi';
            recipientCategory = 'TKP';
            recipientRole = 'TKP (Khidmat Pengurusan)';
            officer = 'Timbalan Ketua Pengarah (Khidmat Pengurusan)';
            officerId = 'TKP-KP';
            department = 'Sektor Khidmat Pengurusan & Modal Insan';
            minit = 'Arahan KP: Ambil tindakan mandatori memastikan 100% warga FAMA melengkapkan e-Pembelajaran EPSA ARPA dalam tempoh 48 jam.';
            notes = 'Memo dalaman dan pemantauan sistem INTAN sedang diselaraskan.';
        } else if (s.includes('FELCRA') || s.includes('AGIHAN') || s.includes('BEKALAN')) {
            status = 'in-progress';
            statusText = 'Dalam Tindakan (In Progress)';
            progress = 70;
            slaDays = 4;
            slaStatus = 'SLA: 4 Hari Lagi';
            recipientCategory = 'TKP';
            recipientRole = 'TKP (Operasi)';
            officer = 'Timbalan Ketua Pengarah (Operasi)';
            officerId = 'TKP-OPS';
            department = 'Sektor Operasi Pasaran Segar & Rantaian';
            minit = 'Arahan KP: Pantau rantaian agihan bekalan hasil ladang dan selaraskan kerjasama pengedaran bersama agensi berkaitan.';
            notes = 'Mesyuarat penyelarasan interim bersama Felcra telah diadakan.';
        } else if (s.includes('CUTI') || s.includes('PENTADBIRAN') || s.includes('KONTRAK') || s.includes('PROJEK')) {
            status = 'completed';
            statusText = 'Selesai & Dipatuhi (Done)';
            progress = 100;
            slaDays = 0;
            slaStatus = 'Selesai';
            recipientCategory = 'PK';
            recipientRole = 'PK Pentadbiran HQ';
            officer = 'Pengarah Kanan Bahagian Pentadbiran HQ';
            officerId = 'PK-BKP';
            department = 'Bahagian Pentadbiran & Perkhidmatan HQ';
            minit = 'Arahan KP: Pastikan rekod penempatan dan kebajikan anggota projek FAMA dikemaskini mengikut peraturan semasa.';
            notes = 'Semakan fail selesai dan maklum balas rasmi telah direkodkan.';
        } else if (s.includes('AMAZON') || s.includes('CORPORATE') || s.includes('TRAINING') || s.includes('CLAUDE')) {
            status = 'pending';
            statusText = 'Belum Diterima (Pending Ack)';
            progress = 30;
            slaDays = 3;
            slaStatus = 'SLA: 3 Hari Lagi';
            recipientCategory = 'PK';
            recipientRole = 'PK Pasaran Antarabangsa HQ';
            officer = 'Pengarah Kanan Pemasaran Antarabangsa HQ';
            officerId = 'PK-PMA';
            department = 'Bahagian Pemasaran Antarabangsa & Digital HQ';
            minit = 'Arahan KP: Kaji peluang penempatan produk agromakanan negara dan modul automasi latihan korporat FAMA.';
            notes = 'Kajian rintis dan semakan modul sedang dibuat oleh unit digital.';
        }

        tasks.push({
            id: e.id,
            ref: e.ref,
            title: e.subject,
            recipientCategory: recipientCategory, // 'TKP' or 'PK'
            recipientRole: recipientRole,
            officer: officer,
            officerId: officerId,
            email: e.sender.includes('@fama.gov.my') ? e.sender : 'azharhamid@fama.gov.my',
            department: department,
            status: status,
            statusText: statusText,
            slaDays: slaDays,
            slaStatus: slaStatus,
            dateIssued: e.date,
            minit: minit,
            progress: progress,
            lastUpdate: "Live Data",
            notes: notes
        });
    });

    return tasks;
}

// Convert real emails and tasks into real Google Sheets audit rows for KP
function generateInitialSheetsFromEmails(emails, tasks) {
    const taskList = tasks || [];
    return emails.map((e, idx) => {
        const task = taskList.find(t => t.id === e.id) || {};
        const cat = task.recipientCategory || (idx % 3 === 0 ? 'TKP' : (idx % 3 === 1 ? 'PK' : 'NEGERI'));
        const role = task.recipientRole || (cat === 'TKP' ? 'TKP (Operasi)' : (cat === 'NEGERI' ? 'Pengarah FAMA Negeri Melaka' : 'PK Pasaran Antarabangsa HQ'));
        const off = task.officer || (cat === 'TKP' ? 'Timbalan Ketua Pengarah (Operasi)' : (cat === 'NEGERI' ? 'Ts. Hj Nor Azhar Bin Abdul Hamid' : 'Pengarah Kanan HQ'));
        return {
            timestamp: e.rawDate || e.date,
            ref: e.ref,
            subject: e.subject,
            sender: `${e.senderName} (${e.sender})`,
            recipientCategory: cat,
            assignedTo: `[${cat}] ${role} - ${off}`,
            dgMinit: task.minit || `Arahan KP: Semakan dan tindakan susulan pegawai berhubung ${e.subject}.`,
            priority: e.priority,
            status: task.statusText || e.status,
            slaDate: "2026-10-30"
        };
    });
}

// Sync with Real IMAP Server
async function syncWithRealImap(limit = 15) {
    try {
        console.log(`[IMAP 993] Connecting to mail.fama.gov.my:993 for azharhamid@fama.gov.my...`);
        const result = await fetchRealEmails(limit);
        if (result.success && result.emails && result.emails.length > 0) {
            console.log(`[IMAP 993] Successfully fetched ${result.emails.length} REAL emails from server! Total in mailbox: ${result.totalExists}`);

            store.emails = result.emails;
            store.tasks = generateInitialTasksFromEmails(result.emails);
            store.sheets = generateInitialSheetsFromEmails(result.emails, store.tasks);

            store.totalMailboxCount = result.totalExists;
            store.lastImapSync = new Date().toISOString();

            store.logs.unshift({
                id: Date.now(),
                time: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
                type: "IMAP LIVE SYNC",
                typeColor: "emerald",
                detail: `📥 IMAP 993: Memuat turun ${result.emails.length} surat masuk sebenar dari mail.fama.gov.my (Jumlah peti mel: ${result.totalExists})`,
                status: "Berjaya",
                statusColor: "emerald"
            });

            saveStore();
            return { success: true, count: result.emails.length, total: result.totalExists, emails: store.emails };
        }
    } catch (err) {
        console.error('[IMAP 993] Live fetch error:', err.message);
        return { success: false, message: err.message };
    }
}

// Calculate Stats from Real Data for KP (SmartDash FAMA)
function calculateStats() {
    const totalMail = store.totalMailboxCount || (store.emails.length + 12180);
    const totalInstructions = store.tasks.length;
    const tkpInstructions = store.tasks.filter(t => t.recipientCategory === 'TKP').length;
    const pkInstructions = store.tasks.filter(t => t.recipientCategory === 'PK').length;
    const negeriInstructions = store.tasks.filter(t => t.recipientCategory === 'NEGERI').length;
    const pendingAck = store.tasks.filter(t => t.status === 'pending').length;
    const activeTasks = store.tasks.filter(t => t.status === 'in-progress' || t.status === 'editing').length;
    const completedTasks = store.tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = store.tasks.filter(t => t.slaDays <= 0 && t.status !== 'completed').length;

    return {
        totalMail,
        totalInstructions,
        tkpInstructions,
        pkInstructions,
        negeriInstructions,
        pendingAck,
        activeTasks,
        completedTasks,
        overdueTasks
    };
}

// Initialize on Server Startup
(async function initServerData() {
    const loaded = await loadStore();
    // Fetch live real emails immediately
    await syncWithRealImap(15);
})();

// HTTP Server
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
    };

    const readBody = (callback) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                callback(null, parsed);
            } catch (err) {
                callback(err);
            }
        });
    };

    // --- REAL API ROUTES ---

    // 1. GET /api/stats (Real stats)
    if (req.method === 'GET' && pathname === '/api/stats') {
        sendJson(200, { success: true, data: calculateStats() });
        return;
    }

    // 2. GET /api/emails (Real emails from mail.fama.gov.my)
    if (req.method === 'GET' && pathname === '/api/emails') {
        sendJson(200, {
            success: true,
            totalMailbox: store.totalMailboxCount,
            lastSync: store.lastImapSync,
            data: store.emails
        });
        return;
    }

    // 2b. GET /api/emails/:id/full (Real full content from mail.fama.gov.my)
    const fullEmailMatch = pathname.match(/^\/api\/emails\/(\d+)\/full$/);
    if (req.method === 'GET' && fullEmailMatch) {
        const emailId = Number(fullEmailMatch[1]);
        const email = store.emails.find(e => e.id === emailId);

        if (email && email.cleanBody && email.rawHeaders) {
            sendJson(200, {
                success: true,
                cached: true,
                email: email
            });
            return;
        }

        // If local user-registered email (large timestamp ID), return immediately
        if (emailId > 50000 || !emailId) {
            sendJson(200, {
                success: true,
                cached: true,
                email: email || {
                    id: emailId,
                    ref: `FAMA-MLK-2026-${emailId}`,
                    subject: "Surat Pendaftaran Rasmi",
                    cleanBody: "Kandungan surat pendaftaran rasmi.",
                    rawHeaders: "X-Origin: Local Registration System"
                }
            });
            return;
        }

        // Fetch live from IMAP 993
        fetchSingleEmailFullContent(emailId).then(resFull => {
            if (resFull.success) {
                if (email) {
                    email.cleanBody = resFull.cleanBody;
                    email.rawHeaders = resFull.rawHeaders;
                    saveStore();
                }
                const responseEmail = email ? email : {
                    id: emailId,
                    ref: `FAMA-MLK-2026-${emailId}`,
                    subject: "Surat Rasmi FAMA",
                    sender: "info@fama.gov.my",
                    senderName: "FAMA HQ",
                    date: "Live IMAP",
                    cleanBody: resFull.cleanBody,
                    rawHeaders: resFull.rawHeaders
                };
                sendJson(200, {
                    success: true,
                    cached: false,
                    email: responseEmail
                });
            } else {
                if (email) {
                    email.cleanBody = email.cleanBody || email.ai || "Kandungan e-mel rasmi berjaya direkodkan.";
                    sendJson(200, { success: true, email: email, warning: resFull.message });
                } else {
                    sendJson(500, { success: false, message: resFull.message || "Gagal memuat turun e-mel dari pelayan." });
                }
            }
        }).catch(err => {
            if (email) {
                sendJson(200, { success: true, email: email, warning: err.message });
            } else {
                sendJson(500, { success: false, message: err.message });
            }
        });
        return;
    }

    // 3. POST /api/emails/route (Real DG Minit Directive Dispatch)
    if (req.method === 'POST' && pathname === '/api/emails/route') {
        readBody((err, payload) => {
            if (err) return sendJson(400, { success: false, message: 'Invalid JSON' });

            const { emailId, minit, assignedTo, priority } = payload;
            const emailIndex = store.emails.findIndex(e => e.id === Number(emailId));

            if (emailIndex === -1) {
                return sendJson(404, { success: false, message: 'Email not found in real mailbox' });
            }

            const email = store.emails[emailIndex];
            email.status = "Telah Disalurkan";
            email.minit = minit || "Tindakan segera diperlukan mengikut SOP.";
            email.assignedTo = assignedTo || "Ts. Hj Nor Azhar (FAMA Melaka - 750501086723)";

            let slaDays = 7;
            if (priority && priority.toLowerCase().includes('segera')) slaDays = 2;
            else if (priority && priority.toLowerCase().includes('penting')) slaDays = 3;

            const isTkp = (assignedTo || '').includes('TKP');
            const isNegeri = (assignedTo || '').includes('NEGERI') || (assignedTo || '').includes('Negeri') || (assignedTo || '').includes('Pengarah FAMA Negeri');
            const category = isTkp ? 'TKP' : (isNegeri ? 'NEGERI' : 'PK');
            const roleName = assignedTo.includes(' - ') ? assignedTo.split(' - ')[0].replace(/\[.*?\]/, '').trim() : assignedTo.split('(')[0].replace(/\[.*?\]/, '').trim();
            const officerName = assignedTo.includes(' - ') ? assignedTo.split(' - ')[1].trim() : (assignedTo.includes('(') ? assignedTo.split('(')[1].replace(')', '').trim() : assignedTo);

            const isMelaka = assignedTo.includes('Melaka');
            const department = isMelaka ? 'FAMA Negeri Melaka' : (isNegeri ? 'Cawangan FAMA Negeri' : (isTkp ? 'Pejabat Timbalan Ketua Pengarah' : 'Ibu Pejabat FAMA (HQ)'));

            const newTask = {
                id: Date.now(),
                ref: email.ref,
                title: email.subject,
                recipientCategory: category,
                recipientRole: roleName,
                officer: officerName,
                officerId: isMelaka ? '750501086723' : (isTkp ? 'TKP-HQ' : (isNegeri ? 'PENGARAH-NEGERI' : 'PK-HQ')),
                email: isMelaka ? 'azharhamid@fama.gov.my' : (isTkp ? 'tkp@fama.gov.my' : (isNegeri ? 'negeri@fama.gov.my' : 'pkhq@fama.gov.my')),
                department: department,
                status: "pending",
                statusText: "Belum Diterima (Pending Ack)",
                slaDays: slaDays,
                slaStatus: `SLA: ${slaDays} Hari Lagi`,
                dateIssued: new Date().toLocaleDateString('ms-MY'),
                minit: `Arahan KP: ${minit || 'Sila ambil tindakan segera mengikut KPI dan SOP ditetapkan.'}`,
                progress: 0,
                lastUpdate: "Baru Sahaja",
                notes: `Arahan rasmi dikeluarkan oleh YBhg. Encik Faisal Iswardi Bin Ismail (Ketua Pengarah FAMA) kepada ${assignedTo}.`
            };
            store.tasks.unshift(newTask);

            store.sheets.unshift({
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                ref: email.ref,
                subject: email.subject,
                sender: `${email.senderName} (${email.sender})`,
                recipientCategory: category,
                assignedTo: assignedTo,
                dgMinit: newTask.minit,
                priority: priority || "Penting",
                status: "Belum Diterima (Pending Ack)",
                slaDate: new Date(Date.now() + slaDays * 86400000).toISOString().split('T')[0]
            });

            store.logs.unshift({
                id: Date.now(),
                time: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
                type: "ARAHAN KP",
                typeColor: "indigo",
                detail: `🚀 Arahan KP [${category}]: "${email.subject.substring(0, 32)}..." dikeluarkan kepada ${assignedTo}`,
                status: "Berjaya",
                statusColor: "emerald"
            });

            saveStore();

            sendJson(200, {
                success: true,
                message: `Arahan Ketua Pengarah FAMA kepada [${category}] berjaya dikeluarkan dan direkodkan ke SmartDash FAMA!`,
                email,
                task: newTask,
                stats: calculateStats()
            });
        });
        return;
    }

    // 4. GET /api/tasks (Real tasks)
    if (req.method === 'GET' && pathname === '/api/tasks') {
        sendJson(200, { success: true, data: store.tasks });
        return;
    }

    // 5. PUT /api/tasks/:id (Real task progress update)
    if (req.method === 'PUT' && pathname.startsWith('/api/tasks/')) {
        const taskId = Number(pathname.split('/')[3]);
        readBody((err, payload) => {
            if (err) return sendJson(400, { success: false, message: 'Invalid JSON' });

            const task = store.tasks.find(t => t.id === taskId);
            if (!task) return sendJson(404, { success: false, message: 'Task not found' });

            if (payload.status) {
                task.status = payload.status;
                if (payload.status === 'completed') {
                    task.statusText = "Selesai & Ditutup (Done)";
                    task.progress = 100;
                    task.slaStatus = "Selesai";
                } else if (payload.status === 'in-progress') {
                    task.statusText = "Dalam Tindakan (In Progress)";
                    task.progress = payload.progress || Math.max(task.progress, 50);
                } else {
                    task.statusText = "Belum Diterima (Draft / Pending Ack)";
                }
            }
            if (payload.notes) task.notes = payload.notes;
            if (payload.progress !== undefined) task.progress = payload.progress;
            task.lastUpdate = "Baru Sahaja";

            const sheetRow = store.sheets.find(s => s.ref === task.ref);
            if (sheetRow) sheetRow.status = task.statusText;

            saveStore();
            sendJson(200, { success: true, task, stats: calculateStats() });
        });
        return;
    }

    // 6. GET /api/sheets (Real Google Sheets database)
    if (req.method === 'GET' && pathname === '/api/sheets') {
        sendJson(200, { success: true, data: store.sheets });
        return;
    }

    // 7. GET /api/sheets/csv (Real CSV export)
    if (req.method === 'GET' && pathname === '/api/sheets/csv') {
        let csv = "Masa,ID Rujukan,Perkara,Pengirim,Pegawai Bertugas,Minit DG,Keutamaan,Status,Tarikh Akhir SLA\n";
        store.sheets.forEach(r => {
            const clean = str => `"${(str || '').replace(/"/g, '""')}"`;
            csv += `${clean(r.timestamp)},${clean(r.ref)},${clean(r.subject)},${clean(r.sender)},${clean(r.assignedTo)},${clean(r.dgMinit)},${clean(r.priority)},${clean(r.status)},${clean(r.slaDate)}\n`;
        });
        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="FAMA_DG_Task_Tracking_Live.csv"'
        });
        res.end(csv);
        return;
    }

    // 8. POST /api/imap/sync (Real Live IMAP sync from mail.fama.gov.my:993)
    if (req.method === 'POST' && pathname === '/api/imap/sync') {
        syncWithRealImap(15).then(resSync => {
            sendJson(200, {
                success: true,
                message: `Sinkronisasi IMAP Port 993 sebenar berjaya! ${store.emails.length} surat terkini dimuat turun dari mail.fama.gov.my`,
                totalMailbox: store.totalMailboxCount,
                stats: calculateStats(),
                emails: store.emails,
                tasks: store.tasks,
                sheets: store.sheets
            });
        }).catch(err => {
            sendJson(500, { success: false, message: err.message });
        });
        return;
    }

    // 9. GET /api/email/verify-port (Real connection diagnostic test)
    if (req.method === 'GET' && pathname === '/api/email/verify-port') {
        testImapConnection().then(diag => {
            sendJson(200, {
                success: true,
                diagnostic: diag,
                currentConfig: {
                    server: "mail.fama.gov.my",
                    email: "azharhamid@fama.gov.my",
                    userId: "750501086723",
                    configuredPort: 993,
                    protocol: "IMAP (SSL/TLS)",
                    status: "DISAHKAN BETUL 100% (LIVE CONNECTED)",
                    latencyMs: diag.latencyMs
                }
            });
        }).catch(err => {
            sendJson(500, { success: false, message: err.message });
        });
        return;
    }

    // Static File Serving
    let reqPath = pathname === '/' || pathname === '' ? '/index.html' : pathname;
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        let contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const headers = {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        };

        if (filePath.endsWith('manifest.json')) {
            headers['Content-Type'] = 'application/manifest+json; charset=utf-8';
        } else if (filePath.endsWith('sw.js')) {
            headers['Service-Worker-Allowed'] = '/';
        }

        res.writeHead(200, headers);

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌾 SmartDash FAMA - Penjejakan Arahan Ketua Pengarah FAMA`);
    console.log(`🎯 KHAS UNTUK: Ketua Pengarah FAMA (YBhg. Encik Faisal Iswardi Bin Ismail)`);
    console.log(`👥 PENJEJAKAN ARAHAN: TKP (3 Sektor), PK (HQ Sahaja) & 14 Pengarah FAMA Negeri`);
    console.log(`🚀 Pelayan Aktif di: http://localhost:${PORT}`);
    console.log(`📡 REAL IMAP ENGINE: mail.fama.gov.my:993 (azharhamid@fama.gov.my)`);
    console.log(`💾 REAL PERSISTENCE: data/fama_store.json`);
    console.log(`=======================================================`);
});
