const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Blog = require('../models/Blog');
const AIBlog = require('../models/AIBlog');

const MDB_URI = process.env.MDB || 'mongodb://localhost:27017/ayurveda';

const sampleBlogs = [
  {
    title: "Understanding your Dosha: Vata, Pitta, and Kapha",
    description: "<p>In Ayurveda, wellness is achieved by balancing the three physical energies or doshas. Vata governs movement, Pitta governs metabolism and heat, while Kapha governs structure and fluid balance. Learn how identifying your dominant dosha can help you customize your diet and lifestyle for optimal health.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    category: "ayurveda-basics"
  },
  {
    title: "Top 5 Ayurvedic Herbs for Brain Power & Memory",
    description: "<p>Ayurveda offers natural cognitive enhancers known as Medhya Rasayanas. Among the most popular are Brahmi (Bacopa monnieri), Shankhpushpi, Ashwagandha, and Gotu Kola. These herbs help reduce stress and anxiety, improve focus, and protect brain cells from aging.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=800&q=80",
    category: "herbs-spices"
  },
  {
    title: "An Ayurvedic Guide to Healthy, Glowing Skin",
    description: "<p>True beauty starts from within. Ayurvedic skincare focuses on balancing your dosha and detoxifying your body (Rakta Shodhana). Utilizing cooling herbs like Aloe Vera, Sandalwood (Chandana), and Turmeric masks helps clear blemishes and maintain soft, glowing skin naturally.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    category: "skin-hair"
  },
  {
    title: "The Power of Ashwagandha: Benefits & Daily Use",
    description: "<p>Ashwagandha is one of the most powerful adaptogenic herbs in Ayurvedic medicine. It helps the body manage physical and emotional stress, boosts energy levels, supports immune strength, and enhances sleep quality when taken with warm milk before bed.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80",
    category: "herbs-spices"
  },
  {
    title: "Digestive Fire: 5 Easy Ways to Boost Your Agni",
    description: "<p>According to Ayurveda, poor digestion (weak Agni) is the root cause of most health issues. To boost your digestive fire, try sipping warm ginger tea before meals, eating in a peaceful environment, avoiding ice-cold drinks, and leaving time between meals for proper digestion.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    category: "digestion"
  },
  {
    title: "Ayurvedic Secrets for Thicker, Stronger Hair",
    description: "<p>Hair health is closely linked to bone tissue (Asthi Dhatu) and nervous system balance. Massaging your scalp weekly with warm herbal oils like Bhringraj, Amla, or Brahmi oil improves circulation, nourishes hair roots, cools the mind, and prevents premature graying.</p>",
    date: new Date(),
    authorType: "admin",
    authorId: new mongoose.Types.ObjectId("65f8a7e00000000000000001"),
    authorName: "Super Admin",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    category: "skin-hair"
  }
];

const sampleVideos = [
  {
    title: "15-Minute Ayurvedic Dinacharya Morning Routine",
    url: "ayurvedic-dinacharya-morning-routine-v2",
    content: {
      html: "<p>Dinacharya is the daily Ayurvedic self-care routine that promotes alignment with nature's rhythm. Follow this simple video to learn about tongue scraping, warm oil massage (Abhyanga), and morning meditation.</p><iframe width=\"100%\" height=\"315\" src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" frameborder=\"0\" allowfullscreen></iframe>",
      images: [],
      videos: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          caption: "Morning Self-Care Routine"
        }
      ],
      links: [],
      embeds: [
        {
          type: "youtube",
          embedCode: "dQw4w9WgXcQ"
        }
      ]
    },
    tags: ["daily-routine", "wellness"],
    user: {
      userId: "65f8a7e00000000000000001",
      name: "Super Admin"
    },
    timestamp: new Date()
  },
  {
    title: "Yoga & Pranayama Practices for Relieving Stress",
    url: "yoga-pranayama-stress-relief-v2",
    content: {
      html: "<p>Calm your mind and reduce cortisol levels with these easy breathing techniques (Anulom Vilom and Bhramari) combined with grounding yoga poses. Recommended for daily practice.</p><iframe width=\"100%\" height=\"315\" src=\"https://www.youtube.com/embed/v7AYKMP6rOE\" frameborder=\"0\" allowfullscreen></iframe>",
      images: [],
      videos: [
        {
          url: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
          caption: "Yoga & Breathwork"
        }
      ],
      links: [],
      embeds: [
        {
          type: "youtube",
          embedCode: "v7AYKMP6rOE"
        }
      ]
    },
    tags: ["yoga", "mental-wellness"],
    user: {
      userId: "65f8a7e00000000000000001",
      name: "Super Admin"
    },
    timestamp: new Date()
  },
  {
    title: "How to Make Golden Milk (Traditional Turmeric Recipe)",
    url: "make-golden-milk-turmeric-recipe",
    content: {
      html: "<p>Golden milk is an ancient Ayurvedic remedy used to boost immunity, reduce inflammation, and support comfortable sleep. Watch how to easily prepare it using fresh turmeric, black pepper, and milk.</p><iframe width=\"100%\" height=\"315\" src=\"https://www.youtube.com/embed/4M1944Zf4sA\" frameborder=\"0\" allowfullscreen></iframe>",
      images: [],
      videos: [
        {
          url: "https://www.youtube.com/watch?v=4M1944Zf4sA",
          caption: "Golden Milk Recipe Tutorial"
        }
      ],
      links: [],
      embeds: [
        {
          type: "youtube",
          embedCode: "4M1944Zf4sA"
        }
      ]
    },
    tags: ["home-remedies", "immunity"],
    user: {
      userId: "65f8a7e00000000000000001",
      name: "Super Admin"
    },
    timestamp: new Date()
  },
  {
    title: "Step-by-Step Ayurvedic Body Massage (Abhyanga)",
    url: "ayurvedic-abhyanga-body-massage",
    content: {
      html: "<p>Abhyanga is the practice of self-massage with warm, dosha-specific herbal oil. It benefits circulation, strengthens muscles, nourishes the skin, and helps calm the nervous system before bedtime.</p><iframe width=\"100%\" height=\"315\" src=\"https://www.youtube.com/embed/_HQLsf780OU\" frameborder=\"0\" allowfullscreen></iframe>",
      images: [],
      videos: [
        {
          url: "https://www.youtube.com/watch?v=_HQLsf780OU",
          caption: "Abhyanga Self-Massage"
        }
      ],
      links: [],
      embeds: [
        {
          type: "youtube",
          embedCode: "_HQLsf780OU"
        }
      ]
    },
    tags: ["massage-oils", "wellness"],
    user: {
      userId: "65f8a7e00000000000000001",
      name: "Super Admin"
    },
    timestamp: new Date()
  }
];

async function seed() {
  try {
    console.log('Connecting to database:', MDB_URI);
    await mongoose.connect(MDB_URI);
    console.log('Connected successfully!');

    console.log('Inserting standard blogs...');
    const insertedBlogs = await Blog.insertMany(sampleBlogs);
    console.log(`Inserted ${insertedBlogs.length} standard blogs.`);

    console.log('Inserting video blogs...');
    const insertedVideos = await AIBlog.insertMany(sampleVideos);
    console.log(`Inserted ${insertedVideos.length} video blogs.`);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
