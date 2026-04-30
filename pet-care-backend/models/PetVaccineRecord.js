const mongoose = require('mongoose');

const petVaccineRecordSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vaccine: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaccine', required: true },
  dateAdministered: { type: Date, required: true },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PetVaccineRecord', petVaccineRecordSchema);
