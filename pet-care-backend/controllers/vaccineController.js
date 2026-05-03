const { persistMedia } = require('../utils/persistMedia');
const PetVaccineRecord = require('../models/PetVaccineRecord');
const Pet = require('../models/Pet');

// @desc    Add a vaccine record for a pet
// @route   POST /api/vaccines/records
// @access  Private
const addVaccineRecord = async (req, res) => {
  try {
    const { petId, vaccineName, dateAdministered, notes } = req.body;
    if (!petId || !vaccineName) {
      res.status(400);
      throw new Error('Pet and vaccine name are required');
    }
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404);
      throw new Error('Pet not found');
    }

    // Authorization: Owner themselves, or a Vet/Admin
    const isOwner = pet.owner.toString() === req.user._id.toString();
    const isStaff = ['admin', 'vet'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      res.status(401);
      throw new Error('Not authorized to add records for this pet');
    }

    const record = await PetVaccineRecord.create({
      pet: petId,
      owner: pet.owner, // Always link to the actual pet owner
      vaccineName,
      dateAdministered,
      status: dateAdministered ? 'Completed' : 'Scheduled',
      notes
    });
    await record.populate('pet', 'name species');
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get vaccine records for the logged in user (includes admin-added records)
const getMyVaccineRecords = async (req, res) => {
  try {
    const myPets = await Pet.find({ owner: req.user._id }).select('_id');
    const petIds = myPets.map(p => p._id);

    // BROAD FILTER: Show records linked to user's pets OR where user is the explicit owner
    const filter = {
      $or: [
        { pet: { $in: petIds } },
        { owner: req.user._id }
      ]
    };

    if (req.query.petId) {
      filter.pet = req.query.petId;
      delete filter.$or; // If specific pet is requested, narrow down
    }

    const records = await PetVaccineRecord.find(filter)
      .populate('pet', 'name species')
      .sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a vaccine record
const deleteVaccineRecord = async (req, res) => {
  try {
    const record = await PetVaccineRecord.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Record not found');
    }
    if (record.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized');
    }
    await PetVaccineRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Record deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllVaccineRecords = async (req, res) => {
  try {
    const records = await PetVaccineRecord.find({})
      .populate('pet', 'name species')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateVaccineRecord = async (req, res) => {
  try {
    const record = await PetVaccineRecord.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Record not found');
    }

    const { status, dateAdministered, nextDueDate, notes, vaccineName } = req.body;

    if (vaccineName !== undefined && vaccineName !== null) {
      record.vaccineName = String(vaccineName).trim();
    }
    if (notes !== undefined) record.notes = notes;

    if (status !== undefined && status !== null && status !== '') {
      record.status = status;
    }

    if (dateAdministered !== undefined && dateAdministered !== null && String(dateAdministered).trim() !== '') {
      record.dateAdministered = dateAdministered;
    } else if (record.status === 'Scheduled') {
      record.dateAdministered = undefined;
    }

    if (nextDueDate !== undefined) {
      record.nextDueDate = nextDueDate || undefined;
    }

    if (req.file) {
      record.documentUrl = await persistMedia(req.file, 'vaccine-documents');
    }

    await record.save();
    const payload = await PetVaccineRecord.findById(record._id)
      .populate('pet', 'name species')
      .populate('owner', 'name email');
    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  addVaccineRecord,
  getMyVaccineRecords,
  deleteVaccineRecord,
  getAllVaccineRecords,
  updateVaccineRecord
};
