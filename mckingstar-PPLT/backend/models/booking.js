const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  courtId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Court', 
    required: true 
  },
  playerName: { 
    type: String, 
    required: true // Nama pemesan utama (yang login)
  },
  // --- FITUR DAFTAR PEMAIN (SPLIT BILL) ---
  splitMembers: {
    type: [String], 
    default: [] // Menyimpan semua nama pemain yang ikut patungan
  },
  date: { 
    type: String,
    required: true 
  },
  startTime: { 
    type: String,
    required: true 
  },
  price: { 
    type: Number,
    required: true // Total harga lapangan (setelah prime time)
  },
  splitCount: { 
    type: Number, 
    default: 1 
  },
  splitPrice: { 
    type: Number // Harga yang dipotong per orang
  },
  // ----------------------------------------
  status: { 
    type: String, 
    enum: ['Booked', 'Canceled'], 
    default: 'Booked' 
  },
  splitPrice: { 
    type: Number, 
    required: true },
  equipments: [String], 
  additionalCost: { 
    type: Number, 
    default: 0 },

  status: { type: String, default: 'Booked' },

  isPublic: { type: Boolean, default: false },
  maxPlayers: { type: Number, default: 4 },
  joinedPlayers: [String], 
  joinPrice: { type: Number, default: 0 },
  // --------------------------------------
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);