const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Patient = require('../models/Patient');
const Retailer = require('../models/Retailer');
const Medicine = require('../models/Medicine');
const { encrypt } = require('../utils/encryption');

async function seedTestFlow() {
    const MDB = process.env.MDB;
    if (!MDB) {
        console.error('MDB environment variable is missing.');
        process.exit(1);
    }

    await mongoose.connect(MDB);
    console.log('Connected to MongoDB successfully.');

    // 1. Test Patient
    const patientPasswordHash = await bcrypt.hash('TestPatient@123', 10);
    const patient = await Patient.findOneAndUpdate(
        { email: 'testpatient@jeevanhub.com' },
        {
            $set: {
                firstName: 'Test',
                lastName: 'Patient',
                email: 'testpatient@jeevanhub.com',
                password: patientPasswordHash,
                phone: '9999911111',
                dob: '1995-01-01',
                gender: 'Male',
                zipCode: '110001',
                address: 'Flat 101, Connaught Place, New Delhi',
                role: 'patient',
                status: 'active'
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Test Patient created: ${patient.email} (Password: TestPatient@123)`);

    // 2. Test Retailer
    const retailerPasswordHash = await bcrypt.hash('TestRetailer@123', 10);
    const retailer = await Retailer.findOneAndUpdate(
        { email: 'testretailer@jeevanhub.com' },
        {
            $set: {
                firstName: 'AyurCare',
                lastName: 'Pharmacy',
                BusinessName: 'AyurCare Test Pharmacy',
                email: 'testretailer@jeevanhub.com',
                password: retailerPasswordHash,
                phone: '9999922222',
                dob: '1988-01-01',
                gender: 'Male',
                zipCode: '110020',
                licenseNumber: 'DL-AY-10001',
                role: 'retailer',
                status: 'active',
                shippingIntegrations: {
                    delhivery: {
                        method: 'apiToken',
                        apiToken: encrypt('test_sandbox_api_token_12345'),
                        isConfigured: true,
                        configuredAt: new Date()
                    }
                },
                warehouse: {
                    name: 'Main Delhi Warehouse',
                    address: 'Plot 42, Okhla Industrial Area Phase 3',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110020',
                    phone: '9999922222',
                    isConfigured: true
                },
                adminVerification: {
                    isVerified: true,
                    verifiedAt: new Date(),
                    notes: 'Verified for 1 INR testing flow'
                }
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Test Retailer created: ${retailer.email} (Password: TestRetailer@123)`);

    // 3. Test Medicines (₹1 each)
    const testMedicines = [
        {
            name: 'Test Tulsi Drops (Rs 1)',
            price: 1,
            quantity: 100,
            category: 'Immunity & Stress',
            description: 'Pure organic Tulsi drops for daily immunity and stress relief. Test product priced at 1 Rupee.',
            diseasesTreated: ['Immunity', 'Cold'],
            prescription: false,
            weightGrams: 100,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'],
            retailerId: retailer._id
        },
        {
            name: 'Test Neem Soap (Rs 1)',
            price: 1,
            quantity: 100,
            category: 'Personal Care',
            description: 'Traditional purifying neem herbal soap. Test product priced at 1 Rupee.',
            diseasesTreated: ['Skin care'],
            prescription: false,
            weightGrams: 150,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1608248597359-00f074d008b8?auto=format&fit=crop&w=600&q=80'],
            retailerId: retailer._id
        }
    ];

    for (const med of testMedicines) {
        const doc = await Medicine.findOneAndUpdate(
            { name: med.name, retailerId: retailer._id },
            { $set: med },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Test Medicine upserted: "${doc.name}" - Rs ${doc.price} (id: ${doc._id})`);
    }

    console.log('\n--- Seeding Complete ---');
    console.log('Test Patient:  testpatient@jeevanhub.com  / TestPatient@123');
    console.log('Test Retailer: testretailer@jeevanhub.com / TestRetailer@123');
    console.log('Test Products: 2 items priced at Rs 1 ready for checkout');
    
    await mongoose.disconnect();
    process.exit(0);
}

seedTestFlow().catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
});
