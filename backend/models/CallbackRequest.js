const mongoose = require('mongoose');

const callbackRequestSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'contacted'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CallbackRequest', callbackRequestSchema);
