const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin, vetOrAdmin } = require('../middleware/authMiddleware');
const {
  addVaccineRecord,
  getMyVaccineRecords,
  deleteVaccineRecord,
  getAllVaccineRecords,
  updateVaccineRecord
} = require('../controllers/vaccineController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Records (User)
router.get('/records', protect, getMyVaccineRecords);
router.post('/records', protect, addVaccineRecord);
router.delete('/records/:id', protect, deleteVaccineRecord);

// Records (Admin/Vet)
router.get('/records/admin/all', protect, admin, getAllVaccineRecords);
router.put('/records/admin/:id', protect, vetOrAdmin, upload.single('document'), updateVaccineRecord);

module.exports = router;
