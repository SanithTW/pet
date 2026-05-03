const User = require('../models/User');
const VetSchedule = require('../models/VetSchedule');
const Appointment = require('../models/Appointment');

// @desc    Add a vet user
// @route   POST /api/vets
// @access  Private/Admin
const addVet = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      res.status(400);
      throw new Error('Please provide name, email, and phone');
    }

    if (!email.includes('@')) {
      res.status(400);
      throw new Error('Invalid email format (must contain @)');
    }

    if (!/^\d{10}$/.test(phone)) {
      res.status(400);
      throw new Error('Phone number must be exactly 10 digits');
    }
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const vet = await User.create({
      name,
      email,
      phone,
      role: 'vet'
    });

    res.status(201).json({
      _id: vet._id,
      name: vet.name,
      email: vet.email,
      phone: vet.phone,
      role: vet.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all vets
// @route   GET /api/vets
// @access  Public or Private
const getVets = async (req, res) => {
  try {
    const vets = await User.find({ role: 'vet' }).select('-password');
    res.status(200).json(vets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a vet profile
// @route   PUT /api/vets/:id
// @access  Private/Admin
const updateVet = async (req, res) => {
  try {
    const vet = await User.findById(req.params.id);
    if (!vet || vet.role !== 'vet') {
      res.status(404);
      throw new Error('Vet not found');
    }

    const { name, email, phone } = req.body;
    if (name !== undefined && name !== null) vet.name = String(name).trim();
    if (email !== undefined && email !== null) {
      const nextEmail = String(email).trim();
      if (!nextEmail.includes('@')) {
        res.status(400);
        throw new Error('Invalid email format (must contain @)');
      }
      if (nextEmail !== vet.email) {
        const taken = await User.findOne({ email: nextEmail });
        if (taken) {
          res.status(400);
          throw new Error('Email already in use');
        }
      }
      vet.email = nextEmail;
    }
    if (phone !== undefined && phone !== null) {
      const p = String(phone).trim();
      if (!/^\d{10}$/.test(p)) {
        res.status(400);
        throw new Error('Phone number must be exactly 10 digits');
      }
      vet.phone = p;
    }

    if (!vet.name || !vet.email || !vet.phone) {
      res.status(400);
      throw new Error('Name, email, and phone are required');
    }

    await vet.save();
    res.status(200).json({
      _id: vet._id,
      name: vet.name,
      email: vet.email,
      phone: vet.phone,
      role: vet.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove a vet (clears links on appointments; removes schedules)
// @route   DELETE /api/vets/:id
// @access  Private/Admin
const deleteVet = async (req, res) => {
  try {
    const vet = await User.findById(req.params.id);
    if (!vet || vet.role !== 'vet') {
      res.status(404);
      throw new Error('Vet not found');
    }

    await VetSchedule.deleteMany({ vet: vet._id });
    await Appointment.updateMany({ vet: vet._id }, { $unset: { vet: 1, schedule: 1 } });
    await User.deleteOne({ _id: vet._id, role: 'vet' });

    res.status(200).json({ message: 'Vet removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create Vet Schedule
// @route   POST /api/vets/:id/schedule
// @access  Private/Admin
const setVetSchedule = async (req, res) => {
  try {
    const { date, startTime, endTime, maxAppointments } = req.body;
    const vetId = req.params.id;

    // Check if a schedule for this vet and date already exists
    let schedule = await VetSchedule.findOne({ vet: vetId, date });
    
    if (schedule) {
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      schedule.maxAppointments = maxAppointments;
      await schedule.save();
    } else {
      schedule = await VetSchedule.create({
        vet: vetId,
        date,
        startTime,
        endTime,
        maxAppointments
      });
    }

    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get Vet Schedules for a specific vet
// @route   GET /api/vets/:id/schedule
// @access  Public
const getVetSchedules = async (req, res) => {
  try {
    const vetId = req.params.id;
    const schedules = await VetSchedule.find({ vet: vetId }).sort('date');
    res.status(200).json(schedules);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get All Vet Schedules (for admin viewing)
// @route   GET /api/vets/schedules/all
// @access  Private/Admin
const getAllSchedules = async (req, res) => {
  try {
    const schedules = await VetSchedule.find().populate('vet', 'name email').sort('date');
    res.status(200).json(schedules);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// @desc    Update Vet Schedule
// @route   PUT /api/vets/:id/schedule/:scheduleId
// @access  Private/Admin
const updateVetSchedule = async (req, res) => {
  try {
    const { date, startTime, endTime, maxAppointments } = req.body;
    const scheduleId = req.params.scheduleId;
    
    let schedule = await VetSchedule.findById(scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error('Schedule not found');
    }
    
    // Check if new date conflicts with another schedule
    if (date && date !== schedule.date) {
      const existing = await VetSchedule.findOne({ vet: req.params.id, date });
      if (existing) {
         res.status(400);
         throw new Error('A schedule already exists for this date');
      }
    }

    schedule.date = date || schedule.date;
    schedule.startTime = startTime || schedule.startTime;
    schedule.endTime = endTime || schedule.endTime;
    if (maxAppointments) schedule.maxAppointments = maxAppointments;

    await schedule.save();
    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete Vet Schedule
// @route   DELETE /api/vets/:id/schedule/:scheduleId
// @access  Private/Admin
const deleteVetSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const schedule = await VetSchedule.findById(scheduleId);
    if (!schedule) {
       res.status(404);
       throw new Error('Schedule not found');
    }

    if (schedule.bookedAppointments > 0) {
       res.status(400);
       throw new Error('Cannot delete a schedule that has active appointments');
    }

    await VetSchedule.findByIdAndDelete(scheduleId);
    res.status(200).json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  addVet,
  getVets,
  updateVet,
  deleteVet,
  setVetSchedule,
  getVetSchedules,
  getAllSchedules,
  updateVetSchedule,
  deleteVetSchedule
};
