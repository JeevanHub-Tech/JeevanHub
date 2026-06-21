const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MDB = 'mongodb+srv://bhawaniola08:8KKvmL6nCf5zSbiN@cluster0.miwtf.mongodb.net/ayurveda';

mongoose.connect(MDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const db = mongoose.connection.db;
    const admins = await db.collection('admins').find({}).toArray();
    
    if (admins.length === 0) {
      console.log("No admins found in the database. Creating one...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.collection('admins').insertOne({
          firstName: "Super",
          lastName: "Admin",
          email: "admin@jeevanhub.com",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date()
      });
      console.log("Created default admin: Email: admin@jeevanhub.com, Password: admin123");
    } else {
      console.log(`Found ${admins.length} admin(s) in the database:`);
      admins.forEach(admin => {
        console.log(`Email: ${admin.email}`);
      });
      console.log("\nSince passwords are encrypted, I can't show you the plain-text password.");
      console.log("To easily log in, I am resetting the first admin's password to: admin123");
      
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.collection('admins').updateOne(
          { _id: admins[0]._id },
          { $set: { password: hashedPassword } }
      );
      console.log(`\nPassword for ${admins[0].email} successfully reset to: admin123`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
