const MedicationRecord = require('../models/MedicationRecord');
const Pet = require('../models/Pet');

const createRecord = async (req, res) => {
    try {
        const { petId, medicationName, dosage, frequency, startDate, endDate, notes } = req.body;
        if (!petId || !medicationName || !dosage || !frequency || !startDate) {
            res.status(400); throw new Error('Pet, medication name, dosage, frequency, and start date are required');
        }
        const pet = await Pet.findById(petId);
        if (!pet || pet.owner.toString() !== req.user._id.toString()) {
            res.status(401); throw new Error('Not authorized or pet not found');
        }
        const record = await MedicationRecord.create({
            owner: req.user._id, pet: petId, medicationName,
            dosage, frequency, startDate, endDate, notes
        });
        await record.populate('pet', 'name species');
        res.status(201).json(record);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const getMyRecords = async (req, res) => {
    try {
        const myPets = await Pet.find({ owner: req.user._id }).select('_id');
        const petIds = myPets.map(p => p._id);

        let filter;
        if (req.query.petId) {
            filter = { pet: req.query.petId };
        } else {
            filter = { $or: [{ owner: req.user._id }, { pet: { $in: petIds } }] };
        }

        const records = await MedicationRecord.find(filter)
            .populate('pet', 'name species')
            .sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const updateRecord = async (req, res) => {
    try {
        const record = await MedicationRecord.findById(req.params.id);
        if (!record) { res.status(404); throw new Error('Record not found'); }
        if (record.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401); throw new Error('Not authorized');
        }
        const { dosage, frequency, endDate, notes, status, medicationName } = req.body;
        if (dosage) record.dosage = dosage;
        if (frequency) record.frequency = frequency;
        if (endDate) record.endDate = endDate;
        if (notes !== undefined) record.notes = notes;
        if (status) record.status = status;
        if (medicationName) record.medicationName = medicationName;
        await record.save();
        res.status(200).json(record);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const deleteRecord = async (req, res) => {
    try {
        const record = await MedicationRecord.findById(req.params.id);
        if (!record) { res.status(404); throw new Error('Record not found'); }
        if (record.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401); throw new Error('Not authorized');
        }
        await MedicationRecord.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Record deleted' });
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const getAllRecordsAdmin = async (req, res) => {
    try {
        const records = await MedicationRecord.find({})
            .populate('pet', 'name species')
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const updateRecordAdmin = async (req, res) => {
    try {
        const record = await MedicationRecord.findById(req.params.id);
        if (!record) { res.status(404); throw new Error('Record not found'); }
        
        const { dosage, frequency, endDate, notes, status, startDate, medicationName } = req.body;
        if (dosage) record.dosage = dosage;
        if (frequency) record.frequency = frequency;
        if (startDate) record.startDate = startDate;
        if (endDate) record.endDate = endDate;
        if (notes !== undefined) record.notes = notes;
        if (status) record.status = status;
        if (medicationName) record.medicationName = medicationName;

        if (req.file) {
            record.prescriptionFileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        await record.save();
        res.status(200).json(record);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

module.exports = {
    createRecord, getMyRecords, updateRecord, deleteRecord, getAllRecordsAdmin, updateRecordAdmin
};
