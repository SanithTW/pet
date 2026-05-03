const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin, vetOrAdmin } = require('../middleware/authMiddleware');
const {
  addVaccineRecord,
  getMyVaccineRecords,
  deleteVaccineRecord,
  getAllVaccineRecords,
  updateVaccineRecord,
  getCatalogForOwners,
  getCatalogAdmin,
  createCatalogVaccine,
  updateCatalogVaccine,
  deleteCatalogVaccine,
  confirmOwnerVaccines,
} = require('../controllers/vaccineController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

/** Only parse multipart when the client sends multipart (RN FormData works). Skip for JSON edits so req.body stays populated via express.json(). */
function vaccineAdminMaybeUpload(req, res, next) {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('multipart/form-data')) {
    return upload.single('document')(req, res, (err) => (err ? next(err) : next()));
  }
  return next();
}

// Catalog (offerings)
router.get('/catalog', protect, getCatalogForOwners);
router.get('/catalog/admin', protect, admin, getCatalogAdmin);
router.post('/catalog/admin', protect, admin, createCatalogVaccine);
router.put('/catalog/admin/:id', protect, admin, updateCatalogVaccine);
router.delete('/catalog/admin/:id', protect, admin, deleteCatalogVaccine);

// Records (User)
router.get('/records', protect, getMyVaccineRecords);
router.post('/records/confirm', protect, confirmOwnerVaccines);
router.post('/records', protect, addVaccineRecord);
router.delete('/records/:id', protect, deleteVaccineRecord);

// Records (Admin/Vet)
router.get('/records/admin/all', protect, admin, getAllVaccineRecords);
router.put('/records/admin/:id', protect, vetOrAdmin, vaccineAdminMaybeUpload, updateVaccineRecord);

module.exports = router;
