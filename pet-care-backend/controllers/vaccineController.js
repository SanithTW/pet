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
    if (!pet || pet.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized or pet not found');
    }
    const record = await PetVaccineRecord.create({
      pet: petId,
      owner: req.user._id,
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
    // Find all pets owned by this user
    const myPets = await Pet.find({ owner: req.user._id }).select('_id');
    const petIds = myPets.map(p => p._id);

    const filter = {
      $or: [
        { owner: req.user._id },
        { pet: { $in: petIds } }
      ]
    };
    if (req.query.petId) filter.$or.push({ pet: req.query.petId });
    if (req.query.petId) { filter.$and = [{ pet: req.query.petId }]; delete filter.$or; }

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
    
    if (status) record.status = status;
    if (dateAdministered) record.dateAdministered = dateAdministered;
    if (nextDueDate) record.nextDueDate = nextDueDate;
    if (notes !== undefined) record.notes = notes;
    if (vaccineName) record.vaccineName = vaccineName;

    if (req.file) {
      record.documentUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await record.save();
    res.status(200).json(record);
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
