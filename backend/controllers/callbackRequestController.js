const CallbackRequest = require('../models/CallbackRequest');

exports.createCallbackRequest = async (req, res) => {
    try {
        const { name, phone, message } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone number are required.' });
        }
        const callbackRequest = await CallbackRequest.create({ name, phone, message });
        res.status(201).json({ message: 'Callback request received.', callbackRequest });
    } catch (error) {
        console.error('Error creating callback request:', error);
        res.status(500).json({ message: 'Failed to submit callback request.' });
    }
};

exports.getAllCallbackRequests = async (req, res) => {
    try {
        const callbackRequests = await CallbackRequest.find({}).sort({ createdAt: -1 });
        res.status(200).json(callbackRequests);
    } catch (error) {
        console.error('Error fetching callback requests:', error);
        res.status(500).json({ message: 'Failed to fetch callback requests.' });
    }
};
