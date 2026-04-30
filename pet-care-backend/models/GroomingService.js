const mongoose = require('mongoose');

const groomingServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },           // e.g. "Full Groom"
  price: { type: Number, required: true },          // e.g. 2500
  duration: { type: String, required: true },       // e.g. "90 mins"
  description: { type: String, required: true },    // what is included
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('GroomingService', groomingServiceSchema);
