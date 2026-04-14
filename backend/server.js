const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Semua Model (Pastikan huruf awal besar sesuai nama file yang kita buat)
const Court = require('./models/Court');
const Booking = require('./models/Booking');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi Database MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mcking-star-db')
  .then(async () => {
    console.log('✅ Terhubung ke database MongoDB');
    const count = await Court.countDocuments();
    if (count === 0) {
      await Court.insertMany([
        { name: 'Lapangan 1 (VVIP)', type: 'Karpet', basePrice: 50000 },
        { name: 'Lapangan 2', type: 'Kayu', basePrice: 40000 },
        { name: 'Lapangan 3', type: 'Semen', basePrice: 35000 },
      ]);
      console.log('🌱 Data awal lapangan berhasil ditambahkan');
    }
  })
  .catch((err) => console.error('❌ Gagal terhubung:', err.message));

// ==========================================
// 1. API: MASTER DATA LAPANGAN & JADWAL
// ==========================================
app.get('/api/courts', async (req, res) => {
  const courts = await Court.find();
  res.json(courts);
});

app.get('/api/bookings', async (req, res) => {
  const { courtId, date } = req.query;
  const bookings = await Booking.find({ courtId, date, status: 'Booked' });
  res.json(bookings);
});

// ==========================================
// 2. API: DOMPET DIGITAL (WALLET)
// ==========================================
app.post('/api/users/login', async (req, res) => {
  const { name, password, phone } = req.body;
  
  try {
    let user = await User.findOne({ name });
    
    // Jika user BELUM ADA, buat akun baru
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ 
        name, 
        password: hashedPassword, 
        balance: 100000,
        phone: req.body.phone || "62" // <--- Ambil nomor HP dari input
      });
      await user.save();
      return res.status(201).json({ message: 'Akun & WA berhasil didaftarkan!', user });
    }

    // Jika user SUDAH ADA, cek password (Login)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '❌ Password salah!' });
    }

    res.json({ message: 'Login berhasil!', user });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses akun' });
  }
});

