// controllers/shippingController.js
//
// Platform-agnostic controller for shipping operations. Uses the adapter
// registry to dispatch to the correct delivery partner service (Delhivery,
// BlueDart, DTDC, etc.) based on the `platform` parameter.

const { getAdapter } = require('../services/shippingAdapterRegistry');
const Order = require('../models/Order');
const Retailer = require('../models/Retailer');
const Medicine = require('../models/Medicine');
const { createNotification } = require('./notificationController');
const { recomputeOrderStatus } = require('../services/shipmentSync');

// Default weight per unit when the retailer hasn't set one on the medicine.
const DEFAULT_UNIT_WEIGHT_GRAMS = 200;
// Packaging overhead added to the total item weight.
const PACKAGING_OVERHEAD_GRAMS = 100;

/**
 * GET /api/shipping/serviceability?platform=delhivery&destPin=560001&retailerId=...
 *
 * Checks if a destination pincode is serviceable by the specified delivery partner.
 * Used during checkout to validate the shipping address.
 */
exports.checkServiceability = async (req, res) => {
    try {
        const { platform = 'delhivery', destPin, retailerId } = req.query;

        if (!destPin) return res.status(400).json({ message: 'destPin is required' });
        if (!retailerId) return res.status(400).json({ message: 'retailerId is required' });

        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(retailerId);

        if (!retailer || !adapter.canPoll(retailer)) {
            return res.status(400).json({ message: `Retailer has no ${platform} credentials configured` });
        }

        const result = await adapter.checkServiceability(retailer, destPin);
        res.status(200).json(result);
    } catch (error) {
        console.error('Serviceability check error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to check serviceability' });
    }
};

/**
 * POST /api/shipping/estimate-freight
 * Body: { platform, retailerId, destPin, items: [{ medicineId, quantity }] }
 *
 * Calculates estimated shipping cost for items from a single retailer.
 * The origin pincode comes from the retailer's warehouse.
 */
exports.estimateFreight = async (req, res) => {
    try {
        const { platform = 'delhivery', retailerId, destPin, items } = req.body;

        if (!destPin || !retailerId || !items?.length) {
            return res.status(400).json({ message: 'retailerId, destPin, and items are required' });
        }

        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(retailerId);

        if (!retailer || !adapter.canPoll(retailer)) {
            return res.status(400).json({ message: `Retailer has no ${platform} credentials configured` });
        }

        const originPin = retailer.warehouse?.pincode || retailer.zipCode;
        if (!originPin) {
            return res.status(400).json({ message: 'Retailer has no warehouse pincode configured' });
        }

        // Calculate total weight and price from medicine data
        const medicineIds = items.map(i => i.medicineId);
        const medicines = await Medicine.find({ _id: { $in: medicineIds } });
        let totalWeightGrams = 0;
        let totalPrice = 0;
        for (const item of items) {
            const med = medicines.find(m => m._id.toString() === item.medicineId);
            const unitWeight = med?.weightGrams || DEFAULT_UNIT_WEIGHT_GRAMS;
            totalWeightGrams += unitWeight * (item.quantity || 1);
            totalPrice += (med?.price || 0) * (item.quantity || 1);
        }
        totalWeightGrams += PACKAGING_OVERHEAD_GRAMS;

        const paymentMode = req.body.paymentMethod === 'cashOnDelivery' ? 'COD' : 'Pre-paid';
        const codAmount = paymentMode === 'COD' ? totalPrice : 0;

        const result = await adapter.calculateFreight(retailer, originPin, destPin, totalWeightGrams, 'S', paymentMode, codAmount);

        res.status(200).json({
            ...result,
            weightGrams: totalWeightGrams,
            originPin,
            destPin
        });
    } catch (error) {
        console.error('Freight estimation error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to estimate freight' });
    }
};

/**
 * POST /api/shipping/orders/:orderId/create-shipment
 * Body: { platform }
 *
 * Auto-creates a shipment with the delivery partner, generates an AWB,
 * and marks the order as shipped.
 */
