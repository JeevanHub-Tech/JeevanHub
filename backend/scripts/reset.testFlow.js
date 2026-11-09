const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Patient = require('../models/Patient');
const Retailer = require('../models/Retailer');
const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { encrypt } = require('../utils/encryption');

async function resetTestFlow() {
    const MDB = process.env.MDB;
    if (!MDB) {
        console.error('MDB environment variable is missing.');
        process.exit(1);
    }

    await mongoose.connect(MDB);
    console.log('Connected to MongoDB successfully.');

    // 1. Reset Test Patient
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
    console.log(`✅ Test Patient reset: ${patient.email}`);

    // Clear previous test orders and cart for clean testing
    const deletedOrders = await Order.deleteMany({ 'buyer.buyerId': patient._id });
    console.log(`🧹 Cleaned up ${deletedOrders.deletedCount} old test orders for ${patient.email}`);
    await Cart.deleteMany({ patientId: patient._id });
    console.log(`🧹 Cleared cart for ${patient.email}`);

    // 2. Reset Test Retailer
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
                payoutMethods: [
                    {
                        type: 'bank_account',
                        accountHolderName: 'AyurCare Test Pharmacy',
                        accountNumber: '987654321098',
                        ifscCode: 'HDFC0001234',
                        bankName: 'HDFC Bank',
                        isPrimary: true,
                        createdAt: new Date()
                    },
                    {
                        type: 'upi',
                        accountHolderName: 'AyurCare Test Pharmacy',
                        upiId: 'ayurcare@okhdfcbank',
                        isPrimary: false,
                        createdAt: new Date()
                    }
                ],
                bankDetails: {
                    accountHolderName: 'AyurCare Test Pharmacy',
                    accountNumber: '987654321098',
                    ifscCode: 'HDFC0001234',
                    bankName: 'HDFC Bank',
                    isSubmitted: true
                },
                adminVerification: {
                    isVerified: true,
                    verifiedAt: new Date(),
                    notes: 'Verified for 1 INR live testing flow'
                }
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Test Retailer reset: ${retailer.email} with Bank & UPI payout methods`);

    // 3. Reset Test Medicines (₹1 each, stock 100)
    const testMedicines = [
        {
            name: 'Test Tulsi Drops (Rs 1)',
            price: 1,
            quantity: 100,
            category: 'Ayurvedic',
            description: 'Pure organic Tulsi drops for daily immunity. Priced at ₹1 for live checkout testing.',
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
            description: 'Traditional purifying neem herbal soap. Priced at ₹1 for live checkout testing.',
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
        console.log(`✅ Test Medicine ready: "${doc.name}" - ₹${doc.price} (Stock: ${doc.quantity})`);
    }

    console.log('\n===========================================');
    console.log('🎉 TEST ENVIRONMENT RESET COMPLETE');
    console.log('===========================================');
    console.log('Patient Login:   testpatient@jeevanhub.com  / TestPatient@123');
    console.log('Retailer Login:  testretailer@jeevanhub.com / TestRetailer@123');
    console.log('Admin Login:     admin@jeevanhub.com        / Admin@123');
    console.log('Test Medicines:  2 products at ₹1 each on /medicines');
    console.log('Payout Window:   2 minutes hold (PAYOUT_HOLD_MINUTES=2)');
    console.log('===========================================\n');

    await mongoose.disconnect();
    process.exit(0);
}

resetTestFlow().catch((err) => {
    console.error('Error during test flow reset:', err);
    process.exit(1);
});