app.post('/api/users/topup', async (req, res) => {
  const { name, amount } = req.body;
  try {
    let user = await User.findOne({ name });
    user.balance += parseInt(amount);
    await user.save();
    res.json({ message: 'Top-Up Berhasil!', balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Gagal Top-Up' });
  }
});

// ==========================================
// 3. API: MESIN BOOKING (Real Split Bill / Patungan Otomatis)
// ==========================================
app.post('/api/bookings', async (req, res) => {
  // Tambahkan equipments dan additionalCost ke dalam destructuring
  const { courtId, playerName, date, startTime, splitMembers, equipments, additionalCost } = req.body; 
  
  try {
    // A. Cek Bentrok & Limit
    const existingBooking = await Booking.findOne({ courtId, date, startTime, status: 'Booked' });
    if (existingBooking) return res.status(400).json({ message: 'Maaf, jadwal ini bentrok.' });

    const userBookingsToday = await Booking.countDocuments({ playerName, date, status: 'Booked' });
    if (userBookingsToday >= 3) return res.status(400).json({ message: `Batas harian (3 jam) habis.` });

    // B. Hitung Harga Total (Harga Dasar + Prime Time + Sewa Alat)
    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: 'Lapangan tidak ditemukan' });

    let basePrice = court.basePrice;
    
    // Cek Prime Time (Jam 18:00 - 22:00 tambah 20rb)
    const jam = parseInt(startTime.split(':')[0]);
    if (jam >= 18 && jam <= 22) {
      basePrice += 20000;
    }

    // Tambahkan biaya sewa raket/kok
    const alatCost = additionalCost || 0;
    const totalTagihan = basePrice + alatCost; 
    const patunganPerOrang = totalTagihan / splitMembers.length;

    // C. LOGIKA SPLIT BILL SUNGGUHAN
    const users = await User.find({ name: { $in: splitMembers } });

    if (users.length !== splitMembers.length) {
      return res.status(400).json({ message: 'Booking Gagal: Ada temanmu yang belum punya akun di MCKING-STAR. Pastikan ejaan namanya benar!' });
    }

    // Cek saldo semua user yang ikut patungan
    for (let u of users) {
      if (u.balance < patunganPerOrang) {
        return res.status(400).json({ 
          message: `Booking Gagal: Saldo milik '${u.name}' tidak cukup! (Sisa saldonya: Rp ${u.balance.toLocaleString('id-ID')}). Butuh Rp ${patunganPerOrang.toLocaleString('id-ID')} per orang.` 
        });
      }
    }

    // Jika semua aman, potong saldo mereka
    for (let u of users) {
      u.balance -= patunganPerOrang;
      await u.save(); 
    }

    // ==========================================
    // D. Simpan Booking (Hanya Ada 1 const newBooking)
    // ==========================================
    const newBooking = new Booking({ 
      courtId, 
      playerName, 
      date, 
      startTime, 
      price: totalTagihan, 
      splitCount: splitMembers.length, 
      splitPrice: patunganPerOrang,
      splitMembers: splitMembers,
      equipments: equipments || [], // Menyimpan daftar raket/kok
      additionalCost: alatCost,      // Menyimpan total harga alat
      isPublic: req.body.isPublic || false,
      maxPlayers: req.body.maxPlayers || 4,
      joinedPlayers: [],
      joinPrice: req.body.joinPrice || patunganPerOrang
    });
    
    await newBooking.save();
    
    const loggedInUser = users.find(u => u.name === playerName);

    res.status(201).json({ 
      message: 'Booking & Patungan Otomatis berhasil!', 
      booking: newBooking, 
      sisaSaldo: loggedInUser.balance 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal melakukan booking pada server' });
  }
});

// ==========================================
// 4. API: TIKET SAYA (Riwayat Pemesanan & QR Code)
// ==========================================
app.get('/api/bookings/my', async (req, res) => {
  const { playerName } = req.query;
  try {
    const myBookings = await Booking.find({
      $or: [
        { playerName: playerName },      // Kamu yang pesan
        { splitMembers: playerName }    // Kamu diajak teman (Patungan)
      ],
      status: 'Booked'
    }).sort({ createdAt: -1 }); // Munculkan yang terbaru di atas
    
    res.json(myBookings);
  } catch (error) {
    console.error("Error ambil tiket:", error);
    res.status(500).json({ message: 'Gagal mengambil data tiket' });
  }
});

// ==========================================
// 5. API: DASHBOARD ADMIN (Laporan Pendapatan)
// ==========================================
app.get('/api/admin/revenue', async (req, res) => {
  try {
    const allBookings = await Booking.find({ status: 'Booked' });
    
    // Hitung Total Pendapatan Keseluruhan
    const totalRevenue = allBookings.reduce((sum, item) => sum + item.price, 0);
    
    // Hitung Total Booking
    const totalTransactions = allBookings.length;

    // Ambil  Transaksi Terbaru untuk ditampilkan di tabel
    const recentTransactions = await Booking.find({ status: 'Booked' })
      .sort({ createdAt: -1 })

    res.json({
      totalRevenue,
      totalTransactions,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat laporan pendapatan' });
  }
});

// API: Menghapus Semua Data Booking (Khusus Admin)
app.delete('/api/admin/bookings/reset', async (req, res) => {
  try {
    // Menghapus SEMUA isi collection bookings
    await Booking.deleteMany({}); 
    res.json({ message: 'Semua data booking telah dibersihkan!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data di server' });
  }
});

// API: Mendapatkan Daftar Pelanggan Terloyal (Top 5)
// API: Mendapatkan Daftar Pelanggan Terloyal (Berdasarkan kemunculan di Split Bill)
app.get('/api/admin/loyal-customers', async (req, res) => {
  try {
    const loyalStats = await Booking.aggregate([
      { $match: { status: "Booked" } },
      // 1. Pecah array splitMembers menjadi dokumen masing-masing nama
      { $unwind: "$splitMembers" }, 
      // 2. Kelompokkan berdasarkan nama pemain
      { 
        $group: { 
          _id: "$splitMembers", 
          totalBookings: { $sum: 1 }, // Menghitung berapa kali nama ini muncul di lapangan
          totalContribution: { $sum: "$splitPrice" } // Opsional: Menghitung berapa total uang yang dia keluarkan
        } 
      },
      // 3. Urutkan dari yang paling sering main
      { $sort: { totalBookings: -1 } },
      { $limit: 5 }
    ]);
    res.json(loyalStats);
  } catch (error) {
    console.error("Error loyal customers:", error);
    res.status(500).json({ message: "Gagal memuat data pelanggan setia" });
  }
});

// API: Tambah Ulasan & Rating Lapangan (Fitur 19)
app.post('/api/courts/:id/reviews', async (req, res) => {
  const { playerName, rating, comment } = req.body;
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: 'Lapangan tidak ditemukan' });

    // Masukkan ulasan baru ke dalam array lapangan
    court.reviews.push({ playerName, rating: Number(rating), comment });
    await court.save();

    res.json({ message: 'Terima kasih atas ulasan Anda! ⭐' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan ulasan' });
  }
});

// ==========================================
// FITUR 17: LOBI MABAR (MATCHMAKING)
// ==========================================

// API 1: Ambil semua jadwal yang dibuka untuk umum
// ==========================================
// FITUR 17: LOBI MABAR (MATCHMAKING)
// ==========================================

// API 1: Ambil semua jadwal yang dibuka untuk umum
app.get('/api/matches/public', async (req, res) => {
  try {
    const matches = await Booking.find({ isPublic: true, status: 'Booked' }).sort({ date: 1, startTime: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat lobi Mabar" });
  }
});

// API 2: Ikut Mabar (Join Match)
app.post('/api/matches/:id/join', async (req, res) => {
  const { playerName } = req.body;
  try {
    const match = await Booking.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Jadwal tidak ditemukan" });

    const totalCurrentPlayers = (match.splitMembers ? match.splitMembers.length : 1) + match.joinedPlayers.length;
    if (totalCurrentPlayers >= match.maxPlayers) return res.status(400).json({ message: "Lobi sudah penuh!" });

    if (match.playerName === playerName || (match.splitMembers && match.splitMembers.includes(playerName)) || match.joinedPlayers.includes(playerName)) {
      return res.status(400).json({ message: "Kamu sudah ada di dalam lobi ini!" });
    }

    const user = await User.findOne({ name: playerName });
    const patungan = match.joinPrice || match.splitPrice;

    if (user.balance < patungan) return res.status(400).json({ message: `Saldo tidak cukup. Patungan: Rp ${patungan}` });

    // Potong saldo Joiner
    user.balance -= patungan;
    await user.save();

    // Berikan uang patungan ke si Pembuat Lobi
    const creator = await User.findOne({ name: match.playerName });
    if (creator) {
      creator.balance += patungan;
      await creator.save();
    }

    // Masukkan nama ke daftar
    match.joinedPlayers.push(playerName);
    await match.save();

    res.json({ message: "Berhasil bergabung ke Mabar!", sisaSaldo: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Gagal bergabung ke mabar" });
  }
});

// ==========================================
// FITUR 18: TURNAMEN KOMUNITAS
// ==========================================

// Schema Turnamen
const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  fee: { type: Number, required: true },
  maxPlayers: { type: Number, default: 8 },
  participants: [String],
  status: { type: String, default: 'Open' } 
});
const Tournament = mongoose.model('Tournament', tournamentSchema);

// API 1: Ambil Data Turnamen
app.get('/api/tournaments', async (req, res) => {
  try {
    const t = await Tournament.find().sort({ date: 1 });
    res.json(t);
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat turnamen" });
  }
});

// API 2: Bikin Turnamen Baru
app.post('/api/tournaments', async (req, res) => {
  const { name, date, fee } = req.body;
  try {
    const newT = new Tournament({ name, date, fee });
    await newT.save();
    res.status(201).json({ message: "Turnamen berhasil dibuat!" });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat turnamen" });
  }
});

// API 3: Daftar (Join) Turnamen
app.post('/api/tournaments/:id/join', async (req, res) => {
  const { playerName } = req.body;
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Turnamen tidak ditemukan" });
    if (t.participants.length >= t.maxPlayers) return res.status(400).json({ message: "Slot turnamen sudah penuh!" });
    if (t.participants.includes(playerName)) return res.status(400).json({ message: "Kamu sudah terdaftar di turnamen ini!" });

    const user = await User.findOne({ name: playerName });
    if (user.balance < t.fee) return res.status(400).json({ message: `Saldo tidak cukup untuk pendaftaran (Rp ${t.fee})` });

    // Potong saldo
    user.balance -= t.fee;
    await user.save();

    // Masukkan ke turnamen
    t.participants.push(playerName);
    if (t.participants.length === t.maxPlayers) t.status = 'Ongoing';
    await t.save();

    res.json({ message: "Berhasil daftar turnamen! Semoga menang! 🏆", sisaSaldo: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Gagal mendaftar turnamen" });
  }
});

// API Login (Update Fitur 20)
app.post('/api/users/login', async (req, res) => {
  const { name, password, phone } = req.body;
  try {
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name, password, phone, balance: 0 });
      await user.save();
    } else {
      if (user.password !== password) return res.status(401).json({ message: 'Password salah!' });
    }

    // HITUNG TOTAL MAIN UNTUK LEVEL (Fitur 20)
    const totalPlay = await Booking.countDocuments({ playerName: name, status: 'Booked' });
    
    let level = "Bronze";
    if (totalPlay > 15) level = "Gold 🏆";
    else if (totalPlay > 5) level = "Silver 🥈";
    else level = "Bronze 🥉";

    res.json({ 
      message: 'Selamat datang kembali!', 
      user: { ...user._doc, totalPlay, level } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal login' });
  }
});

// ==========================================
// FITUR 2: MANAJEMEN LAPANGAN (ADMIN)
// ==========================================
app.post('/api/courts', async (req, res) => {
  try {
    const newCourt = new Court({ name: req.body.name, basePrice: req.body.basePrice, reviews: [] });
    await newCourt.save();
    res.status(201).json({ message: "Lapangan berhasil ditambahkan!" });
  } catch (error) { res.status(500).json({ message: "Gagal menambah lapangan" }); }
});

app.delete('/api/courts/:id', async (req, res) => {
  try {
    await Court.findByIdAndDelete(req.params.id);
    res.json({ message: "Lapangan berhasil dihapus!" });
  } catch (error) { res.status(500).json({ message: "Gagal menghapus lapangan" }); }
});


// ==========================================
// FITUR 11: CATATAN HUTANG / LUNAS
// ==========================================
const debtSchema = new mongoose.Schema({
  creditor: String, // Yang minjemin (Pembuat Booking)
  debtor: String,   // Yang ngutang (Teman yang diajak)
  amount: Number,
  status: { type: String, default: 'Belum Lunas' },
  date: String
});
const Debt = mongoose.model('Debt', debtSchema);

// Tambah Hutang Manual / Otomatis
app.post('/api/debts', async (req, res) => {
  try {
    const newDebt = new Debt(req.body);
    await newDebt.save();
    res.status(201).json({ message: "Hutang berhasil dicatat!" });
  } catch (err) { res.status(500).json({ message: "Gagal mencatat hutang" }); }
});

// Ambil Data Hutang Pemain
app.get('/api/debts/:playerName', async (req, res) => {
  const name = req.params.playerName;
  try {
    const dihutangi = await Debt.find({ creditor: name });
    const ngutang = await Debt.find({ debtor: name });
    res.json({ dihutangi, ngutang });
  } catch (err) { res.status(500).json({ message: "Gagal memuat buku hutang" }); }
});

// Bayar Hutang Pakai Saldo
app.post('/api/debts/:id/pay', async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt || debt.status === 'Lunas') return res.status(400).json({ message: "Hutang tidak valid" });

    const debtorUser = await User.findOne({ name: debt.debtor });
    const creditorUser = await User.findOne({ name: debt.creditor });

    if (debtorUser.balance < debt.amount) return res.status(400).json({ message: "Saldomu tidak cukup untuk melunasi!" });

    // Pindah Saldo
    debtorUser.balance -= debt.amount;
    creditorUser.balance += debt.amount;
    debt.status = 'Lunas';

    await debtorUser.save();
    await creditorUser.save();
    await debt.save();

    res.json({ message: "Hutang berhasil dilunasi ke temanmu!", sisaSaldo: debtorUser.balance });
  } catch (err) { res.status(500).json({ message: "Gagal membayar hutang" }); }
});

// ==========================================
// FITUR VERIFIKASI AKUN TEMAN (SPLIT BILL)
// ==========================================
app.post('/api/users/verify', async (req, res) => {
  const { names } = req.body;
  try {
    // Cari semua user yang namanya ada di dalam daftar (Case Sensitive)
    const existingUsers = await User.find({ name: { $in: names } });
    const existingNames = existingUsers.map(u => u.name);
    
    // Cari tahu nama siapa yang TIDAK ADA di database
    const notFound = names.filter(n => !existingNames.includes(n));
    
    if (notFound.length > 0) {
      return res.status(400).json({ message: `Pemain tidak ditemukan: ${notFound.join(', ')}` });
    }
    
    res.json({ message: "Semua pemain valid!" });
  } catch (error) {
    res.status(500).json({ message: "Gagal verifikasi pemain" });
  }
});

// ==========================================
// JALANKAN SERVER (Cukup 1 kali di paling bawah)
// ==========================================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend Server berjalan di http://localhost:${PORT}`));