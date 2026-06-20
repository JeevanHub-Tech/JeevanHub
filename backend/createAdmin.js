require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Adjust path if necessary

const createFirstAdmin = async () => {
    try {
        // Connect to MongoDB using the URI in your .env file
        await mongoose.connect(process.env.MDB);
        console.log("Connected to MongoDB...");

        const email = "admin@jeevanhub.com";
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log("Admin already exists! Updating permissions...");
            existingAdmin.canRegisterAdmin = true;
            await existingAdmin.save();
            console.log("✅ Admin permissions updated!");
            process.exit(0);
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash("admin123", 10);

        // Create the new admin
        const newAdmin = new Admin({
            firstName: "Super",
            lastName: "Admin",
            email: email,
            phone: "1234567890",
            password: hashedPassword,
            canRegisterAdmin: true,
        });

        await newAdmin.save();
        
        console.log("✅ First Admin created successfully!");
        console.log("Email: admin@jeevanhub.com");
        console.log("Password: admin123");
        
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
};

createFirstAdmin();
