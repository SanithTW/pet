const mongoose = require('mongoose');

const groomingBookingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pet',  required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'GroomingService', required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('GroomingBooking', groomingBookingSchema);
