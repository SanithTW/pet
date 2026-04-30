const GroomingService = require('../models/GroomingService');
const GroomingBooking = require('../models/GroomingBooking');
const Pet = require('../models/Pet');

// ─── ADMIN: Grooming Service Management ──────────────────────────────────────

const createService = async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;
    if (!name || !price || !duration || !description) {
      res.status(400);
      throw new Error('All fields are required');
    }
    const service = await GroomingService.create({ name, price, duration, description });
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await GroomingService.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await GroomingService.find().sort({ name: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await GroomingService.findById(req.params.id);
    if (!service) { res.status(404); throw new Error('Service not found'); }
    const { name, price, duration, description, isActive } = req.body;
    service.name = name ?? service.name;
    service.price = price ?? service.price;
    service.duration = duration ?? service.duration;
    service.description = description ?? service.description;
    if (isActive !== undefined) service.isActive = isActive;
    await service.save();
    res.status(200).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await GroomingService.findById(req.params.id);
    if (!service) { res.status(404); throw new Error('Service not found'); }
    await GroomingService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── USER: Grooming Bookings ──────────────────────────────────────────────────

const createBooking = async (req, res) => {
  try {
    const { petId, serviceId, date, notes } = req.body;
    if (!petId || !serviceId || !date) {
      res.status(400);
      throw new Error('Pet, service, and date are required');
    }
    const pet = await Pet.findById(petId);
    if (!pet || pet.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized or pet not found');
    }
    const booking = await GroomingBooking.create({
      owner: req.user._id,
      pet: petId,
      service: serviceId,
      date,
      notes
    });
    await booking.populate('service');
    await booking.populate('pet', 'name species');
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.petId) filter.pet = req.query.petId;
    const bookings = await GroomingBooking.find(filter)
      .populate('service')
      .populate('pet', 'name species')
      .sort({ date: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await GroomingBooking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }
    if (booking.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized');
    }
    booking.status = 'Cancelled';
    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await GroomingBooking.find({})
      .populate('service')
      .populate('pet', 'name species')
      .populate('owner', 'name email')
      .sort({ date: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await GroomingBooking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    const allowedStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    booking.status = status;
    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createService, getServices, getAllServices, updateService, deleteService,
  createBooking, getMyBookings, cancelBooking, getAllBookings, updateBookingStatus
};
