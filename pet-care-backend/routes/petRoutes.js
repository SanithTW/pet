const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { createPet, getPets, deletePet } = require('../controllers/petController');

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

const router = express.Router();

router.route('/')
  .get(protect, getPets)
  .post(protect, upload.single('profileImage'), createPet);

router.delete('/:id', protect, deletePet);

module.exports = router;
