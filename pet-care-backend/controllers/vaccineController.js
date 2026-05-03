const { persistMedia } = require('../utils/persistMedia');
const mongoose = require('mongoose');
const PetVaccineRecord = require('../models/PetVaccineRecord');
const Pet = require('../models/Pet');
const Vaccine = require('../models/Vaccine');

// ─── Catalog (admin-managed vaccine types) ───────────────────────────────────

const getCatalogForOwners = async (req, res) => {
  try {
    const list = await Vaccine.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name description sortOrder');
    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCatalogAdmin = async (req, res) => {
  try {
    const list = await Vaccine.find({})
      .sort({ sortOrder: 1, name: 1 })
      .select('name description isActive sortOrder createdAt');
    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createCatalogVaccine = async (req, res) => {
  try {
    const { name, description, isActive, sortOrder } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('Name is required');
    }
    const vaccine = await Vaccine.create({
      name: String(name).trim(),
      description: description != null ? String(description) : '',
      isActive: isActive !== false,
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    });
    res.status(201).json(vaccine);
  } catch (error) {
    const msg =
      error.code === 11000 ? 'A vaccine with this name already exists' : error.message;
    res.status(400).json({ message: msg });
  }
};

const updateCatalogVaccine = async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) {
      res.status(404);
      throw new Error('Vaccine not found');
    }
    const { name, description, isActive, sortOrder } = req.body;
    if (name !== undefined && String(name).trim()) vaccine.name = String(name).trim();
    if (description !== undefined) vaccine.description = String(description);
    if (isActive !== undefined) vaccine.isActive = Boolean(isActive);
    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) vaccine.sortOrder = Number(sortOrder);
    await vaccine.save();
    res.status(200).json(vaccine);
  } catch (error) {
    const msg =
      error.code === 11000 ? 'A vaccine with this name already exists' : error.message;
    res.status(400).json({ message: msg });
  }
};

const deleteCatalogVaccine = async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) {
      res.status(404);
      throw new Error('Vaccine not found');
    }
    const inUse = await PetVaccineRecord.countDocuments({
      catalogVaccine: vaccine._id,
    });
    if (inUse > 0) {
      res.status(400);
      throw new Error(
        'Cannot delete: this vaccine appears in pet histories. Set inactive instead.'
      );
    }
    await Vaccine.findByIdAndDelete(vaccine._id);
    res.status(200).json({ message: 'Removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Owner selects catalog vaccines needed for their pet → history rows (Scheduled).
 */
const confirmOwnerVaccines = async (req, res) => {
  try {
    const { petId, vaccineIds } = req.body;
    if (!petId || !Array.isArray(vaccineIds) || vaccineIds.length === 0) {
      res.status(400);
      throw new Error('petId and a non-empty vaccineIds array are required');
    }
    const petIdSafe = typeof petId === 'string' ? petId.trim() : String(petId);
    if (!mongoose.Types.ObjectId.isValid(petIdSafe)) {
      res.status(400);
      throw new Error('Invalid pet id');
    }

    const pet = await Pet.findById(petIdSafe);
    if (!pet) {
      res.status(404);
      throw new Error('Pet not found');
    }
    if (pet.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized for this pet');
    }

    const uniqueIds = [...new Set(vaccineIds.map(String))];
    const catalog = await Vaccine.find({
      _id: { $in: uniqueIds },
      isActive: true,
    });

    if (catalog.length === 0) {
      res.status(400);
      throw new Error('No valid active vaccines selected');
    }

    const created = [];
    const skipped = [];

    for (const vaccine of catalog) {
      const existing = await PetVaccineRecord.findOne({
        pet: pet._id,
        catalogVaccine: vaccine._id,
        status: 'Scheduled',
      });
      if (existing) {
        skipped.push({ vaccineId: String(vaccine._id), name: vaccine.name, reason: 'already_pending' });
        continue;
      }
      const doc = await PetVaccineRecord.create({
        pet: pet._id,
        owner: pet.owner,
        vaccineName: vaccine.name,
        catalogVaccine: vaccine._id,
        status: 'Scheduled',
      });
      await doc.populate('catalogVaccine', 'name');
      created.push(doc);
    }

    let message = `${created.length} vaccine(s) added to history`;
    if (created.length === 0 && skipped.length) {
      message = 'Those vaccines are already in your history.';
    }

    res.status(201).json({
      message,
      created,
      skipped,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
      .populate('catalogVaccine', 'name description')
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
      .populate('catalogVaccine', 'name description')
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
      .populate('owner', 'name email')
      .populate('catalogVaccine', 'name description');
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
  updateVaccineRecord,
  getCatalogForOwners,
  getCatalogAdmin,
  createCatalogVaccine,
  updateCatalogVaccine,
  deleteCatalogVaccine,
  confirmOwnerVaccines,
};
