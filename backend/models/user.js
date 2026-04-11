const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: {      // <--- TAMBAHAN BARU
    type: String, 
    required: true 
  },
  balance: { 
    type: Number, 
    default: 0 
  },
  phone: { 
    type: String, 
    default: "628" }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);