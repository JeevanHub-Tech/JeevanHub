const MedicineDraft = require('../models/MedicineDraft');

exports.getDraft = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'retailer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    let draft = await MedicineDraft.findOne({ retailerId: req.user._id });
    if (!draft) {
      draft = new MedicineDraft({ retailerId: req.user._id, present: [] });
      await draft.save();
    }
    
    res.status(200).json(draft);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch draft', error: error.message });
  }
};

exports.saveDraft = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'retailer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { present } = req.body;
    
    // Upsert the draft
    const draft = await MedicineDraft.findOneAndUpdate(
      { retailerId: req.user._id },
      { $set: { present } },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ message: 'Draft saved successfully', draft });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save draft', error: error.message });
  }
};

exports.clearDraft = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'retailer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await MedicineDraft.findOneAndDelete({ retailerId: req.user._id });
    res.status(200).json({ message: 'Draft cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear draft', error: error.message });
  }
};
