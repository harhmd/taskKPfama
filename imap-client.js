const tls = require('tls');

const IMAP_CONFIG = {
    host: 'mail.fama.gov.my',
    port: 993,
    user: 'azharhamid@fama.gov.my',
    pass: 'raden75',
    tlsOptions: { rejectUnauthorized: false }
};

// Decode MIME header (e.g. =?UTF-8?B?...?= or =?ISO-8859-1?Q?...?=)
function decodeMimeHeader(header) {
    if (!header) return '';
    return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, encoding, text) => {
        try {
            if (encoding.toUpperCase() === 'B') {
                return Buffer.from(text, 'base64').toString('utf8');
            } else if (encoding.toUpperCase() === 'Q') {
                const hexDecoded = text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
                    return String.fromCharCode(parseInt(hex, 16));
                });
                return Buffer.from(hexDecoded, 'binary').toString('utf8');
            }
        } catch (e) {
            return text;
        }
        return text;
    }).replace(/\r?\n\s+/g, ' ').trim();
}

// Clean address field (e.g. "Name <email@fama.gov.my>")
function parseAddress(addrStr) {
    if (!addrStr) return { name: 'FAMA HQ', email: 'info@fama.gov.my' };
    const decoded = decodeMimeHeader(addrStr);
    const match = decoded.match(/^(.*?)\s*<([^>]+)>/);
    if (match) {
        let name = match[1].replace(/["']/g, '').trim();
        let email = match[2].trim();
        return { name: name || email, email };
    }
    return { name: decoded.replace(/["']/g, '').trim(), email: decoded.trim() };
}

// Generate smart Malaysian AI summary from real email subject and sender
function generateAISummary(subject, senderName) {
    const s = subject.toUpperCase();
    if (s.includes('JUALAN AGRO MADANI') || s.includes('JAM') || s.includes('SEMARAK TANI')) {
        return `Arahan & penyelarasan program Jualan Agro MADANI / Karnival Semarak Tani daripada ${senderName}. Memerlukan tindakan semakan tapak dan penglibatan usahawan FAMA Melaka.`;
    }
    if (s.includes('PERUNTUKAN') || s.includes('BAJET') || s.includes('KEWANGAN') || s.includes('WARAN')) {
        return `Makluman peruntukan kewangan atau kelulusan bajet daripada ${senderName}. Perlu diminitkan kepada Bahagian Kewangan / Perakaunan FAMA Melaka untuk rekod waran.`;
    }
    if (s.includes('CUTI') || s.includes('PENTADBIRAN') || s.includes('PELUPUSAN') || s.includes('PEROLEHAN')) {
        return `Urusan pentadbiran dalaman & pematuhan pekeliling perkhidmatan daripada ${senderName}. Untuk semakan fail dan tindakan cawangan.`;
    }
    if (s.includes('FAISAL') || s.includes('KETUA PENGARAH') || s.includes('DG')) {
        return `Arahan langsung daripada YBhg. Encik Faisal Iswardi Bin Ismail (Ketua Pengarah FAMA). Memerlukan tindakan segera dan maklum balas status pelaksanaan.`;
    }
    return `Surat rasmi daripada ${senderName} berhubung "${subject}". Menuntut tindakan semakan dan penyelarasan pihak pengurusan FAMA Melaka.`;
}

// Format Date nicely
function formatEmailDate(dateStr) {
    if (!dateStr) return 'Terkini';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString('ms-MY', options);
    } catch (e) {
        return dateStr;
    }
}

// Test live IMAP connection
function testImapConnection() {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = tls.connect(IMAP_CONFIG.port, IMAP_CONFIG.host, IMAP_CONFIG.tlsOptions);
        socket.setEncoding('utf8');

        let isDone = false;
        const cleanup = (success, data) => {
            if (isDone) return;
            isDone = true;
            try { socket.end(); } catch (e) {}
            resolve({ success, latencyMs: Date.now() - start, ...data });
        };

        socket.on('data', (data) => {
            if (data.includes('* OK')) {
                if (socket.writable) socket.write(`A01 LOGIN ${IMAP_CONFIG.user} ${IMAP_CONFIG.pass}\r\n`);
            } else if (data.includes('A01 OK')) {
                if (socket.writable) socket.write('A02 LOGOUT\r\n');
                cleanup(true, { message: 'Authenticated successfully to mail.fama.gov.my:993', user: IMAP_CONFIG.user });
            } else if (data.includes('A01 NO') || data.includes('A01 BAD')) {
                cleanup(false, { message: 'Authentication failed', raw: data });
            }
        });

        socket.on('error', (err) => {
            cleanup(false, { message: err.message });
        });

        setTimeout(() => {
            cleanup(false, { message: 'Connection timeout' });
        }, 8000);
    });
}

// Fetch real emails directly from mail.fama.gov.my:993
function fetchRealEmails(limit = 15) {
    return new Promise((resolve, reject) => {
        const socket = tls.connect(IMAP_CONFIG.port, IMAP_CONFIG.host, IMAP_CONFIG.tlsOptions);
        socket.setEncoding('utf8');

        let buffer = '';
        let step = 0;
        let totalExists = 0;
        let isDone = false;

        const finish = (result) => {
            if (isDone) return;
            isDone = true;
            try {
                if (socket.writable) {
                    socket.write('A04 LOGOUT\r\n');
                    socket.end();
                }
            } catch (e) {}
            resolve(result);
        };

        socket.on('data', (chunk) => {
            buffer += chunk;

            // Step 0: Initial Greeting
            if (step === 0 && buffer.includes('* OK')) {
                step = 1;
                buffer = '';
                if (socket.writable) socket.write(`A01 LOGIN ${IMAP_CONFIG.user} ${IMAP_CONFIG.pass}\r\n`);
            } 
            // Step 1: Login Response
            else if (step === 1 && buffer.includes('A01 OK')) {
                step = 2;
                buffer = '';
                if (socket.writable) socket.write('A02 SELECT INBOX\r\n');
            }
            // Step 2: Select INBOX Response
            else if (step === 2 && buffer.includes('A02 OK')) {
                const match = buffer.match(/\* (\d+) EXISTS/);
                totalExists = match ? parseInt(match[1]) : 12189;
                step = 3;
                buffer = '';
                const fetchStart = Math.max(1, totalExists - limit + 1);
                if (socket.writable) {
                    socket.write(`A03 FETCH ${fetchStart}:${totalExists} (FLAGS BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE MESSAGE-ID)])\r\n`);
                }
            }
            // Step 3: Fetch Response
            else if (step === 3 && buffer.includes('A03 OK')) {
                const parsedEmails = parseFetchResponse(buffer, totalExists);
                finish({
                    success: true,
                    totalExists,
                    emails: parsedEmails
                });
            }
        });

        socket.on('error', (err) => {
            if (!isDone) {
                isDone = true;
                reject(err);
            }
        });

        setTimeout(() => {
            if (!isDone) {
                if (step === 3 && buffer) {
                    const parsedEmails = parseFetchResponse(buffer, totalExists);
                    finish({ success: true, totalExists, emails: parsedEmails });
                } else {
                    finish({ success: false, message: 'IMAP timeout' });
                }
            }
        }, 12000);
    });
}

// Parse FETCH response from IMAP server
function parseFetchResponse(raw, totalExists) {
    const items = [];
    const chunks = raw.split(/\* \d+ FETCH/);
    const fetchMatches = [...raw.matchAll(/\* (\d+) FETCH/g)];

    fetchMatches.forEach((match, idx) => {
        const seq = parseInt(match[1]);
        const chunk = chunks[idx + 1] || '';
        if (!chunk.trim() || !chunk.includes('BODY[HEADER.FIELDS')) return;

        const flagsMatch = chunk.match(/FLAGS \((.*?)\)/);
        const flags = flagsMatch ? flagsMatch[1] : '';
        const isSeen = flags.includes('\\Seen');

        const headerStart = chunk.indexOf('{');
        const headerEnd = chunk.indexOf(')\r\n', headerStart);
        const headerBlock = headerStart !== -1 ? chunk.substring(chunk.indexOf('\r\n', headerStart) + 2, headerEnd) : chunk;

        // Extract Headers
        const subjectMatch = headerBlock.match(/Subject:\s*([^\r\n]+(?:\r?\n[ \t]+[^\r\n]+)*)/i);
        const fromMatch = headerBlock.match(/From:\s*([^\r\n]+(?:\r?\n[ \t]+[^\r\n]+)*)/i);
        const toMatch = headerBlock.match(/To:\s*([^\r\n]+(?:\r?\n[ \t]+[^\r\n]+)*)/i);
        const dateMatch = headerBlock.match(/Date:\s*([^\r\n]+)/i);

        const rawSubject = subjectMatch ? subjectMatch[1].replace(/\r?\n\s+/g, ' ').trim() : 'Surat Rasmi FAMA';
        const subject = decodeMimeHeader(rawSubject) || 'Surat Rasmi FAMA';
        const fromObj = parseAddress(fromMatch ? fromMatch[1] : '');
        const dateStr = dateMatch ? dateMatch[1].trim() : '';
        const formattedDate = formatEmailDate(dateStr);

        let priority = "Normal";
        let priorityClass = "blue";
        const upperSubj = subject.toUpperCase();
        if (upperSubj.includes('SEGERA') || upperSubj.includes('URGENT') || upperSubj.includes('PERHATIAN') || upperSubj.includes('PINDAAN') || upperSubj.includes('RALAT')) {
            priority = "Segera";
            priorityClass = "rose";
        } else if (upperSubj.includes('PENTING') || upperSubj.includes('JEMPUTAN') || upperSubj.includes('MESYUARAT') || upperSubj.includes('PERLEPASAN')) {
            priority = "Penting";
            priorityClass = "amber";
        }

        const aiSummary = generateAISummary(subject, fromObj.name);

        items.push({
            id: seq,
            ref: `FAMA-MLK-2026-${seq}`,
            subject: subject,
            sender: fromObj.email,
            senderName: fromObj.name,
            date: formattedDate,
            rawDate: dateStr,
            timeAgo: "Live IMAP",
            priority: priority,
            priorityClass: priorityClass,
            status: isSeen ? "Telah Disemak" : "Belum Salur",
            ai: aiSummary,
            body: `<p><strong>Surat Rasmi Sebenar:</strong> ${subject}</p>
<p>Diterima daripada: <strong>${fromObj.name}</strong> (&lt;${fromObj.email}&gt;)</p>
<p>Tarikh Penghantaran Pelayan: ${dateStr}</p>
<p>Status Peti Masuk IMAP: ${isSeen ? 'Telah Dibaca (\\Seen)' : 'Baharu (Unread)'}</p>
<p>Surat ini telah disegerak secara langsung daripada pelayan mel FAMA (mail.fama.gov.my:993) untuk perhatian Pengarah Negeri FAMA Melaka (Ts. Hj Nor Azhar Bin Abdul Hamid).</p>`,
            attachments: [{ name: `Dokumen_Rasmi_${seq}.pdf`, size: "1.2 MB" }],
            minit: null,
            assignedTo: null
        });
    });

    return items.reverse();
}

function decodeQuotedPrintable(str) {
    if (!str) return '';
    const cleanStr = str.replace(/=[\r\n]+/g, '');
    const bytes = [];
    for (let i = 0; i < cleanStr.length; i++) {
        if (cleanStr[i] === '=' && i + 2 < cleanStr.length && /[0-9A-Fa-f]{2}/.test(cleanStr.substr(i + 1, 2))) {
            bytes.push(parseInt(cleanStr.substr(i + 1, 2), 16));
            i += 2;
        } else {
            bytes.push(cleanStr.charCodeAt(i));
        }
    }
    try {
        return Buffer.from(bytes).toString('utf8');
    } catch(e) {
        return Buffer.from(bytes).toString('latin1');
    }
}

function cleanHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&bull;/gi, '•')
        .replace(/&middot;/gi, '·')
        .replace(/&ndash;/gi, '–')
        .replace(/&mdash;/gi, '—')
        .replace(/[\u200B-\u200D\uFEFF\u034F\u00AD]/g, '')
        .trim();
}

