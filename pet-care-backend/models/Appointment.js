const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vet: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'VetSchedule' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Approved', 'Completed', 'Cancelled', 'Rejected'], default: 'Pending' },
  vetNotes: { type: String },
  invoiceUrl: { type: String }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
