// Pastikan kamu menginstal dotenv: npm install dotenv @supabase/supabase-js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Masukkan URL dan Key kamu langsung di sini jika tidak pakai file .env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fajjkhecefvnvuvcheta.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhampraGVjZWZ2bnZ1dmNoZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mjc1MzUsImV4cCI6MjA5MjAwMzUzNX0.EvKH6tKMHtiW5Vl1L0HpfxnEd4befGvkV1ArZjFvG1k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🚀 Memulai proses injeksi data ke Supabase...');

  // 1. Menyuntikkan Lapangan
  const courts = [
    { name: 'VIP 1 (Karpet BWF)', base_price: 50000 },
    { name: 'VIP 2 (Karpet BWF)', base_price: 50000 },
    { name: 'Reguler A (Lantai Kayu)', base_price: 30000 },
    { name: 'Reguler B (Lantai Kayu)', base_price: 30000 }
  ];
  console.log('🏟️ Menambahkan daftar lapangan...');
  const { data: savedCourts } = await supabase.from('courts').insert(courts).select();

  // 2. Menyuntikkan Pemain & Admin
  const users = [
    { name: 'admin', password: '123', balance: 1000000, xp: 500, level: 'Diamond 💎', role: 'admin' },
    { name: 'Peter', password: '123', balance: 500000, xp: 120, level: 'Gold 🥇', role: 'user' },
    { name: 'Budi', password: '123', balance: 200000, xp: 50, level: 'Silver 🥈', role: 'user' },
    { name: 'Andi', password: '123', balance: 50000, xp: 20, level: 'Bronze 🥉', role: 'user' }
  ];
  console.log('👥 Menambahkan akun pemain...');
  await supabase.from('users').insert(users);

  // 3. Menyuntikkan Riwayat Transaksi (Butuh ID Lapangan)
  if (savedCourts && savedCourts.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const bookings = [
      {
        court_id: savedCourts[0].id,
        player_name: 'Peter',
        booking_date: today,
        start_time: '19:00',
        price: 70000,
        is_public: false,
        max_players: 4,
        joined_players: [],
        additional_items: { racket: 1, kok: 0 }
      },
      {
        court_id: savedCourts[2].id,
        player_name: 'Budi',
        booking_date: today,
        start_time: '20:00',
        price: 50000,
        is_public: true,
        max_players: 6,
        joined_players: ['Andi'],
        additional_items: { racket: 0, kok: 1 }
      }
    ];
    console.log('🏸 Menambahkan riwayat booking & mabar...');
    await supabase.from('bookings').insert(bookings);
  }

  console.log('✅ Seeding Selesai! Database MCKING-STAR siap untuk presentasi.');
}

seedDatabase();