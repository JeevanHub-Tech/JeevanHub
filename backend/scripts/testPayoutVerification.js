// backend/scripts/testPayoutVerification.js
require('dotenv').config();
const cashfreeService = require('../services/cashfreeService');

async function runPayoutVerification() {
    console.log('====================================================');
    console.log(' CASHFREE PAYOUTS INTEGRATION VERIFICATION (PHASE 2)');
    console.log('====================================================');

    const config = cashfreeService.getPayoutConfig();
    console.log(`[Config] Environment: ${config.env}`);
    console.log(`[Config] Base URL: ${config.baseUrl}`);
    console.log(`[Config] Client ID: ${config.clientId ? config.clientId.slice(0, 10) + '...' : 'MISSING'}`);
    console.log(`[Config] API Version: ${config.apiVersion}`);

    if (!config.clientId || !config.clientSecret) {
        console.error('ERROR: Cashfree Payouts credentials not configured in backend/.env');
        process.exit(1);
    }

    const testId = Date.now().toString(36);

    // TEST 1: Sync Retailer Beneficiary (Bank Account)
    console.log('\n--- 1. Testing Retailer Beneficiary Sync (Bank Account) ---');
    try {
        const retBene = await cashfreeService.syncBeneficiary({
            entityType: 'retailer',
            entityId: '65f123456789012345678901',
            name: 'Patanjali Ayurveda Kendra',
            email: 'retailer@jeevanhub.com',
            phone: '9876543210',
            bankAccount: '000101010101',
            ifsc: 'HDFC0000001'
        });
        console.log('✅ Retailer Beneficiary Synced:', retBene);

        // Test 1b: Duplicate sync (should return existing gracefully via 409 conflict handling)
        console.log('--- 1b. Testing Idempotent Beneficiary Sync (409 Conflict Handling) ---');
        const retBeneDup = await cashfreeService.syncBeneficiary({
            entityType: 'retailer',
            entityId: '65f123456789012345678901',
            name: 'Patanjali Ayurveda Kendra',
            email: 'retailer@jeevanhub.com',
            phone: '9876543210',
            bankAccount: '000101010101',
            ifsc: 'HDFC0000001'
        });
        console.log('✅ Idempotent duplicate handled successfully:', retBeneDup);
    } catch (err) {
        console.error('❌ Retailer beneficiary sync failed:', err.message);
    }

    // TEST 2: Sync Doctor Beneficiary (UPI ID)
    console.log('\n--- 2. Testing Doctor Beneficiary Sync (UPI ID) ---');
    let docBene;
    try {
        docBene = await cashfreeService.syncBeneficiary({
            entityType: 'doctor',
            entityId: '65f987654321098765432109',
            name: 'Dr. Anand Sharma',
            email: 'dr.anand@jeevanhub.com',
            phone: '9123456789',
            upiId: 'dr.anand@okaxis'
        });
        console.log('✅ Doctor Beneficiary Synced:', docBene);
    } catch (err) {
        console.error('❌ Doctor beneficiary sync failed:', err.message);
    }

    // TEST 3: High-Level processEntityPayout (Retailer: 2% commission escrow disbursement)
    console.log('\n--- 3. Testing Retailer Payout Execution (2% Commission) ---');
    try {
        const mockRetailer = {
            _id: '65f123456789012345678901',
            firstName: 'Patanjali',
            lastName: 'Ayurveda',
            email: 'orders@patanjali.store',
            phone: '9876543210'
        };
        const mockPayoutMethod = {
            type: 'bank_account',
            accountHolderName: 'Patanjali Ayurveda Kendra',
            accountNumber: '000101010101',
            ifscCode: 'HDFC0000001'
        };

        const itemsSubtotal = 1000;
        const commissionRate = 0.02; // 2%
        const commission = itemsSubtotal * commissionRate; // 20
        const shipping = 50;
        const netRetailerPayout = (itemsSubtotal - commission) + shipping; // 1030

        console.log(`Calculating Retailer Payout: Subtotal=₹${itemsSubtotal}, Commission(2%)=₹${commission}, Shipping=₹${shipping} => Net=₹${netRetailerPayout}`);

        const retailerPayoutRes = await cashfreeService.processEntityPayout({
            entityType: 'retailer',
            entity: mockRetailer,
            payoutMethod: mockPayoutMethod,
            amount: netRetailerPayout,
            referenceId: `ord_test_${testId}`,
            remarks: `JH Order Payout #${testId}`
        });

        console.log('✅ Retailer Payout Transfer Executed:', {
            transferId: retailerPayoutRes.transferId,
            cfTransferId: retailerPayoutRes.cfTransferId,
            status: retailerPayoutRes.status,
            mode: retailerPayoutRes.mode,
            beneficiaryId: retailerPayoutRes.beneficiaryId
        });
    } catch (err) {
        console.error('❌ Retailer payout execution failed:', err.message);
    }

    // TEST 4: High-Level processEntityPayout (Doctor: 12% commission escrow disbursement)
    console.log('\n--- 4. Testing Doctor Payout Execution (12% Commission) ---');
    try {
        const mockDoctor = {
            _id: '65f987654321098765432109',
            firstName: 'Dr. Anand',
            lastName: 'Sharma',
            email: 'dr.anand@jeevanhub.com',
            phone: '9123456789',
            upiId: 'dr.anand@okaxis'
        };
        const mockDoctorMethod = {
            type: 'upi',
            upiId: 'dr.anand@okaxis',
            accountHolderName: 'Dr. Anand Sharma'
        };

        const consultationFee = 500;
        const dietPlanFee = 299;
        const totalBookingAmount = consultationFee + dietPlanFee; // 799
        const docCommissionRate = 0.12; // 12%
        const docCommission = Math.round(totalBookingAmount * docCommissionRate * 100) / 100; // 95.88
        const netDoctorPayout = Math.round((totalBookingAmount - docCommission) * 100) / 100; // 703.12

        console.log(`Calculating Doctor Payout: Total=₹${totalBookingAmount}, Commission(12%)=₹${docCommission} => Net=₹${netDoctorPayout}`);

        const doctorPayoutRes = await cashfreeService.processEntityPayout({
            entityType: 'doctor',
            entity: mockDoctor,
            payoutMethod: mockDoctorMethod,
            amount: netDoctorPayout,
            referenceId: `bkg_test_${testId}`,
            remarks: `JH Doctor Payout #${testId}`
        });

        console.log('✅ Doctor Payout Transfer Executed:', {
            transferId: doctorPayoutRes.transferId,
            cfTransferId: doctorPayoutRes.cfTransferId,
            status: doctorPayoutRes.status,
            mode: doctorPayoutRes.mode,
            beneficiaryId: doctorPayoutRes.beneficiaryId
        });
    } catch (err) {
        console.error('❌ Doctor payout execution failed:', err.message);
    }

    console.log('\n====================================================');
    console.log(' ALL VERIFICATION CHECKS COMPLETED!');
    console.log('====================================================\n');
}

runPayoutVerification().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
