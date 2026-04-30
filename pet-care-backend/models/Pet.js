const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: { type: String },
  age: { type: Number },
  weight: { type: Number },
  gender: { type: String, enum: ['Male', 'Female'] },
  profileImage: { type: String }
}, { timestamps: true });

const Pet = mongoose.model('Pet', petSchema);
module.exports = Pet;