exports.createShipment = async (req, res) => {
    try {
        if (req.user.role !== 'retailer') {
            return res.status(403).json({ message: 'Only retailers can create shipments' });
        }

        const { orderId } = req.params;
        const { platform = 'delhivery' } = req.body;

        const order = await Order.findById(orderId).populate('items.medicineId');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!['accepted', 'processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: `Cannot ship an order with status '${order.orderStatus}'.`
            });
        }

        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(req.user._id);

        if (!retailer || !adapter.canPoll(retailer)) {
            return res.status(400).json({
                message: 'Delivery partner credentials are not configured. Please set up your integration first.'
            });
        }

        if (!retailer.warehouse?.isConfigured || !retailer.warehouse?.name) {
            return res.status(400).json({
                message: 'Warehouse / pickup location is not configured. Please set up your warehouse details first.'
            });
        }

        // Find items belonging to this retailer
        const retailerItems = order.items.filter(
            item => item.medicineId?.retailerId?.toString() === req.user._id.toString()
        );

        if (retailerItems.length === 0) {
            return res.status(400).json({ message: 'No items in this order belong to you.' });
        }

        // Calculate total weight
        let totalWeightGrams = 0;
        for (const item of retailerItems) {
            totalWeightGrams += (item.medicineId?.weightGrams || DEFAULT_UNIT_WEIGHT_GRAMS) * item.quantity;
        }
        totalWeightGrams += PACKAGING_OVERHEAD_GRAMS;

        const productsDesc = retailerItems
            .map(i => i.medicineId?.name)
            .filter(Boolean)
            .join(', ')
            .slice(0, 200);

        // Get buyer phone
        const BuyerModel = require(`../models/${order.buyer.type}`);
        const buyer = await BuyerModel.findById(order.buyer.buyerId);

        const shipmentResult = await adapter.createShipment(retailer, order, {
            weightGrams: totalWeightGrams,
            productsDesc: productsDesc || 'Ayurvedic Medicines',
            consigneePhone: buyer?.phone || '',
            itemCount: retailerItems.length,
            warehouseName: retailer.warehouse.name,
            warehouseAddress: retailer.warehouse.address || '',
            warehouseCity: retailer.warehouse.city || '',
            warehousePincode: retailer.warehouse.pincode || '',
            warehousePhone: retailer.warehouse.phone || retailer.phone || ''
        });

        // Update or push the shipment entry
        const existingIdx = (order.shipments || []).findIndex(
            s => s.retailerId?.toString() === req.user._id.toString()
        );
        const shipmentEntry = {
            platform,
            trackingId: shipmentResult.awb,
            retailerId: req.user._id,
            shippedAt: new Date(),
            creationMethod: 'auto',
            packageWeightGrams: totalWeightGrams,
            lastPolledStatus: 'Manifested',
            lastPolledStatusCode: 'M',
            lastPolledAt: new Date(),
            trackingTimeline: [{
                status: 'Manifested',
                statusCode: 'M',
                location: retailer.warehouse.city || 'Origin',
                timestamp: new Date(),
                remarks: 'Shipment created via JeevanHub'
            }]
        };

        if (existingIdx >= 0) {
            order.shipments[existingIdx] = { ...order.shipments[existingIdx], ...shipmentEntry };
        } else {
            if (!order.shipments) order.shipments = [];
            order.shipments.push(shipmentEntry);
        }

        // Update item statuses
        retailerItems.forEach(item => { item.itemStatus = 'shipped'; });
        recomputeOrderStatus(order);

        await order.save();

        // Notify patient
        try {
            await createNotification(
                order.buyer.buyerId,
                order.buyer.type.toLowerCase(),
                order._id,
                `Your order #${order._id.toString().slice(-6)} has been shipped! AWB: ${shipmentResult.awb}`,
                'order'
            );
        } catch (notifyError) {
            console.error('Shipment notification failed:', notifyError.message);
        }

        res.status(200).json({
            message: 'Shipment created successfully',
            awb: shipmentResult.awb,
            order: {
                _id: order._id,
                orderStatus: order.orderStatus,
                shipments: order.shipments
            }
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        res.status(500).json({ message: error.message || 'Failed to create shipment' });
    }
};

