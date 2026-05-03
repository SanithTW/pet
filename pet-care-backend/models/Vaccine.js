const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vaccine name is required'], trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vaccineSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Vaccine', vaccineSchema);
