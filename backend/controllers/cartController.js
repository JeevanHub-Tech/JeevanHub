const Cart = require("../models/Cart");
const Medicine = require("../models/Medicine");

const CART_ITEM_POPULATE = {
    path: 'items.medicineId',
    select: 'name price image images retailerId prescription',
    populate: {
        path: 'retailerId',
        select: 'BusinessName firstName lastName'
    }
};

const recalcTotal = (cart) => {
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Fetches both the patient's own default cart and every per-doctor cart created
// by a doctor's prescriptions, kept as separate documents (never merged).
exports.getCartByPatientID = async (req, res) => {
    const { patientId } = req.params;
    const defaultOnly = req.query.scope === 'default';

    try {
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }
        if (req.user._id.toString() !== patientId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const defaultCartQuery = Cart.findOne({ patientId, doctorId: null })
            .populate(CART_ITEM_POPULATE)
            .lean();

        const [defaultCart, doctorCarts] = await Promise.all([
            defaultCartQuery,
            defaultOnly
                ? Promise.resolve([])
                : Cart.find({ patientId, doctorId: { $ne: null } })
                    .sort({ updatedAt: -1 })
                    .populate(CART_ITEM_POPULATE)
                    .populate({ path: 'doctorId', select: 'firstName lastName' })
                    .lean()
        ]);

        return res.status(200).json({
            defaultCart: defaultCart || { items: [], totalPrice: 0 },
            doctorCarts
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- Patient's own default cart (doctorId: null) ---

exports.updateCartItemQuantity = async (req, res) => {
    const { patientId, medicineId, action } = req.body;

    try {
        if (!patientId || !medicineId || !action) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (req.user._id.toString() !== patientId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const cart = await Cart.findOne({ patientId, doctorId: null });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.medicineId.toString() === medicineId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        let currentItem = cart.items[itemIndex];
        let newQuantity = currentItem.quantity;

        if (action === "increment") {
            newQuantity += 1;
        } else if (action === "decrement") {
            newQuantity -= 1;
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        if (newQuantity < 1) {
            return res.status(400).json({ message: "Quantity cannot be less than 1" });
        }

        const medicineInStock = await Medicine.findById(medicineId);
        if (!medicineInStock) {
            return res.status(404).json({ message: "Medicine details not found" });
        }

        if (newQuantity > medicineInStock.quantity) {
            return res.status(400).json({
                message: `Only ${medicineInStock.quantity} units available in stock`
            });
        }

        cart.items[itemIndex].quantity = newQuantity;
        recalcTotal(cart);
        cart.updatedAt = Date.now();

        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE);

        return res.status(200).json({
            message: "Cart updated successfully",
            cartItems: populatedCart
        });

    } catch (error) {
        console.error("Update Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    const { patientId, medicineId } = req.body;

    try {
        if (!patientId || !medicineId) {
            return res.status(400).json({ message: "Patient ID and Medicine ID are required" });
        }
        if (req.user._id.toString() !== patientId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const cart = await Cart.findOne({ patientId, doctorId: null });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemExists = cart.items.some(item => item.medicineId.toString() === medicineId);
        if (!itemExists) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        cart.items = cart.items.filter(item => item.medicineId.toString() !== medicineId);
        recalcTotal(cart);
        cart.updatedAt = Date.now();

        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE);

        return res.status(200).json({
            message: "Item removed successfully",
            cartItems: populatedCart
        });

    } catch (error) {
        console.error("Remove Item Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.addToCart = async (req, res) => {
    const { patientId, medicineId, quantity } = req.body;

    try {
        if (!patientId || !medicineId || !quantity) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (req.user._id.toString() !== patientId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        if (quantity > medicine.quantity) {
            return res.status(400).json({ message: `Only ${medicine.quantity} units available in stock` });
        }

        let cart = await Cart.findOne({ patientId, doctorId: null });

        if (!cart) {
            cart = new Cart({
                patientId,
                doctorId: null,
                items: [{ medicineId, quantity, price: medicine.price }],
                totalPrice: 0
            });
        } else {
            const itemIndex = cart.items.findIndex(p => p.medicineId.toString() === medicineId);

            if (itemIndex > -1) {
                if (cart.items[itemIndex].quantity + quantity > medicine.quantity) {
                    return res.status(400).json({ message: `Cannot add. Only ${medicine.quantity} units available in stock` });
                }
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ medicineId, quantity, price: medicine.price });
            }
        }

        recalcTotal(cart);
        cart.updatedAt = Date.now();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE);

        return res.status(200).json({
            message: "Added to cart",
            cartItems: populatedCart
        });

    } catch (error) {
        console.error("Add to Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- Doctor-created carts (RUD only — items only ever enter via a prescription) ---

exports.updateDoctorCartItemQuantity = async (req, res) => {
    const { doctorId } = req.params;
    const { medicineId, action } = req.body;
    const patientId = req.user._id;

    try {
        if (!medicineId || !action) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const cart = await Cart.findOne({ patientId, doctorId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.medicineId.toString() === medicineId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        let newQuantity = cart.items[itemIndex].quantity;
        if (action === "increment") newQuantity += 1;
        else if (action === "decrement") newQuantity -= 1;
        else return res.status(400).json({ message: "Invalid action" });

        if (newQuantity < 1) {
            return res.status(400).json({ message: "Quantity cannot be less than 1" });
        }

        const medicineInStock = await Medicine.findById(medicineId);
        if (!medicineInStock) {
            return res.status(404).json({ message: "Medicine details not found" });
        }
        if (newQuantity > medicineInStock.quantity) {
            return res.status(400).json({ message: `Only ${medicineInStock.quantity} units available in stock` });
        }

        cart.items[itemIndex].quantity = newQuantity;
        recalcTotal(cart);
        cart.updatedAt = Date.now();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE);
        return res.status(200).json({ message: "Cart updated successfully", cartItems: populatedCart });
    } catch (error) {
        console.error("Update Doctor Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.removeFromDoctorCart = async (req, res) => {
    const { doctorId } = req.params;
    const { medicineId } = req.body;
    const patientId = req.user._id;

    try {
        if (!medicineId) {
            return res.status(400).json({ message: "Medicine ID is required" });
        }

        const cart = await Cart.findOne({ patientId, doctorId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemExists = cart.items.some(item => item.medicineId.toString() === medicineId);
        if (!itemExists) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        cart.items = cart.items.filter(item => item.medicineId.toString() !== medicineId);

        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ message: "Item removed; cart is now empty and was deleted", cartItems: null });
        }

        recalcTotal(cart);
        cart.updatedAt = Date.now();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate(CART_ITEM_POPULATE);
        return res.status(200).json({ message: "Item removed successfully", cartItems: populatedCart });
    } catch (error) {
        console.error("Remove From Doctor Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.deleteDoctorCart = async (req, res) => {
    const { doctorId } = req.params;
    const patientId = req.user._id;

    try {
        const result = await Cart.deleteOne({ patientId, doctorId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Cart not found" });
        }
        return res.status(200).json({ message: "Cart deleted successfully" });
    } catch (error) {
        console.error("Delete Doctor Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Merges a doctor-cart's items into the patient's default cart (combining
// quantities for medicines already there), then clears the doctor-cart.
exports.moveDoctorCartToDefault = async (req, res) => {
    const { doctorId } = req.params;
    const patientId = req.user._id;

    try {
        const doctorCart = await Cart.findOne({ patientId, doctorId });
        if (!doctorCart || doctorCart.items.length === 0) {
            return res.status(404).json({ message: "Cart not found or already empty" });
        }

        let defaultCart = await Cart.findOne({ patientId, doctorId: null });
        if (!defaultCart) {
            defaultCart = new Cart({ patientId, doctorId: null, items: [], totalPrice: 0 });
        }

        for (const item of doctorCart.items) {
            const existingIndex = defaultCart.items.findIndex(
                i => i.medicineId.toString() === item.medicineId.toString()
            );
            if (existingIndex > -1) {
                defaultCart.items[existingIndex].quantity += item.quantity;
            } else {
                defaultCart.items.push({ medicineId: item.medicineId, quantity: item.quantity, price: item.price });
            }
        }

        recalcTotal(defaultCart);
        defaultCart.updatedAt = Date.now();
        await defaultCart.save();

        await Cart.deleteOne({ _id: doctorCart._id });

        const populatedCart = await Cart.findById(defaultCart._id).populate(CART_ITEM_POPULATE);
        return res.status(200).json({ message: "Items moved to your cart", cartItems: populatedCart });
    } catch (error) {
        console.error("Move Doctor Cart Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};
