const Pet = require('../models/Pet');

const createPet = async (req, res) => {
  try {
    const { name, species, breed, age, weight, gender } = req.body;

    if (!name || !species) {
      res.status(400);
      throw new Error('Pet name and species are required');
    }

    const profileImage = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : undefined;

    const normalizedGender = gender ? (gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) : undefined;

    const pet = await Pet.create({
      owner: req.user._id,
      name,
      species,
      breed,
      gender: ['Male', 'Female'].includes(normalizedGender) ? normalizedGender : undefined,
      age: age ? Number(age) : undefined,
      weight: weight ? Number(weight) : undefined,
      profileImage,
    });

    res.status(201).json(pet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(pets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      res.status(404);
      throw new Error('Pet not found');
    }

    if (pet.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this pet');
    }

    await pet.deleteOne();
    res.status(200).json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createPet,
  getPets,
  deletePet,
};
