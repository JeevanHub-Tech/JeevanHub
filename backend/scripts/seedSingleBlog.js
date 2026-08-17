const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Blog = require('../models/Blog');
const MDB_URI = process.env.MDB || 'mongodb://localhost:27017/ayurveda';

const hostedBlog = {
  title: "Ayurveda for Women's Hormonal Balance: Natural Wellness Approach",
  description: "<p>Hormonal balance plays an important role in a woman’s overall health, affecting energy levels, mood, menstrual cycles, skin health, and emotional well-being. Ayurveda offers a holistic approach to supporting hormonal wellness through balanced nutrition, herbal support, lifestyle practices, and maintaining harmony between the mind and body.</p>",
  date: new Date(),
  authorType: "admin",
  authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
  authorName: "Super Admin",
  image: "https://res.cloudinary.com/etzpzfcg/image/upload/v1785761069/jeevanhub/blogs/tddgo7kowhkgnl9fohhz.jpg",
  category: "womens-health"
};

async function seedSingle() {
  try {
    await mongoose.connect(MDB_URI);
    console.log('Connected to database.');
    
    // Check if a blog with this title already exists and delete it to prevent duplicates
    await Blog.deleteMany({ title: hostedBlog.title });
    
    const doc = await Blog.create(hostedBlog);
    console.log('Successfully inserted hosted blog:', doc.title);
  } catch (error) {
    console.error('Error inserting blog:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedSingle();
