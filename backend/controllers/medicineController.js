const Medicine = require('../models/Medicine');

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const AdmZip = require('adm-zip');

// Add Medicines from Zip File (Excel + Images)
exports.addMedicinesFromZip = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Access denied. Only retailers can add medicines.' });
  }
  const retailerId = req.user._id; // Get retailer ID from authenticated user
  const zipFilePath = req.file.path;

  try {
    // Unzip the file
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // Find the Excel file in the zip
    const excelEntry = zipEntries.find(entry => entry.entryName.endsWith('.xlsx') || entry.entryName.endsWith('.xls'));
    if (!excelEntry) {
      return res.status(400).json({ message: 'Excel file not found in zip' });
    }

    // Parse the Excel file
    const workbook = xlsx.read(zip.readFile(excelEntry), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Ensure the uploads directory exists
    const uploadDir = path.join('uploads', 'medicines');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process each entry in the Excel file
    const medicines = [];
    for (const item of data) {
      const imageFileName = item.imageFileName;
      const imageEntry = zipEntries.find(entry => entry.entryName === imageFileName);

      let imagePath = null;
      if (imageEntry) {
        imagePath = path.resolve(uploadDir, imageFileName);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!imagePath.startsWith(resolvedUploadDir + path.sep)) {
          return res.status(400).json({ message: 'Invalid file path in zip' });
        }
        fs.writeFileSync(imagePath, zip.readFile(imageEntry));
      }

      // Create a medicine entry according to the schema
      medicines.push({
        name: item.name, 
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        prescription: item.prescription === 'yes' || item.prescription === true,
        images: imagePath ? [imagePath] : [], // Save image path in array
        retailerId: retailerId, // Reference to the retailer
      });
    }
    

    // Save all medicines in the database
    await Medicine.insertMany(medicines);
    res.status(201).json({ message: 'Medicines added successfully', medicines });

  } catch (error) {
    console.error('Error adding medicines from zip:', error);
    res.status(500).json({ message: 'Failed to add medicines from zip', error: error.message });
  } finally {
    // Cleanup: remove the uploaded zip file
    if (zipFilePath && fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }
  }
};

// Bulk Add Medicines from Tabular UI
exports.addBulkMedicines = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Access denied. Only retailers can add medicines.' });
  }

  const { medicines } = req.body;
  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ message: 'No medicines provided' });
  }

  try {
    const formattedMedicines = medicines.map(item => ({
        name: item.name, 
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        description: item.description || 'No description provided',
        prescription: item.prescription,
        images: item.images || [], 
        retailerId: req.user._id,
    }));

    await Medicine.insertMany(formattedMedicines);
    res.status(201).json({ message: 'Bulk medicines added successfully', count: formattedMedicines.length });
  } catch (error) {
    console.error('Error adding bulk medicines:', error);
    res.status(500).json({ message: 'Failed to add bulk medicines', error: error.message });
  }
};

// Add Medicine (Retailer Only)
exports.addMedicine = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Medicine image is required' });
  }
  const { name, price, quantity ,category, prescription} = req.body;
  const image = req.file.path;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Access denied. Only retailers can add medicines.' });
  }
  const retailerId = req.user._id; // Get retailer ID from authenticated user

  try {
    const newMedicine = new Medicine({ name, price, quantity ,category, prescription, images: [image], retailerId });
    await newMedicine.save();
    res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to add medicine', error: error.message });
  }
};

// Get All Medicines (Public)
exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().populate('retailerId', 'firstName lastName');
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch medicines', error: error.message });
  }
};

// Get Single Medicine by ID (Public)
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('retailerId', 'firstName lastName');
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch medicine details', error: error.message });
  }
};

// Get Retailer's Medicines (Retailer Only)
exports.getMyMedicines = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Access denied. Only retailers can access their medicine catalog.' });
  }
  const retailerId = req.user._id;

  try {
    const medicines = await Medicine.find({ retailerId });
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your medicines', error: error.message });
  }
};

// Delete Medicine (Retailer Only)
exports.deleteMedicine = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    if (!medicine.retailerId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this medicine' });
    }
    await Medicine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete medicine', error: error.message });
  }
};

// Update Medicine (Retailer Only)
exports.updateMedicine = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    if (!medicine.retailerId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // C5-8: Whitelist allowed fields to prevent mass assignment (e.g., hijacking retailerId)
    const allowedUpdates = ["name", "price", "quantity", "category", "prescription", "description", "isActive"];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    if (req.file) {
      updates.images = [req.file.path];
    }

    const updated = await Medicine.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Medicine updated', medicine: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Update Status (Retailer Only)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'retailer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    const { ids, isActive } = req.body;
    if (!ids || !Array.isArray(ids) || typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const query = { _id: { $in: ids } };
    if (req.user.role !== 'admin') {
      query.retailerId = req.user._id; // Ensure retailers can only update their own
    }

    const result = await Medicine.updateMany(query, { $set: { isActive } });
    res.status(200).json({ message: 'Status updated successfully', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Delete Medicines (Retailer Only)
exports.bulkDeleteMedicines = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'retailer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const query = { _id: { $in: ids } };
    if (req.user.role !== 'admin') {
      query.retailerId = req.user._id; // Ensure retailers can only delete their own
    }

    const result = await Medicine.deleteMany(query);
    res.status(200).json({ message: 'Medicines deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
