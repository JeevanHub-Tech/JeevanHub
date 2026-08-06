const express = require("express");
const router = express.Router();
const { settlePayouts } = require("../controllers/cronController");

// No `auth` middleware -- this is hit by an external cron pinger, not a
// logged-in user. Protected by a shared secret header instead (see
// cronController.settlePayouts). Supports both verbs since simple cron
// pingers often only offer GET.
router.get("/settle-payouts", settlePayouts);
router.post("/settle-payouts", settlePayouts);

module.exports = router;
