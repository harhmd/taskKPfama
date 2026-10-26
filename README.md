# 🌾 FAMA e-Surat & Penjejakan Arahan DG (Official Platform)
### Lembaga Pemasaran Pertanian Persekutuan (FAMA)

Platform bersepadu pengurusan surat rasmi, pengeluaran minit arahan YBhg. Datuk Ketua Pengarah FAMA, penjejakan pelaksanaan tugas subordinate peringkat negeri dan bahagian (*Kanban Board*), serta penyelarasan pangkalan data automatik berasaskan **Google Sheets** dan protokol **IMAP Port 993 SSL**.

Platform ini kini menggunakan **rekaan tema moden berasaskan kad pastel bersudut bulat (*Rounded Pastel Card Dashboard*)** yang bersih, minimalis, dan elegan dengan aksen koral-merah jambu, kad statistik pastel 4-warna, banner tindakan bertenaga dengan butang pantas "GO", serta pembantu operasi pintar (*Operations Assistant*).

---

## 🔒 Pengesahan Port Emel Rasmi (Email Port Verification)

### Soalan: *Adakah Port 993 Tepat Bagi Sistem Ini?*
**Jawapan: YA, 100% TEPAT & DISAHKAN BETUL.**

Bagi menyegerak dan membaca surat masuk daripada pelayan **`mail.fama.gov.my`** untuk akaun **`azharhamid@fama.gov.my`** (Ts. Hj Nor Azhar - ID `750501086723`), **Port 993** adalah port standard piawaian antarabangsa **RFC 8314 & IANA** untuk **IMAP over SSL/TLS (IMAPS)**:

| Protokol | Port | Jenis Aliran | Tahap Keselamatan | Penggunaan Dalam Platform FAMA |
| :--- | :---: | :--- | :--- | :--- |
| **IMAP (IMAPS)** | **993** | **Incoming (Muat Turun Mel)** | **SSL/TLS (Implicit)** | **SEDANG DIGUNAKAN (BETUL) — Enkripsi penuh kata laluan & surat dari pelayan.** |
| **IMAP (STARTTLS)** | **143** | Incoming (Muat Turun Mel) | STARTTLS / Plaintext | Alternatif port lama (handshake tidak berenkripsi sebelum TLS). |
| **SMTP (Submission)** | **587** | Outgoing (Penghantaran Mel) | STARTTLS | Digunakan sekiranya platform menghantar emel notifikasi keluar ke pegawai. |
| **SMTP (SMTPS)** | **465** | Outgoing (Penghantaran Mel) | SSL/TLS (Implicit) | Pilihan alternatif selamat untuk mel keluar. |
| **POP3 (POP3S)** | **995** | Incoming (Legasi) | SSL/TLS | Tidak disyorkan kerana memadam surat asal daripada peti mel pelayan. |

> [!NOTE]
> Platform ini dilengkapi dengan modul interaktif **Tab 4: Pengesahan Port Emel (Port 993 SSL)** yang membolehkan ujian diagnostik sambungan dijalankan secara langsung.

---

## 🌟 Ciri-Ciri Utama Platform

### 1. Tab 1: Urus Setia Triage Inbox (Secretariat Triage)
- **Pengurusan Mel Masuk Terpusat:** Penapisan status surat (*Semua*, *Belum Disalur*, *Segera*, *Penting*).
- **Rumusan Pintar AI (FAMA AI Assistant):** Menganalisis intipati surat rasmi secara automatik, mencadangkan tahap keutamaan dan pegawai/bahagian yang wajar mengambil tindakan.
- **Borang Minit DG & Salur Arahan:**
  - Pilihan templat minit pantas (*Quick Minit Presets*): "Tindakan Segera", "Sedia Laporan Tapak", "Makluman & Fail".
  - Pemilihan pegawai bertugas (cth: Ts. Hj Nor Azhar - FAMA Melaka).
  - Penetapan tahap keutamaan SLA (Segera 48 Jam, Penting 3 Hari, Normal 7 Hari).
  - Butang **Keluarkan Arahan DG**: Mengemas kini rekod surat serta-merta, mencipta kad tugasan baharu pada Papan Kanban Tab 2, dan merekod ke dalam Google Sheets secara automatik.
