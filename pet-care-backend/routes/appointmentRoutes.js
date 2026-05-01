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
  uploadInvoice
} = require('../controllers/appointmentController');
const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

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

module.exports = router;