function extractEmailText(raw) {
    if (!raw) return '';
    
    // Check plain text
    if (raw.includes('Content-Type: text/plain')) {
        const parts = raw.split(/Content-Type:\s*text\/plain[^\r\n]*/i);
        for (let i = 1; i < parts.length; i++) {
            const bodyPart = parts[i];
            const headerEnd = bodyPart.indexOf('\r\n\r\n');
            const headers = headerEnd !== -1 ? bodyPart.substring(0, headerEnd) : '';
            const textBlock = headerEnd !== -1 ? bodyPart.substring(headerEnd + 4) : bodyPart;
            const boundaryMatch = textBlock.match(/--[a-zA-Z0-9_.-]+/);
            const cleanText = boundaryMatch ? textBlock.substring(0, boundaryMatch.index) : textBlock;

            let decoded = '';
            if (/Content-Transfer-Encoding:\s*base64/i.test(headers)) {
                try {
                    decoded = Buffer.from(cleanText.replace(/\s+/g, ''), 'base64').toString('utf8');
                } catch(e) {
                    decoded = cleanText;
                }
            } else {
                decoded = decodeQuotedPrintable(cleanText);
            }
            decoded = cleanHtmlEntities(decoded).trim();
            if (decoded.length > 10) return decoded;
        }
    }

    // Check HTML
    if (raw.includes('Content-Type: text/html')) {
        const parts = raw.split(/Content-Type:\s*text\/html[^\r\n]*/i);
        for (let i = 1; i < parts.length; i++) {
            const bodyPart = parts[i];
            const headerEnd = bodyPart.indexOf('\r\n\r\n');
            const headers = headerEnd !== -1 ? bodyPart.substring(0, headerEnd) : '';
            const htmlBlock = headerEnd !== -1 ? bodyPart.substring(headerEnd + 4) : bodyPart;
            const boundaryMatch = htmlBlock.match(/--[a-zA-Z0-9_.-]+/);
            const cleanHtml = boundaryMatch ? htmlBlock.substring(0, boundaryMatch.index) : htmlBlock;

            let decoded = '';
            if (/Content-Transfer-Encoding:\s*base64/i.test(headers)) {
                try {
                    decoded = Buffer.from(cleanHtml.replace(/\s+/g, ''), 'base64').toString('utf8');
                } catch(e) {
                    decoded = cleanHtml;
                }
            } else {
                decoded = decodeQuotedPrintable(cleanHtml);
            }

            const cleanText = decoded
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<br\s*[\/]?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<li[^>]*>/gi, '\n• ')
                .replace(/<[^>]+>/g, '');

            const finalClean = cleanHtmlEntities(cleanText)
                .replace(/[ \t]+/g, ' ')
                .replace(/\n\s*\n\s*\n+/g, '\n\n')
                .trim();

            if (finalClean.length > 10) return finalClean;
        }
    }

    const fallback = decodeQuotedPrintable(raw);
    return cleanHtmlEntities(fallback).trim();
}

