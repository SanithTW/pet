const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createService, getServices, getAllServices, updateService, deleteService,
  createBooking, getMyBookings, cancelBooking, getAllBookings, updateBookingStatus
} = require('../controllers/groomingController');

// Public/user: browse active services
router.get('/services', protect, getServices);

// Admin: full service management
router.get('/services/all', protect, admin, getAllServices);
router.post('/services', protect, admin, createService);
router.put('/services/:id', protect, admin, updateService);
router.delete('/services/:id', protect, admin, deleteService);

// User: bookings
router.route('/bookings')
  .get(protect, getMyBookings)
  .post(protect, createBooking);

// Admin: booking approvals
router.get('/bookings/all', protect, admin, getAllBookings);
router.put('/bookings/:id/status', protect, admin, updateBookingStatus);

router.put('/bookings/:id/cancel', protect, cancelBooking);

module.exports = router;
