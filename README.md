# MCKING-STAR
Proyek RPL

# 🏸 Sistem Manajemen Badminton

Sistem Manajemen Badminton adalah sebuah aplikasi berbasis web komprehensif yang dirancang untuk mendigitalisasi dan mengotomatisasi seluruh operasional lapangan atau komunitas badminton.

Ide utamanya adalah memecahkan masalah klasik dalam manajemen olahraga: jadwal yang bentrok (*double-booking*), kesulitan menagih uang patungan (*split bill*), lambatnya pencatatan manual, dan kurangnya data analitik untuk pemilik bisnis. 

Sistem ini menjembatani kebutuhan pemain (kemudahan *booking*, pembayaran, dan pengingat) dengan kebutuhan pengelola/admin (laporan keuangan, optimalisasi jam kosong melalui *tiered pricing*, dan retensi pelanggan) dalam satu ekosistem yang *real-time* dan terintegrasi dengan teknologi modern (IoT/QR Code & WhatsApp API).

---

## 🌟 15 Fitur Penting dalam Sistem

1. **Manajemen Role Pengguna:** Sistem autentikasi dengan pembagian hak akses yang jelas antara *Admin* (pengelola), *Member* (anggota rutin), dan *Guest* (tamu).
2. **Manajemen Data Lapangan (CRUD):** Fitur bagi admin untuk menambah, mengedit, atau menonaktifkan lapangan beserta spesifikasinya (tipe karpet/kayu).
3. **Visual Schedule (Kalender Interaktif):** Tampilan jadwal berbentuk *grid* waktu yang intuitif sehingga pemain bisa melihat slot kosong secara visual.
4. **Booking Instant (Real-Time):** Fitur pemesanan lapangan langsung di mana ketersediaan slot di-*lock* secara *real-time* saat dipilih.
5. **Collision Detection (Anti-Bentrok):** Validasi logika di *backend* yang secara tegas menolak pemesanan pada jam dan lapangan yang tumpang tindih dengan pesanan lain.
6. **Limit Booking Fair-Play:** Pembatasan pemesanan maksimal (misal: 2 jam per hari untuk satu akun) guna mencegah monopoli jadwal oleh pihak tertentu.
7. **Tiered Pricing (Harga Dinamis):** Sistem yang otomatis membedakan tarif sewa berdasarkan jam, yaitu *Off-Peak* (lebih murah) dan *Prime Time* (lebih mahal).
8. **Automated Split Bill:** Fitur untuk membagi rata total biaya sewa kepada seluruh peserta yang di-*tag* dalam *booking*, menggantikan tagihan manual.
9. **Deposit Wallet (Sistem Saldo):** Dompet digital internal di mana anggota bisa *top-up* dana untuk mempercepat proses *checkout* tanpa perlu verifikasi bank setiap saat.
10. **Transaction History:** Pencatatan mutasi saldo (uang masuk dari *top-up*, uang keluar untuk *booking* atau bayar utang *split bill*).
11. **Tracking Status Bayar (Lunas/Hutang):** Sistem pelacakan individu untuk setiap peserta di satu pesanan, memastikan tidak ada yang "kabur" dari patungan.
12. **WhatsApp Reminder:** Integrasi API (via Fonnte/Twilio) untuk mengirim pesan pengingat otomatis ke WhatsApp peserta 2 jam sebelum jadwal main.
13. **QR Code Check-in:** Fitur absensi modern di mana sistem menghasilkan kode QR untuk di-*scan* di lokasi lapangan guna memvalidasi kehadiran pemain.
14. **Revenue Dashboard (Laporan Keuangan):** Grafik analitik untuk admin yang merangkum total pendapatan harian, mingguan, hingga bulanan.
15. **User Retention Tracking:** Analitik untuk melacak *member* paling aktif dan loyal, yang nantinya bisa digunakan admin untuk memberikan diskon atau *reward* khusus.

---

## 🚀 Roadmap Pengembangan (27 Hari)

