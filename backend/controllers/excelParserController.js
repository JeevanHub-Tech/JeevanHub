const AdmZip = require('adm-zip');
const xlsx = require('xlsx');
const cloudinary = require('../config/cloudinary');
const path = require('path');

// Helper to upload a memory buffer to Cloudinary
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder: 'jeevanhub/medicines',
            resource_type: 'auto'
        }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};

exports.parseBulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.user || req.user.role !== 'retailer') {
        return res.status(403).json({ message: 'Access denied. Only retailers can parse medicines.' });
    }

    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        let data = [];
        let zipEntries = null;
        let zip = null;

        if (ext === '.zip') {
            zip = new AdmZip(req.file.path);
            zipEntries = zip.getEntries();
            const excelEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.xlsx') || entry.entryName.toLowerCase().endsWith('.csv'));
            
            if (!excelEntry) {
                return res.status(400).json({ message: 'Excel (.xlsx or .csv) file not found inside the ZIP archive.' });
            }
            
            const workbook = xlsx.read(zip.readFile(excelEntry), { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else if (ext === '.xlsx' || ext === '.csv') {
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Please upload a .zip, .xlsx, or .csv' });
        }

        // Process data and map headers robustly
        const stagedRows = [];
        for (const item of data) {
            // Lowercase and strip all spaces from all keys
            const rowData = {};
            for (const key in item) {
                const standardizedKey = key.toLowerCase().replace(/\s+/g, '');
                rowData[standardizedKey] = item[key];
            }

            // Check for completely empty row
            const isFalsyOrEmpty = (val) => val === undefined || val === null || String(val).trim() === '';
            const isEmpty = isFalsyOrEmpty(rowData.name) && isFalsyOrEmpty(rowData.price) && isFalsyOrEmpty(rowData.quantity) && isFalsyOrEmpty(rowData.category) && isFalsyOrEmpty(rowData.description) && isFalsyOrEmpty(rowData.imagefilename);
            if (isEmpty) continue;

            const rowErrors = [];
            const images = [];

            // Validate Price
            if (rowData.price !== undefined && rowData.price !== '') {
                const parsedPrice = parseFloat(rowData.price);
                if (isNaN(parsedPrice) || parsedPrice <= 0) {
                    rowErrors.push({ id: Date.now()+Math.random(), type: 'INVALID_PRICE', message: `"${rowData.price}" is not a valid price format.` });
                    rowData.price = ''; // Reset to empty string so it gets highlighted red in UI
                } else {
                    rowData.price = String(parsedPrice);
                }
            }

            // Validate Quantity
            if (rowData.quantity !== undefined && rowData.quantity !== '') {
                const parsedQty = parseInt(rowData.quantity, 10);
                if (isNaN(parsedQty) || parsedQty <= 0) {
                    rowErrors.push({ id: Date.now()+Math.random(), type: 'INVALID_QUANTITY', message: `"${rowData.quantity}" is not a valid quantity.` });
                    rowData.quantity = '';
                } else {
                    rowData.quantity = String(parsedQty);
                }
            }
            // Image handling if it's a zip
            if (ext === '.zip' && rowData.imagefilename) {
                const imgNames = rowData.imagefilename.toString().split(',').map(n => n.trim());
                for (const imgName of imgNames) {
                    const imgEntry = zipEntries.find(entry => entry.entryName === imgName || entry.entryName.endsWith(`/${imgName}`));
                    if (imgEntry) {
                        const buffer = zip.readFile(imgEntry);
                        try {
                            const cloudUrl = await uploadBufferToCloudinary(buffer);
                            images.push(cloudUrl);
                        } catch (err) {
                            rowErrors.push({ id: Date.now()+Math.random(), type: 'IMAGE_UPLOAD_FAILED', message: `Failed to upload image ${imgName} to Cloudinary.` });
                        }
                    } else {
                        rowErrors.push({ id: Date.now()+Math.random(), type: 'MISSING_IMAGE', message: `Image "${imgName}" referenced in Excel was not found in the ZIP file.` });
                    }
                }
            } else if (rowData.imagefilename) {
                rowErrors.push({ id: Date.now()+Math.random(), type: 'MISSING_IMAGE', message: `Cannot process "imagefilename" from a standalone Excel file. Please upload a ZIP.` });
            }

            // Map to frontend expected state format
            const parsedRow = {
                id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                isStaged: true,
                isArchived: false,
                name: rowData.name ? String(rowData.name) : '',
                price: rowData.price !== undefined ? String(rowData.price) : '',
                quantity: rowData.quantity !== undefined ? String(rowData.quantity) : '',
                category: rowData.category ? String(rowData.category) : '',
                description: rowData.description ? String(rowData.description) : '',
                prescription: rowData.prescription ? (String(rowData.prescription).toLowerCase() === 'yes' || String(rowData.prescription).toLowerCase() === 'true' || String(rowData.prescription) === '1') : false,
                images: images,
                errors: rowErrors
            };

            stagedRows.push(parsedRow);
        }

        res.status(200).json({ message: 'Parsed successfully', stagedRows });

    } catch (error) {
        console.error('Error parsing bulk upload:', error);
        res.status(500).json({ message: 'Failed to parse file', error: error.message });
    } finally {
        // Cleanup local uploaded file regardless of success or failure
        const fs = require('fs');
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};
