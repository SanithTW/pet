const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin, vetOrAdmin } = require('../middleware/authMiddleware');
const {
    createRecord, getMyRecords, updateRecord, deleteRecord, getAllRecordsAdmin, updateRecordAdmin
} = require('../controllers/medicationController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// User: prescription records
router.route('/records')
    .get(protect, getMyRecords)
    .post(protect, createRecord);

router.route('/records/:id')
    .put(protect, updateRecord)
    .delete(protect, deleteRecord);

// Admin/Vet record management
router.get('/records/admin/all', protect, admin, getAllRecordsAdmin);
router.put('/records/admin/:id', protect, vetOrAdmin, upload.single('prescription'), updateRecordAdmin);

module.exports = router;