- **Prapapar Lampiran Rasmi PDF:** Paparan dokumen surat dengan format kepala surat (*letterhead*) rasmi Kerajaan/FAMA, nombor rujukan, cop keselamatan, dan fungsi cetak mesra pencetak (*Print-ready*).

### 2. Tab 2: Papan Penjejakan Arahan Subordinate (Kanban Board)
- Dikhaskan untuk pemantauan masa nyata tindakan pegawai subordinate seperti **Ts. Hj Nor Azhar Bin Abdul Hamid (ID MyKad: `750501086723`)** - Pengarah FAMA Negeri Melaka.
- **3 Fasa Status Aliran Kerja:**
  1. 🟡 **Belum Diterima (Pending Ack)**
  2. 🔵 **Dalam Tindakan (In Progress)**
  3. 🟢 **Selesai & Ditutup (Completed & Closed)**
- **Penjejak SLA Pintar:** Memaparkan kiraan baki hari SLA dan amaran visual jika menghampiri tempoh tamat.
- **Modal Kemaskini Tindakan:** Membolehkan pegawai mengemas kini status, melaras peratusan kemajuan (0%–100%), memasukkan catatan ulasan, dan melampirkan laporan penyelesaian.

### 3. Tab 3: Pengurus Sinkronisasi Google Sheets & IMAP Port 993
- **Simulator IMAP Port 993 SSL:**
  - Pelayan: `mail.fama.gov.my:993`
  - Akaun Emel: `azharhamid@fama.gov.my`
  - Pengenalan: `750501086723`
  - Butang *Jalankan Live IMAP Sync* memuat turun mel baharu dan menyelaraskan ke Triage Inbox dengan animasi masa nyata.
- **Pencetus Google Apps Script (`onEdit`):** Memantau perubahan sel pada pangkalan data dan mencetuskan notifikasi emel automatik.
- **Jadual Data Google Sheets Langsung:** Paparan jadual berserta fungsi carian pantas dan butang **Muat Turun Fail CSV** untuk analisis luar talian.
- **Log Audit & Aktiviti Sistem:** Merekodkan setiap operasi pengeluaran arahan, kemaskini status, dan peristiwa sinkronisasi IMAP.

### 4. Mod Multi-Peranan (Role Switcher)
- **Urus Setia Khas (Secretariat Triage):** Menyaring surat masuk, menyedia draf minit, dan menguruskan edaran.
- **Ketua Pengarah (YBhg. Datuk DG):** Menurunkan minit eksekutif dan memantau KPI seluruh negara.
- **Pengarah Negeri (Ts. Hj Nor Azhar - FAMA Melaka):** Menerima arahan, melaksana tindakan tapak, dan mengemukakan laporan.

---

## 💻 Cara Pasang ke Komputer / Laptop Windows (Windows Desktop App)

SmartDash FAMA kini boleh dipasang dan dijalankan sepenuhnya sebagai **Aplikasi Desktop Windows** pada komputer atau komputer riba (Windows 10 / 11).

### Kaedah 1: Pemasang Asli Windows GUI (`Setup-SmartDash-FAMA.exe`) — *Pemasang Rasmi*
1. Dalam folder projek, klik dua kali fail:
   ```
   Setup-SmartDash-FAMA.exe
   ```
2. Wizard pemasangan grafik (**Windows Setup Wizard**) akan dibuka dengan panduan 4 langkah:
   - **Skrin 1:** Pengenalan rasmi sistem SmartDash FAMA.
   - **Skrin 2:** Pilihan lokasi pemasangan (lalai: `%LOCALAPPDATA%\Programs\SmartDash FAMA` — mesra pengguna pejabat tanpa perlu kata laluan Admin).
   - **Skrin 3:** Pilihan pintasan Desktop (`SmartDash FAMA.lnk`) dan Start Menu.
   - **Skrin 4:** Pemasangan fail, penyalinan pangkalan data, pendaftaran ke dalam senarai **Windows Apps & Features**, dan pelancaran serta-merta!

---

