const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    getAllRecords
} = require("../controllers/patientRecordController");

router.get("/getAllRecords", auth, getAllRecords);

module.exports = router;
