const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createRoom, getRooms, getAllRooms, updateRoom, deleteRoom,
  createBooking, getMyBookings, cancelBooking, getAllBookings, updateBookingStatus
} = require('../controllers/boardingController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// User: browse active rooms
router.get('/rooms', protect, getRooms);

// Admin: full room management
router.get('/rooms/all', protect, admin, getAllRooms);
router.post('/rooms', protect, admin, upload.single('image'), createRoom);
router.put('/rooms/:id', protect, admin, upload.single('image'), updateRoom);
router.delete('/rooms/:id', protect, admin, deleteRoom);

// User: bookings
router.route('/bookings')
  .get(protect, getMyBookings)
  .post(protect, createBooking);

// Admin: boarding booking approvals
router.get('/bookings/all', protect, admin, getAllBookings);
router.put('/bookings/:id/status', protect, admin, updateBookingStatus);

router.put('/bookings/:id/cancel', protect, cancelBooking);

module.exports = router;
