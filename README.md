# 🏸 MCKING-STAR: Agile Badminton Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-in%20active%20development-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> **Mendigitalisasi Lapangan, Mengkoneksikan Pemain, Mengoptimalkan Bisnis.**

**MCKING-STAR** bukan sekadar alat administratif biasa; ini adalah platform *Sistem Manajemen Badminton* berbasis web yang dirancang secara komprehensif untuk merevolusi operasional fasilitas olahraga. Kami hadir untuk memecahkan masalah klasik: jadwal bentrok (*double-booking*), drama menagih uang patungan (*split bill*), pencatatan manual yang lambat, dan minimnya wawasan data bagi pemilik bisnis.

Sistem ini mengawinkan kebutuhan **Pemain** (kemudahan *booking*, pembayaran praktis, dan pengingat jadwal) dengan kebutuhan **Pengelola** (dasbor keuangan, *tiered pricing* untuk optimalisasi slot kosong, dan retensi pelanggan) dalam satu ekosistem *real-time* yang ditenagai oleh teknologi modern.

---

## 🌟 20 Fitur Unggulan (Core & Extended)

Kami merancang ekosistem yang holistik. Berikut adalah 20 pilar utama penopang MCKING-STAR:

### 🛡️ Manajemen & Fondasi
1. **Role Management System:** Autentikasi ketat dengan pembagian akses jelas antara *Admin* (pengelola), *Member* (anggota rutin), dan *Guest* (tamu).
2. **Master Data Lapangan (CRUD):** Kontrol penuh admin untuk mengatur spesifikasi lapangan (karpet/kayu/semen) beserta konfigurasi harga dasarnya.

### 📅 Sistem Pemesanan Jantung (Core Engine)
3. **Interactive Visual Schedule:** Kalender *grid* waktu yang intuitif. Sekali lirik, pemain tahu persis slot mana yang masih kosong.
4. **Real-Time Instant Booking:** *Lock* slot lapangan seketika saat dipilih, mencegah rebutan jadwal di detik yang sama.
5. **Collision Detection (Anti-Bentrok):** Validasi *backend* tingkat dewa yang mustahil kebobolan. Tidak ada lagi cerita dua tim datang di jam yang sama.
6. **Fair-Play Booking Limit:** Cegah monopoli jadwal (tengkulak lapangan) dengan pembatasan jam sewa harian per akun.

### 💸 Ekosistem Finansial & Pembayaran
7. **Dynamic Tiered Pricing:** Harga pintar yang otomatis menyesuaikan. Murah di *Off-Peak*, premium di *Prime Time*.
8. **Automated Split Bill:** Ucapkan selamat tinggal pada "nanti gue transfer ya". Sistem membagi total biaya secara otomatis ke semua akun peserta yang di-*tag*.
9. **Deposit Wallet:** Dompet digital internal untuk *checkout* secepat kilat tanpa repot verifikasi mutasi bank manual.
10. **Clear Transaction History:** Pencatatan mutasi transparan untuk setiap sen uang masuk (*top-up*) dan keluar (*booking/split bill*).
11. **Debt Tracking (Status Bayar):** Pantau siapa yang sudah "Lunas" dan siapa yang masih "Hutang" dalam satu pesanan patungan.

### 🤝 Interaksi & Pengalaman Pengguna
12. **WhatsApp Smart Reminder:** Integrasi API yang otomatis menembakkan *chat* pengingat 2 jam sebelum jadwal main.
13. **QR Code Check-in:** Datang, *scan*, main. Absensi digital instan untuk memvalidasi kehadiran pemain yang pembayarannya sudah lunas.

### 📈 Dasbor & Analitik Bisnis
14. **Executive Revenue Dashboard:** Visualisasi grafik pendapatan (harian/mingguan/bulanan) agar *owner* bisa memantau kesehatan bisnis sambil rebahan.
15. **User Retention Tracking:** Deteksi siapa "Sultan" dan "Aktivis" lapangan Anda untuk pemberian *reward* atau diskon loyalitas.

