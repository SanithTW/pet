const BoardingRoom = require('../models/BoardingRoom');
const BoardingBooking = require('../models/BoardingBooking');
const Pet = require('../models/Pet');

// ─── ADMIN: Room Type Management ──────────────────────────────────────────────

const createRoom = async (req, res) => {
  try {
    const { name, dailyRate, amenities, capacity } = req.body;
    if (!name || !dailyRate || !amenities) {
      res.status(400); throw new Error('Name, daily rate, and amenities are required');
    }
    
    const image = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : undefined;

    const room = await BoardingRoom.create({ name, dailyRate, amenities, capacity, image });
    res.status(201).json(room);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await BoardingRoom.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(rooms);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await BoardingRoom.find().sort({ name: 1 });
    res.status(200).json(rooms);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateRoom = async (req, res) => {
  try {
    const room = await BoardingRoom.findById(req.params.id);
    if (!room) { res.status(404); throw new Error('Room not found'); }
    
    const { name, dailyRate, amenities, capacity, isActive } = req.body;
    room.name      = name       ?? room.name;
    room.dailyRate = dailyRate  ?? room.dailyRate;
    room.amenities = amenities  ?? room.amenities;
    room.capacity  = capacity   ?? room.capacity;
    if (isActive !== undefined) room.isActive = isActive;

    if (req.file) {
      room.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await room.save();
    res.status(200).json(room);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await BoardingRoom.findById(req.params.id);
    if (!room) { res.status(404); throw new Error('Room not found'); }
    await BoardingRoom.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Room deleted' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// ─── USER: Boarding Bookings ───────────────────────────────────────────────────

const createBooking = async (req, res) => {
  try {
    const { petId, roomId, checkIn, checkOut, notes } = req.body;
    if (!petId || !roomId || !checkIn || !checkOut) {
      res.status(400); throw new Error('Pet, room, check-in, and check-out are required');
    }
    const pet = await Pet.findById(petId);
    if (!pet || pet.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized or pet not found');
    }
    const room = await BoardingRoom.findById(roomId);
    if (!room) { res.status(404); throw new Error('Room not found'); }

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const totalCost = nights * room.dailyRate;

    const booking = await BoardingBooking.create({
      owner: req.user._id, pet: petId, room: roomId,
      checkIn, checkOut, notes, totalCost
    });
    await booking.populate('room');
    await booking.populate('pet', 'name species');
    res.status(201).json(booking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await BoardingBooking.find({ owner: req.user._id })
      .populate('room')
      .populate('pet', 'name species')
      .sort({ checkIn: -1 });
    res.status(200).json(bookings);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await BoardingBooking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }
    if (booking.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized');
    }
    if (booking.status === 'Checked In' || booking.status === 'Checked Out') {
      res.status(400); throw new Error('Cannot cancel an active or completed stay');
    }
    booking.status = 'Cancelled';
    await booking.save();
    res.status(200).json(booking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await BoardingBooking.find({})
      .populate('room')
      .populate('pet', 'name species')
      .populate('owner', 'name email')
      .sort({ checkIn: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await BoardingBooking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }
    const allowedStatuses = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'Rejected'];
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
  createRoom, getRooms, getAllRooms, updateRoom, deleteRoom,
  createBooking, getMyBookings, cancelBooking, getAllBookings, updateBookingStatus
};
