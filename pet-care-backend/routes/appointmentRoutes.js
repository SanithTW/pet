const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  uploadInvoice,
  addVaccineRecord,
  addMedicationRecord,
  addDietRecord
} = require('../controllers/appointmentController');
const { protect, admin, vetOrAdmin } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .post(protect, bookAppointment)
  .get(protect, admin, getAllAppointments);

router.get('/my', protect, getMyAppointments);

router.route('/:id/status')
  .put(protect, admin, updateAppointmentStatus);

router.put('/:id/invoice', protect, admin, upload.single('invoice'), uploadInvoice);

router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);

// Clinical Records (Vet/Admin)
router.post('/:id/vaccine', protect, vetOrAdmin, upload.single('document'), addVaccineRecord);
router.post('/:id/medication', protect, vetOrAdmin, upload.single('prescription'), addMedicationRecord);
router.post('/:id/diet', protect, vetOrAdmin, upload.single('dietChart'), addDietRecord);

module.exports = router;