### ✨ [BARU] Eksekusi Fase Lanjutan (The Next Level)
16. **Rent-o-Gear (Manajemen Inventaris):** Lupa bawa kok? Raket putus? Fitur untuk menyewa raket, sepatu, atau beli *shuttlecock* yang langsung masuk ke tagihan *booking*.
17. **Matchmaking & "Cari Lawan":** Solusi buat pemain solo. Buka *room* publik untuk mencari teman *mabar* (main bareng) atau melengkapi slot ganda yang kurang orang.
18. **Tournament Generator:** Modul khusus untuk komunitas membuat turnamen mini, lengkap dengan *bracket* otomatis dan papan skor digital.
19. **Court Rating & Review:** Fitur ulasan pasca-main. Pemain bisa memberi bintang pada kualitas lampu, kebersihan, atau kondisi karpet lapangan.
20. **Player Gamification (Leaderboard):** Sistem *leveling* (*Bronze, Silver, Gold*) dan lencana (badges) berdasarkan seberapa sering pengguna bermain, memicu adiksi yang sehat!

---

## 🚀 Roadmap Pengembangan (Agile Sprint)

Pengembangan tahap awal (MVP) diselesaikan dalam **27 Hari** dengan ritme kerja yang ketat, dilanjutkan dengan fase ekspansi.

### 🏁 Fase 1: MVP & Core Systems (Hari 1 - 27)

* **Hari 1 - 3: Fondasi Identitas & Master Data**
    * Setup *Environment* & Database.
    * *(Fitur 1 & 2)*: Autentikasi Pengguna & CRUD Data Lapangan selesai.
* **Hari 4 - 8: Mesin Pemesanan Utama**
    * *(Fitur 3, 4 & 5)*: *Frontend* jadwal visual terkoneksi dengan *backend* *booking* dan algoritma *Collision Detection* aktif.
* **Hari 9 - 13: Regulasi & Logika Finansial**
    * *(Fitur 6, 7 & 8)*: Implementasi limitasi harian, integrasi harga dinamis (*Off-Peak/Prime*), dan logika *Automated Split Bill* rampung.
* **Hari 14 - 17: Ekosistem Pembayaran**
    * *(Fitur 9, 10 & 11)*: Dompet digital berfungsi. Uji coba *top-up*, mutasi riwayat, dan pelacakan status hutang/lunas sukses terintegrasi.
* **Hari 18 - 22: Integrasi Eksternal & Kehadiran**
    * *(Fitur 12 & 13)*: *Cron job* untuk WhatsApp Reminder berjalan lancar. Sistem *Generate* & *Scan QR Code* siap digunakan di lokasi.
* **Hari 23 - 27: Analitik & Visualisasi Data**
    * *(Fitur 14 & 15)*: *Rendering* grafik pendapatan *(Revenue Dashboard)* dan pelacakan retensi pengguna selesai untuk halaman Admin. Uji coba menyeluruh (UAT).

### 🌌 Fase 2: Ekspansi Fitur Komunitas (Hari 28 - 40)
* **Hari 28 - 32:** Implementasi *Rent-o-Gear* (Inventaris) dan modul *Court Rating*.
* **Hari 33 - 36:** Pembuatan sistem *Matchmaking* ("Cari Lawan") berbasis *real-time chat* atau *lobby*.
* **Hari 37 - 40:** Peluncuran *Tournament Generator* dan sistem *Leaderboard/Gamification*.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)
*(Silakan ubah bagian ini sesuai dengan stack yang kamu gunakan, misalnya:)*
* **Frontend:** React.js / Next.js, Tailwind CSS
* **Backend:** Node.js (Express) / Python (Django/FastAPI)
* **Database:** PostgreSQL / MongoDB
* **Integrasi:** Fonnte/Twilio (WhatsApp API), Midtrans (Payment Gateway untuk Top-Up Saldo)

---

## 🤝 Berkontribusi
Kami menyambut baik kontribusi dari komunitas! Jika Anda menemukan *bug* atau memiliki ide brilian, silakan buka *Issue* atau kirimkan *Pull Request*. 

1. *Fork* repositori ini
2. Buat *branch* fitur Anda (`git checkout -b feature/FiturKeren`)
3. *Commit* perubahan Anda (`git commit -m 'Menambahkan FiturKeren'`)
4. *Push* ke *branch* (`git push origin feature/FiturKeren`)
5. Buka *Pull Request*

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.

---
**MCKING-STAR** — *Let's Smash The Old Way of Managing Courts!* 🏸🔥