### Kaedah 2: Pemasang 1-Klik Pintasan Pantas (`Install-SmartDash-FAMA.bat`)
Klik dua kali fail **`Install-SmartDash-FAMA.bat`** untuk menjana pintasan terus pada Desktop dan Start Menu dalam 1 saat.

---

### Kaedah 3: Pemasangan PWA Melalui Pelayar (Microsoft Edge & Chrome)
1. Buka pelayan dengan klik dua kali **`start.bat`** atau **`start-desktop.bat`**.
2. Buka pelayar di `http://localhost:9091`.
3. Klik butang hijau **"Pasang ke Windows"** pada bar atas (Header) atau ikon muat turun pada Dock sisi kiri.
4. Klik **"Install / Pasang"** pada dialog Windows pelayar.
5. SmartDash FAMA kini tersenarai dalam aplikasi rasmi Windows dan boleh dipinkan (*Pin to taskbar*) terus ke bar tugas Windows anda!

---

### Nyahpasang Pintasan Desktop
Untuk membuang pintasan bila-bila masa, klik dua kali fail:
```
Uninstall-SmartDash-FAMA.bat
```
*(Fail data pangkalan data dan kod projek kekal selamat).*

---

## 🚀 Kaedah Pelancaran Lain

### Kaedah Manual: Menggunakan Terminal Node.js
```bash
# 1. Masuk ke direktori projek
cd C:\Users\USER\.gemini\antigravity\scratch\fama-dg-tracking

# 2. Mulakan pelayan tempatan
node server.js
```
Aplikasi akan dibuka dan beroperasi di: **`http://localhost:9091`**

### Kaedah Cepat: `start.bat` atau `start-desktop.bat`
Klik dua kali fail **`start-desktop.bat`** untuk membuka terus dalam mod tetingkap desktop.

---

## 📡 Rujukan REST API (`server.js`)

| Kaedah | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Mengambil statistik KPI (Jumlah Mel, Menunggu Triage, Arahan Aktif, SLA) |
| `GET` | `/api/emails` | Mengambil senarai semua surat masuk |
| `POST` | `/api/emails/route` | Mengeluarkan arahan DG, salur tugas, & kemaskini Sheets |
| `GET` | `/api/tasks` | Mengambil senarai kad tugasan Kanban subordinate |
| `PUT` | `/api/tasks/:id` | Mengemas kini status, peratusan, dan nota kemajuan tugasan |
| `GET` | `/api/sheets` | Mengambil data jadual pangkalan data Google Sheets |
| `GET` | `/api/sheets/csv` | Menjana dan memuat turun fail CSV Google Sheets |
| `POST` | `/api/imap/sync` | Melaksanakan simulasi muat turun mel masuk IMAP Port 993 |
| `GET` | `/api/logs` | Mengambil log audit dan aktiviti sinkronisasi terkini |

---

## 📑 Sampel Kod Google Apps Script (`Code.gs`)
Untuk menghubungkan borang Google Sheets rasmi kepada platform:
```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var row = range.getRow();
  var col = range.getColumn();
  
  // Memantau lajur Pegawai / Status (Lajur 5 & 8)
  if (row > 1 && (col === 5 || col === 8)) {
    var assignedTo = sheet.getRange(row, 5).getValue();
    var status = sheet.getRange(row, 8).getValue();
    var refNo = sheet.getRange(row, 2).getValue();
    
    if (assignedTo.indexOf("750501086723") !== -1) {
      MailApp.sendEmail({
        to: "azharhamid@fama.gov.my",
        subject: "Pemberitahuan Arahan DG FAMA: " + refNo,
        body: "Salam hormat Ts. Hj Nor Azhar,\n\nArahan baharu telah disalurkan kepada FAMA Melaka: " + refNo + "\nStatus: " + status + "\n\nSila layari portal FAMA e-Surat untuk tindakan lanjut."
      });
    }
  }
}
```

---

## 🏛️ Hak Cipta & Maklumat Pembangunan
- **Agensi:** Lembaga Pemasaran Pertanian Persekutuan (FAMA) Malaysia
- **Cawangan:** FAMA Negeri Melaka & Pejabat Urus Setia Khas YBhg. Datuk DG
- **Tahun:** 2026
