const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
	getCartByPatientID,
	updateCartItemQuantity,
	removeFromCart,
	addToCart,
	updateDoctorCartItemQuantity,
	removeFromDoctorCart,
	deleteDoctorCart,
	moveDoctorCartToDefault
} = require('../controllers/cartController');

// --- Patient's own default cart ---

// Route to update cart item quantity
router.put('/update-quantity', auth, updateCartItemQuantity);

// Route to remove item
router.delete("/remove", auth, removeFromCart);

// Route to add item to cart
router.post("/add", auth, addToCart);

// --- Doctor-created carts (RUD only — no add-item route; items only enter via a prescription) ---

router.put('/doctor/:doctorId/update-quantity', auth, updateDoctorCartItemQuantity);
router.delete('/doctor/:doctorId/remove-item', auth, removeFromDoctorCart);
router.post('/doctor/:doctorId/move-to-default', auth, moveDoctorCartToDefault);
router.delete('/doctor/:doctorId', auth, deleteDoctorCart);

// Route to get cart items by patient ID (must be last — otherwise it'd shadow the routes above)
router.get('/:patientId', auth, getCartByPatientID);

module.exports = router;