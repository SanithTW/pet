const Appointment = require('../models/Appointment');
const VetSchedule = require('../models/VetSchedule');
const Pet = require('../models/Pet');
const PetVaccineRecord = require('../models/PetVaccineRecord');
const MedicationRecord = require('../models/MedicationRecord');
const FeedingRecord = require('../models/FeedingRecord');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res) => {
  try {
    const { pet, vet, schedule, date, time, reason } = req.body;

    if (!pet || !vet || !schedule || !date || !time || !reason) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Check schedule availability
    const vetSchedule = await VetSchedule.findById(schedule);
    if (!vetSchedule) {
      res.status(404);
      throw new Error('Schedule not found');
    }

    if (vetSchedule.bookedAppointments >= vetSchedule.maxAppointments) {
      res.status(400);
      throw new Error('This schedule is fully booked');
    }

    const appointment = await Appointment.create({
      pet,
      owner: req.user._id,
      vet,
      schedule,
      date,
      time,
      reason,
      status: 'Pending'
    });

    // Increment booked appointments
    vetSchedule.bookedAppointments += 1;
    await vetSchedule.save();

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get current user's appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ owner: req.user._id })
      .populate('pet', 'name type breed')
      .populate('vet', 'name email')
      .populate('schedule', 'date startTime endTime')
      .sort('-createdAt');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all appointments (Admin)
// @route   GET /api/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('pet', 'name type')
      .populate('owner', 'name email')
      .populate('vet', 'name')
      .populate('schedule', 'date startTime endTime')
      .sort('-createdAt');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve or Update Appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin (or Vet)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, vetNotes } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Only update allowed fields
    if (status) appointment.status = status;
    if (vetNotes) appointment.vetNotes = vetNotes;

    // If status is Cancelled or Rejected, we should decrement the bookedAppointments count in schedule
    if ((status === 'Cancelled' || status === 'Rejected') && 
        (appointment.status !== 'Cancelled' && appointment.status !== 'Rejected')) {
       const scheduleToUpdate = await VetSchedule.findById(appointment.schedule);
       if (scheduleToUpdate && scheduleToUpdate.bookedAppointments > 0) {
         scheduleToUpdate.bookedAppointments -= 1;
         await scheduleToUpdate.save();
       }
    }

    const updatedAppointment = await appointment.save();
    res.status(200).json(updatedAppointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (User only)
const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (appointment.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to cancel this appointment');
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Rejected') {
      res.status(400);
      throw new Error('Appointment is already cancelled or rejected');
    }

    // Decrement the bookedAppointments count in schedule
    const scheduleToUpdate = await VetSchedule.findById(appointment.schedule);
    if (scheduleToUpdate && scheduleToUpdate.bookedAppointments > 0) {
      scheduleToUpdate.bookedAppointments -= 1;
      await scheduleToUpdate.save();
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.status(200).json({ message: 'Appointment Cancelled', appointment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (User)
const rescheduleAppointment = async (req, res) => {
  try {
    const { newScheduleId } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) throw new Error('Appointment not found');
    if (appointment.owner.toString() !== req.user._id.toString()) throw new Error('Not authorized');

    const oldSchedule = await VetSchedule.findById(appointment.schedule);
    const newSchedule = await VetSchedule.findById(newScheduleId);

    if (!newSchedule) throw new Error('New schedule not found');
    if (newSchedule.bookedAppointments >= newSchedule.maxAppointments) {
      throw new Error('New schedule is fully booked');
    }

    // Unbook old
    if (oldSchedule && appointment.status !== 'Cancelled' && appointment.status !== 'Rejected') {
       oldSchedule.bookedAppointments -= 1;
       await oldSchedule.save();
    }

    // Book new
    newSchedule.bookedAppointments += 1;
    await newSchedule.save();

    appointment.schedule = newScheduleId;
    appointment.date = newSchedule.date;
    appointment.time = newSchedule.startTime;
    appointment.vet = newSchedule.vet;
    appointment.status = 'Pending'; // needs re-approval
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Upload an invoice for a completed appointment
// @route   PUT /api/appointments/:id/invoice
// @access  Private/Admin
const uploadInvoice = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (req.file) {
      // The frontend can fetch images from the /uploads directory
      appointment.invoiceUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const updatedAppointment = await appointment.save();
      res.status(200).json(updatedAppointment);
    } else {
      res.status(400);
      throw new Error('No image file provided');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add a vaccine record to an appointment
// @route   POST /api/appointments/:id/vaccine
// @access  Private/VetOrAdmin
const addVaccineRecord = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const { vaccineName, dateAdministered, nextDueDate, notes, status } = req.body;
    let documentUrl = null;
    if (req.file) {
      documentUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const record = await PetVaccineRecord.create({
      appointment: appointmentId,
      pet: appointment.pet,
      owner: appointment.owner || req.user._id,
      vaccineName,
      dateAdministered,
      status: status || (dateAdministered ? 'Completed' : 'Scheduled'),
      nextDueDate,
      documentUrl,
      notes
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add a medication record to an appointment
// @route   POST /api/appointments/:id/medication
// @access  Private/VetOrAdmin
const addMedicationRecord = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const { medicationName, dosage, frequency, startDate, endDate, notes } = req.body;
    let prescriptionFileUrl = null;
    if (req.file) {
      prescriptionFileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const record = await MedicationRecord.create({
      appointment: appointmentId,
      pet: appointment.pet,
      owner: appointment.owner || req.user._id,
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
      prescriptionFileUrl,
      notes
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add a diet record to an appointment
// @route   POST /api/appointments/:id/diet
// @access  Private/VetOrAdmin
const addDietRecord = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const { categoryName, schedule, startDate, specialNotes, vetInstructions,
            allergies, avoidFoods, portionSize, feedingFrequency, waterIntake } = req.body;
    let parsedSchedule = [];
    try {
      parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : (schedule || []);
    } catch (e) {
      parsedSchedule = Array.isArray(schedule) ? schedule : [];
    }

    let dietChartUrl = null;
    if (req.file) {
      dietChartUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const record = await FeedingRecord.create({
      appointment: appointmentId,
      pet: appointment.pet,
      owner: appointment.owner || req.user._id,
      categoryName,
      schedule: parsedSchedule,
      startDate,
      dietChartUrl,
      specialNotes, vetInstructions, allergies, avoidFoods, portionSize, feedingFrequency, waterIntake
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};
