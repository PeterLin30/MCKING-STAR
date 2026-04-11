const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['Karpet', 'Kayu', 'Semen'], 
    default: 'Karpet' 
  },
  basePrice: { 
    type: Number, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  reviews: [{
    playerName: String,
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Court', courtSchema);