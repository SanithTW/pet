const mongoose = require('mongoose');

const petVaccineRecordSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Owner is required'] },
  vaccineName: { type: String, required: [true, 'Vaccine name is required'] },
  catalogVaccine: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaccine', default: null },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  dateAdministered: { type: Date },
  status: { type: String, enum: ['Scheduled', 'Completed'], default: 'Scheduled' },
  nextDueDate: { type: Date },
  documentUrl: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PetVaccineRecord', petVaccineRecordSchema);
