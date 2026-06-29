const express = require('express');
const router = express.Router();
const medicineDraftController = require('../controllers/medicineDraftController');
const auth = require('../middleware/auth');

router.get('/', auth, medicineDraftController.getDraft);
router.post('/', auth, medicineDraftController.saveDraft);
router.delete('/', auth, medicineDraftController.clearDraft);

module.exports = router;
