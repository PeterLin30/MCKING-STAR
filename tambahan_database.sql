-- ===========================================================================
-- SETUP DATABASE MCKING-STAR (SUPABASE / POSTGRESQL)
-- ===========================================================================

-- 1. TABEL PENGGUNA (USERS)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  balance INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Bronze 🥉',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL LAPANGAN (COURTS)
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL TRANSAKSI & JADWAL (BOOKINGS)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT false,
  max_players INTEGER DEFAULT 4,
  split_members TEXT[] DEFAULT '{}',
  joined_players TEXT[] DEFAULT '{}',
  join_price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'booked',
  additional_items JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL BUKU HUTANG (DEBTS)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creditor_name TEXT NOT NULL,
  debtor_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL KOMPETISI (TOURNAMENTS)
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  fee INTEGER NOT NULL,
  participants TEXT[] DEFAULT '{}',
  max_slots INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL ULASAN (REVIEWS)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- DATA AWAL (SEEDER) AGAR APLIKASI LANGSUNG BISA DIGUNAKAN
-- ===========================================================================

-- Menyuntikkan 4 Lapangan Default
INSERT INTO courts (name, base_price) VALUES
('VIP 1 (Karpet BWF)', 50000),
('VIP 2 (Karpet BWF)', 50000),
('Reguler A (Lantai Kayu)', 30000),
('Reguler B (Lantai Kayu)', 30000)
ON CONFLICT DO NOTHING;

-- Menyuntikkan Akun Admin (Password: 123)
INSERT INTO users (name, password, role, balance, xp, level) VALUES
('admin', '123', 'admin', 1000000, 500, 'Diamond 💎')
ON CONFLICT (name) DO NOTHING;