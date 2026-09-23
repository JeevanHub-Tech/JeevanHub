const { registerAdapter } = require('./shippingAdapterRegistry');
const delhiveryService = require('./delhiveryService');

function initShippingAdapters() {
    registerAdapter('delhivery', delhiveryService);
    console.log('📦 Shipping adapters initialized');
}

module.exports = { initShippingAdapters };