/**
 * GET /api/shipping/orders/:orderId/label?retailerId=...
 *
 * Downloads the shipping label PDF for a shipment.
 */
exports.getShippingLabel = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { retailerId } = req.query;
        const shipment = retailerId
            ? order.shipments?.find(s => s.retailerId?.toString() === retailerId)
            : order.shipments?.[0];

        if (!shipment?.trackingId) {
            return res.status(400).json({ message: 'No shipment found for this retailer' });
        }

        const platform = shipment.platform || 'delhivery';
        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(shipment.retailerId);

        const pdfBuffer = await adapter.getShippingLabel(retailer, shipment.trackingId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="label-${shipment.trackingId}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Label download error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to download label' });
    }
};

/**
 * POST /api/shipping/orders/:orderId/request-pickup
 * Body: { retailerId, pickupDate, pickupTime }
 */
exports.requestPickup = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { retailerId, pickupDate, pickupTime } = req.body;
        if (!pickupDate) return res.status(400).json({ message: 'pickupDate is required (YYYY-MM-DD)' });

        const shipment = retailerId
            ? order.shipments?.find(s => s.retailerId?.toString() === retailerId)
            : order.shipments?.[0];

        if (!shipment?.trackingId) {
            return res.status(400).json({ message: 'No shipment found for this retailer' });
        }

        const platform = shipment.platform || 'delhivery';
        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(shipment.retailerId);

        const result = await adapter.requestPickup(
            retailer,
            retailer.warehouse?.name,
            pickupDate,
            pickupTime || '14:00:00',
            1
        );

        shipment.pickupId = result.pickupId;
        shipment.pickupDate = new Date(pickupDate);
        await order.save();

        res.status(200).json(result);
    } catch (error) {
        console.error('Pickup request error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to request pickup' });
    }
};

/**
 * POST /api/shipping/orders/:orderId/cancel-shipment
 * Body: { retailerId }
 */
exports.cancelShipment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { retailerId } = req.body;
        const shipment = retailerId
            ? order.shipments?.find(s => s.retailerId?.toString() === retailerId)
            : order.shipments?.[0];

        if (!shipment?.trackingId) {
            return res.status(400).json({ message: 'No shipment found for this retailer' });
        }

        // Can only cancel before delivery
        if (['delivered', 'cancelled'].includes(order.orderStatus)) {
            return res.status(400).json({ message: 'Cannot cancel a delivered/cancelled order' });
        }

        const platform = shipment.platform || 'delhivery';
        const adapter = getAdapter(platform);
        const retailer = await adapter.findRetailerWithCredentials(shipment.retailerId);

        const result = await adapter.cancelShipment(retailer, shipment.trackingId);

        if (result.success) {
            shipment.trackingTimeline.unshift({
                status: 'Cancelled',
                statusCode: 'CN',
                location: 'System',
                timestamp: new Date(),
                remarks: 'Shipment cancelled by retailer'
            });
            shipment.lastPolledStatus = 'Cancelled';
            shipment.lastPolledStatusCode = 'CN';

            // Revert items belonging to this retailer to accepted
            const retailerItems = order.items.filter(
                item => item.medicineId?.toString() === retailerId ||
                    (typeof item.medicineId === 'object' && item.medicineId?.retailerId?.toString() === shipment.retailerId?.toString())
            );
            retailerItems.forEach(item => { item.itemStatus = 'accepted'; });
            recomputeOrderStatus(order);

            await order.save();
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Cancel shipment error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to cancel shipment' });
    }
};
