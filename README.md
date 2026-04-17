# 🏸 MCKING-STAR: Sistem Manajemen Badminton Modern

**MCKING-STAR** adalah aplikasi berbasis web komprehensif yang dirancang untuk mendigitalisasi operasional lapangan badminton. Aplikasi ini mengintegrasikan sistem pemesanan real-time, manajemen finansial sosial (Split Bill & Hutang), serta validasi kehadiran menggunakan teknologi QR Code. 

Dibangun dengan arsitektur modern Jamstack, aplikasi ini memisahkan sisi frontend yang cepat dan responsif dengan sisi backend berbasis Cloud untuk memastikan ketersediaan data secara real-time.

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
* **Auto-Register & Bonus:** Pengguna baru cukup memasukkan nama dan password untuk terdaftar secara otomatis, serta mendapatkan Bonus Saldo Awal Rp 100.000.
* **Role Management:** Pembagian hak akses otomatis antara Admin (Ruang Komando) dan User (Booking & Tiket).
* **XP & Leveling System:** Pengguna mendapatkan Experience Points (XP) setiap kali bermain untuk meningkatkan level profil mereka.

### 2. Intelligent Booking System
* **Visual Interactive Schedule:** Pemilihan slot waktu (08:00 - 22:00) yang terkunci secara otomatis jika sudah dipesan.
* **Night Surcharge:** Otomatisasi penambahan biaya Rp 20.000 untuk pemesanan di atas jam 18:00.
* **Inventory Integration:** Penyewaan raket dan kok langsung dalam satu paket pemesanan.
* **Collision Detection:** Validasi database yang mencegah satu slot waktu dipesan oleh dua orang berbeda.

### 3. Sosial & Finansial (Sistem Hutang)
* **Automated Split Bill:** Membagi total biaya sewa kepada teman yang diajak secara otomatis.
* **Debt Blocker:** Sistem secara cerdas memblokir fitur Booking, Mabar, dan Turnamen bagi pengguna yang masih memiliki hutang belum lunas.
* **Wallet & Top-up:** Sistem saldo digital dengan fitur Voucher Promo MCKINGPRO untuk mendapatkan bonus saldo Rp 50.000.
* **Buku Hutang:** Pencatatan piutang (uang di luar) dan hutang pribadi dengan fitur pelunasan sekali klik.

### 4. Lobi Mabar & Turnamen
* **Public Matchmaking**: Fitur untuk membuka jadwal pribadi menjadi lobi umum agar pemain lain bisa bergabung dan berbagi biaya.
* **Tournament Board**: Manajemen kompetisi lokal lengkap dengan bagan perempat final dan sistem pendaftaran otomatis.

### 5. Validasi Kehadiran (QR Code Real-time)
* **Dynamic QR Ticket:** Setiap pesanan menghasilkan QR Code unik yang berfungsi sebagai tiket masuk.
* **Time Window Validation:** Tiket hanya bisa di-scan oleh Admin 1 jam sebelum hingga 1 jam sesudah jadwal main dimulai.
* **Real-time Check-in:** Begitu Admin melakukan verifikasi (via kamera HP atau manual), layar User akan otomatis memunculkan pesan "Selamat Bermain" secara instan.

### 6. Admin Ruang Komando
* **Revenue Analytics:** Grafik pendapatan dinamis yang mencakup data Omzet dan Laba Bersih.
* **Dynamic Period Filter:** Analisis pendapatan berdasarkan filter 7 Hari, 1 Bulan, 3 Bulan, hingga 6 Bulan Terakhir.
* **Mobile Camera Scanner:** Admin dapat menggunakan kamera HP langsung dari browser untuk melakukan scanning tiket pemain di lokasi GOR.
* **Hall of Fame:** Melacak 5 pelanggan paling loyal berdasarkan total kontribusi finansial.

---

## 📂 Struktur Database (Supabase)
Seluruh logika data dikelola menggunakan PostgreSQL di Supabase dengan tabel utama:
* `users`: Mengelola saldo, XP, dan kredensial.
* `courts`: Menyimpan data lapangan dan harga.
* `bookings`: Master data transaksi, jadwal, dan status kehadiran.
* `debts`: Melacak hutang antar pengguna akibat split bill.
* `tournaments`: Data kompetisi dan peserta.
* `reviews`: Menyimpan rating bintang dan ulasan lapangan.

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
