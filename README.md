# 🏸 MCKING-STAR: Sistem Manajemen Badminton Modern

**MCKING-STAR** adalah aplikasi manajemen operasional GOR Badminton berbasis web yang dirancang untuk mendigitalisasi proses pemesanan lapangan, manajemen komunitas (Mabar), hingga otomatisasi keuangan (Split Bill). 

Aplikasi ini dibangun menggunakan arsitektur **Jamstack** untuk memastikan performa yang cepat, aman, dan skala yang mudah dikembangkan.

---

## 🚀 Demo & Deployment
Aplikasi telah di-deploy dan dapat diakses secara real-time melalui tautan berikut:

* **Live Demo:** [mcking-star.vercel.app](https://mcking-star.vercel.app)
* **Frontend Hosting:** **Vercel** (Automated Deployment via GitHub)
* **Backend & Database:** **Supabase** (PostgreSQL & Realtime Engine)

---

## 🛠️ Stack Teknologi
* **Frontend:** React.js (Vite) - Memberikan pengalaman Single Page Application (SPA) yang responsif.
* **Styling:** Tailwind CSS - Desain modern, bersih, dan *Mobile-First*.
* **Database:** PostgreSQL via Supabase - Penyimpanan data relasional yang kokoh.
* **Real-time:** Supabase Broadcast & Changes - Mengirim notifikasi verifikasi tiket secara instan tanpa refresh.
* **QR System:** `html5-qrcode` & `qrcode.react` - Pembuatan tiket dan scanner kamera HP langsung dari browser.
* **UI Components:** SweetAlert2 - Untuk interaksi pop-up yang elegan.

---

## 🌟 Fitur Utama yang Terimplementasi

### 1. Autentikasi & Akun Cerdas
* **Auto-Register:** Pendaftaran otomatis bagi pengguna baru saat login pertama kali.
* **Welcome Bonus:** Saldo awal sebesar **Rp 100.000** bagi setiap pengguna baru.
* **XP & Leveling:** Sistem gamifikasi di mana pengguna mendapatkan poin pengalaman setiap kali bermain untuk menaikkan level profil.

### 2. Intelligent Booking System
* **Interactive Time Slots:** Jadwal tersedia mulai jam 08:00 - 22:00 yang otomatis terkunci jika sudah dipesan.
* **Dynamic Pricing:** Penambahan biaya otomatis (*Night Surcharge*) sebesar Rp 20.000 untuk sesi malam (di atas jam 18:00).
* **Collision Prevention:** Proteksi database agar tidak terjadi bentrok jadwal di lapangan yang sama.

### 3. Sosial & Finansial (Sistem Hutang)
* **Automated Split Bill:** Membagi biaya sewa secara merata kepada teman yang diajak.
* **Debt Blocker:** Fitur keamanan yang **memblokir akses booking/mabar/turnamen** jika pengguna masih memiliki hutang yang belum dilunasi.
* **Buku Hutang Digital:** Manajemen piutang dan hutang pribadi dengan fitur pelunasan instan menggunakan saldo dompet.
* **Promo Code:** Top-up menggunakan kode voucher `MCKINGPRO` untuk mendapatkan bonus saldo Rp 50.000.

### 4. Validasi Kehadiran & QR Code
* **Dynamic QR Ticket:** Generate QR Code unik untuk setiap transaksi sebagai tiket masuk.
* **Time Window Validation:** Tiket hanya bisa diverifikasi oleh Admin dalam rentang waktu **1 jam sebelum** hingga **1 jam sesudah** jadwal main dimulai.
* **Real-time Check-in:** Notifikasi sukses verifikasi muncul secara instan di layar HP pengguna saat admin melakukan scan.

### 5. Ruang Komando Admin
* **Revenue Dashboard:** Visualisasi grafik pendapatan yang mencakup Omzet dan estimasi Laba Bersih.
* **Flexible Period Filter:** Laporan keuangan dapat difilter berdasarkan 7 hari, 1 bulan, 3 bulan, hingga **6 bulan terakhir**.
* **Mobile Web Scanner:** Fitur scanner QR Code yang dioptimalkan khusus untuk kamera handphone admin.
* **Hall of Fame:** Menampilkan 5 pelanggan dengan kontribusi tertinggi sebagai bentuk apresiasi loyalitas.

---

## 📂 Struktur Database (SQL)
Arsitektur data menggunakan PostgreSQL dengan skema relasional:
* `users`: Data kredensial, saldo, dan XP.
* `courts`: Data master lapangan dan harga dasar.
* `bookings`: Transaksi sesi main, status check-in, dan log Mabar.
* `debts`: Pencatatan tagihan patungan antar pengguna.
* `tournaments`: Pengelolaan kompetisi lokal.
* `reviews`: Akumulasi rating bintang dan ulasan komentar pemain.

---

## 👨‍💻 Cara Menjalankan Lokal
1. Clone repository: `git clone [link-repo-anda]`
2. Masuk ke folder: `cd UTS-PPLT`
3. Install dependencies: `npm install`
4. Konfigurasi `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
5. Jalankan aplikasi:
   ```bash
   npm run dev
