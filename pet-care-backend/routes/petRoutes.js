const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { createPet, getPets, deletePet } = require('../controllers/petController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.route('/')
  .get(protect, getPets)
  .post(protect, upload.single('profileImage'), createPet);

router.delete('/:id', protect, deletePet);

module.exports = router;