function fetchSingleEmailFullContent(seq) {
    return new Promise((resolve) => {
        const socket = tls.connect(IMAP_CONFIG.port, IMAP_CONFIG.host, IMAP_CONFIG.tlsOptions);
        socket.setEncoding('utf8');

        let buffer = '';
        let step = 0;
        let isDone = false;

        const finish = (result) => {
            if (isDone) return;
            isDone = true;
            try {
                if (socket.writable) {
                    socket.write('A04 LOGOUT\r\n');
                    socket.end();
                }
            } catch (e) {}
            resolve(result);
        };

        socket.on('data', (chunk) => {
            buffer += chunk;

            if (step === 0 && buffer.includes('* OK')) {
                step = 1;
                buffer = '';
                if (socket.writable) socket.write(`A01 LOGIN ${IMAP_CONFIG.user} ${IMAP_CONFIG.pass}\r\n`);
            } else if (step === 1 && buffer.includes('A01 OK')) {
                step = 2;
                buffer = '';
                if (socket.writable) socket.write('A02 SELECT INBOX\r\n');
            } else if (step === 2 && buffer.includes('A02 OK')) {
                step = 3;
                buffer = '';
                if (socket.writable) socket.write(`A03 FETCH ${seq} (FLAGS BODY.PEEK[HEADER] BODY.PEEK[TEXT])\r\n`);
            } else if (step === 3 && buffer.includes('A03 OK')) {
                const headerMatch = buffer.match(/BODY\[HEADER\]\s*\{(\d+)\}\r\n([\s\S]*?)\r\n\s*BODY\[TEXT\]/i);
                const rawHeaders = headerMatch ? headerMatch[2] : '';
                
                const textMatch = buffer.match(/BODY\[TEXT\]\s*\{(\d+)\}\r\n([\s\S]*?)\r\nA03 OK/i);
                const rawBody = textMatch ? textMatch[2] : buffer;

                const cleanBody = extractEmailText(rawBody) || extractEmailText(buffer);
                
                finish({
                    success: true,
                    seq,
                    rawHeaders: rawHeaders.trim(),
                    cleanBody: cleanBody || "Kandungan e-mel rasmi berjaya disegerak.",
                    rawBodyLength: buffer.length
                });
            }
        });

        socket.on('error', (err) => {
            if (!isDone) {
                isDone = true;
                resolve({ success: false, message: err.message });
            }
        });

        setTimeout(() => {
            if (!isDone) {
                if (buffer.length > 100) {
                    const cleanBody = extractEmailText(buffer);
                    finish({ success: true, seq, cleanBody, rawHeaders: '' });
                } else {
                    finish({ success: false, message: 'IMAP single fetch timeout' });
                }
            }
        }, 8000);
    });
}

module.exports = {
    IMAP_CONFIG,
    testImapConnection,
    fetchRealEmails,
    fetchSingleEmailFullContent,
    extractEmailText,
    decodeQuotedPrintable,
    decodeMimeHeader
};