### Hari 1 - 3: Fondasi Identitas & Master Data
*Pada tahap ini, kerangka dasar aplikasi sudah bisa berdiri.*
* **Fitur 1 (Manajemen Role Pengguna) Selesai:** Sistem autentikasi, registrasi, dan batas akses antara Admin, Member, dan Guest sudah berfungsi penuh.
* **Fitur 2 (Manajemen Data Lapangan) Selesai:** Admin sudah bisa menambahkan, mengedit, atau menghapus data lapangan (termasuk jenis lapangan dan harga dasar) ke dalam *database*.

### Hari 4 - 8: Mesin Pemesanan Utama (*Core Engine*)
*Fokus beralih ke layar utama bagi pengguna dan logika transaksinya.*
* **Fitur 3 (Visual Schedule) Selesai:** Antarmuka kalender interaktif sudah tampil di *frontend*, menarik data kosong/terisi dari *database*.
* **Fitur 4 (Booking Instant) Selesai:** Pengguna sudah bisa mengklik slot kosong dan melakukan proses pemesanan lapangan.
* **Fitur 5 (Collision Detection) Selesai:** Algoritma pencegah bentrok waktu sudah aktif di *backend*, secara otomatis menolak pemesanan di jam dan lapangan yang sama.

### Hari 9 - 13: Regulasi & Logika Finansial
*Sistem mulai diatur agar adil dan mengotomatisasi kalkulasi biaya yang rumit.*
* **Fitur 6 (Limit Booking) Selesai:** Sistem sudah bisa memblokir pengguna yang mencoba memesan lebih dari batas maksimal jam harian.
* **Fitur 7 (Tiered Pricing) Selesai:** Harga yang muncul di halaman *checkout* sudah otomatis berubah tergantung apakah pengguna memesan di jam *Off-Peak* atau *Prime Time*.
* **Fitur 8 (Automated Split Bill) Selesai:** Sistem berhasil menghitung total biaya dan membaginya ke seluruh akun peserta yang ditambahkan dalam satu pemesanan.

### Hari 14 - 17: Ekosistem Pembayaran (*Wallet*)
*Proses perputaran uang internal diselesaikan di tahap ini.*
* **Fitur 9 (Deposit Wallet) Selesai:** Pengguna memiliki saldo digital mandiri dan bisa melakukan simulasi *top-up*.
* **Fitur 10 (Transaction History) Selesai:** Setiap pergerakan uang (masuk/keluar) sudah tercatat rapi dalam tabel riwayat masing-masing pengguna.
* **Fitur 11 (Tracking Status Bayar) Selesai:** Label status (Lunas/Hutang) pada tagihan *split bill* sudah otomatis berubah menjadi "Lunas" saat saldo pengguna terpotong.

### Hari 18 - 22: Integrasi Eksternal & Kehadiran
*Aplikasi mulai dihubungkan dengan dunia nyata.*
* **Fitur 12 (WhatsApp Reminder) Selesai:** *Cron job* (penjadwalan otomatis) sudah berjalan dan sukses mengirimkan pesan WhatsApp ke pemain 2 jam sebelum jadwal dimulai.
* **Fitur 13 (QR Code Check-in) Selesai:** Sistem berhasil men-*generate* QR Code unik untuk setiap pesanan lunas, dan Admin bisa melakukan *scan* untuk menandai kehadiran pemain di lokasi.

### Hari 23 - 27: Analitik & Visualisasi Data
*Tahap penyelesaian khusus untuk dasbor operasional pemilik/Admin.*
* **Fitur 14 (Revenue Dashboard) Selesai:** Grafik pendapatan harian, mingguan, dan bulanan sudah ter-*render* sempurna di halaman Admin.
* **Fitur 15 (User Retention Tracking) Selesai:** Sistem sudah bisa menampilkan peringkat pengguna paling aktif beserta total kontribusi finansial mereka, siap digunakan untuk program loyalitas.
