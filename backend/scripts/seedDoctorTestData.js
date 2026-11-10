// backend/scripts/seedDoctorTestData.js
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Booking = require('../models/Booking');
const Blog = require('../models/Blog');

async function seed() {
  const uri = process.env.MDB;
  if (!uri) {
    console.error('Missing process.env.MDB');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB for Doctor Seeding');

  // 1. Locate or Update Doctor
  let doctor = await Doctor.findOne({ email: 'doctor@test.com' });
  if (!doctor) {
    console.error('Doctor doctor@test.com not found!');
    process.exit(1);
  }

  doctor.firstName = 'Priya';
  doctor.lastName = 'Nair';
  doctor.designation = 'Senior Ayurvedic Physician & Panchakarma Specialist';
  doctor.specialization = ['Panchakarma', 'Kayachikitsa', 'Ayurvedic Dietetics', 'Digestive Health'];
  doctor.education = 'BAMS, MD (Ayurveda) - NIA Jaipur';
  doctor.experience = 12;
  doctor.registrationNumber = 'AYUSH-DEL-2014-88392';
  doctor.price = 600;
  doctor.dietPlanFee = 350;
  doctor.approvalStatus = 'Approved';
  doctor.phone = '9876543210';
  doctor.gender = 'Female';
  doctor.address = 'A-42, AyurVeda Wellness Center, Connaught Place, New Delhi';
  doctor.zipCode = '110001';
  doctor.languages = ['English', 'Hindi', 'Malayalam'];
  doctor.introduction =
    'Dr. Priya Nair has over 12 years of specialized clinical experience in classical Panchakarma, gut health restoration, and tailored Dinacharya lifestyle medicine.';
  doctor.upiId = 'drpriya.nair@okhdfcbank';
  doctor.bankDetails = {
    accountHolderName: 'Dr. Priya Nair',
    accountNumber: '50100492817291',
    ifscCode: 'HDFC0000060',
    bankName: 'HDFC Bank',
    upiId: 'drpriya.nair@okhdfcbank',
    isSubmitted: true,
  };
  doctor.certificate =
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80';
  doctor.profileImage =
    'https://images.unsplash.com/photo-1594824813583-066929c298ee?w=400&auto=format&fit=crop&q=80';

  await doctor.save();
  console.log('✅ Doctor profile and payout details seeded:', doctor.email);

  // 2. Ensure Sample Patients Exist
  const patientProfiles = [
    {
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@test.com',
      phone: '9811223344',
      gender: 'Male',
      age: 32,
      dob: new Date('1994-05-14'),
      zipCode: '110001',
    },
    {
      firstName: 'Ananya',
      lastName: 'Iyer',
      email: 'ananya.iyer@test.com',
      phone: '9822334455',
      gender: 'Female',
      age: 28,
      dob: new Date('1998-08-22'),
      zipCode: '110016',
    },
    {
      firstName: 'Rajesh',
      lastName: 'Verma',
      email: 'rajesh.verma@test.com',
      phone: '9833445566',
      gender: 'Male',
      age: 45,
      dob: new Date('1981-11-03'),
      zipCode: '110024',
    },
    {
      firstName: 'Meera',
      lastName: 'Patel',
      email: 'meera.patel@test.com',
      phone: '9844556677',
      gender: 'Female',
      age: 38,
      dob: new Date('1988-03-19'),
      zipCode: '110048',
    },
    {
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'vikram.singh@test.com',
      phone: '9855667788',
      gender: 'Male',
      age: 52,
      dob: new Date('1974-09-30'),
      zipCode: '110070',
    },
    {
      firstName: 'Kavita',
      lastName: 'Deshmukh',
      email: 'kavita.deshmukh@test.com',
      phone: '9866778899',
      gender: 'Female',
      age: 29,
      dob: new Date('1997-01-12'),
      zipCode: '110020',
    },
  ];

  const patientMap = {};
  for (const p of patientProfiles) {
    let patient = await Patient.findOne({ email: p.email });
    if (!patient) {
      patient = new Patient({
        ...p,
        role: 'patient',
        password: '$2a$10$wTqKjJzTjPj6E0W1j7yK7ev1Sj2CqC5xM4mY4j2qC5xM4mY4j2qC5',
      });
      await patient.save();
    }
    patientMap[p.email] = patient;
  }
  console.log('✅ Patient profiles seeded');

  // 3. Clear Old Bookings for this Doctor and Seed Fresh Bookings
  await Booking.deleteMany({ doctorId: doctor._id });

  // Get a valid slotId from Monday/Tuesday
  const mondaySlotId = doctor.availableSlots?.Monday?.[0]?._id || new mongoose.Types.ObjectId();
  const tuesdaySlotId = doctor.availableSlots?.Tuesday?.[0]?._id || new mongoose.Types.ObjectId();

  const today = new Date();
  const today11AM = new Date(today);
  today11AM.setHours(11, 30, 0, 0);

  const today2PM = new Date(today);
  today2PM.setHours(14, 30, 0, 0);

  const today10AM = new Date(today);
  today10AM.setHours(10, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const friday = new Date(today);
  friday.setDate(today.getDate() + 3);
  friday.setHours(15, 0, 0, 0);

  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(today.getDate() - n);
    return d;
  };

  const sampleBookings = [
    // 1. Next Up Today (Online Video)
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: today11AM,
      patientId: patientMap['aarav.sharma@test.com']._id,
      patientEmail: 'aarav.sharma@test.com',
      patientName: 'Aarav Sharma',
      patientGender: 'Male',
      patientAge: 32,
      patientIllness: 'Severe hyperacidity, acid reflux after meals, and disturbed sleep.',
      requestAccept: 'accepted',
      meetLink: 'https://meet.google.com/jh-ayur-consult',
      dailyRoomUrl: 'https://jeevanhub.daily.co/consult-aarav-sharma',
      amountPaid: 600,
      paymentStatus: 'Completed',
      paymentConfirmedAt: today,
    },

    // 2. Scheduled Today (In-Clinic)
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: today2PM,
      patientId: patientMap['ananya.iyer@test.com']._id,
      patientEmail: 'ananya.iyer@test.com',
      patientName: 'Ananya Iyer',
      patientGender: 'Female',
      patientAge: 28,
      patientIllness: 'Cervical stiffness, lower back pain, chronic morning fatigue.',
      requestAccept: 'accepted',
      meetLink: 'no',
      amountPaid: 600,
      paymentStatus: 'Completed',
      paymentConfirmedAt: today,
    },

    // 3. Completed Today (Prescribed with 5-star review)
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: today10AM,
      patientId: patientMap['rajesh.verma@test.com']._id,
      patientEmail: 'rajesh.verma@test.com',
      patientName: 'Rajesh Verma',
      patientGender: 'Male',
      patientAge: 45,
      patientIllness: 'Sluggish metabolic rate, fatty liver indications, and Kapha bloating.',
      requestAccept: 'accepted',
      diagnosis: 'Kapha-Vata Agnimandya (Weak Digestive Fire) with mild hepatic congestion.',
      recommendedSupplements: [
        {
          medicineName: 'Arogyavardhini Vati',
          dosage: '1 tablet twice daily with warm water',
          instructions: 'Take 20 minutes before meals for liver detoxification.',
          published: true,
        },
        {
          medicineName: 'Triphala Churna Organic',
          dosage: '1 teaspoon with lukewarm water at bedtime',
          instructions: 'Digestive regularity & colon cleansing.',
          published: true,
        },
      ],
      dietPlanRequested: true,
      dietPlanFee: 350,
      dietPlanStatus: 'completed',
      amountPaid: 950,
      paymentStatus: 'Completed',
      rating: 5,
      review:
        'Dr. Priya is exceptionally thorough and empathetic. Her personalized diet regimen and herbal recommendations brought noticeable relief within days.',
    },

    // 4. Upcoming Tomorrow
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: tuesdaySlotId,
      dateOfAppointment: tomorrow,
      patientId: patientMap['meera.patel@test.com']._id,
      patientEmail: 'meera.patel@test.com',
      patientName: 'Meera Patel',
      patientGender: 'Female',
      patientAge: 38,
      patientIllness: 'Pitta flare-ups, seasonal skin eruptions, and chronic migraine.',
      requestAccept: 'accepted',
      meetLink: 'https://meet.google.com/jh-pitta-care',
      amountPaid: 600,
      paymentStatus: 'Completed',
    },

    // 5. Upcoming this week
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: friday,
      patientId: patientMap['vikram.singh@test.com']._id,
      patientEmail: 'vikram.singh@test.com',
      patientName: 'Vikram Singh',
      patientGender: 'Male',
      patientAge: 52,
      patientIllness: 'Joint inflammation, Vata disorder, elevated systolic pressure.',
      requestAccept: 'accepted',
      meetLink: 'no',
      amountPaid: 600,
      paymentStatus: 'Completed',
    },

    // 6. Completed 4 days ago
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(4),
      patientId: patientMap['kavita.deshmukh@test.com']._id,
      patientEmail: 'kavita.deshmukh@test.com',
      patientName: 'Kavita Deshmukh',
      patientGender: 'Female',
      patientAge: 29,
      patientIllness: 'Post-viral recovery, low Ojas, brain fog, and chronic lack of appetite.',
      requestAccept: 'accepted',
      diagnosis: 'Ojas Kshaya and Dhatvagni weakness following viral fever.',
      amountPaid: 950,
      dietPlanRequested: true,
      dietPlanFee: 350,
      dietPlanStatus: 'completed',
      paymentStatus: 'Completed',
      rating: 5,
      review:
        'Excellent consultation! Dr. Priya understood my health history immediately. The Ashwagandha and Rasayana recommendations restored my vitality completely.',
    },

    // 7. Completed 10 days ago
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(10),
      patientId: patientMap['aarav.sharma@test.com']._id,
      patientEmail: 'aarav.sharma@test.com',
      patientName: 'Aarav Sharma',
      patientGender: 'Male',
      patientAge: 32,
      patientIllness: 'Initial checkup for chronic heartburn and acidity.',
      requestAccept: 'accepted',
      amountPaid: 600,
      paymentStatus: 'Completed',
      rating: 5,
      review:
        'Very attentive listening and accurate diagnosis. She pinpointed my Pitta imbalance and provided clear Dinacharya corrections.',
    },

    // 8. Completed 18 days ago
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(18),
      patientId: patientMap['ananya.iyer@test.com']._id,
      patientEmail: 'ananya.iyer@test.com',
      patientName: 'Ananya Iyer',
      patientGender: 'Female',
      patientAge: 28,
      patientIllness: 'Vata pacification & chronic anxiety symptoms.',
      requestAccept: 'accepted',
      amountPaid: 600,
      paymentStatus: 'Completed',
      rating: 5,
      review:
        'Dr. Priya took the time to explain the root causes rather than just prescribing symptomatic relief. Highly respected Ayurvedic doctor.',
    },

    // 9. Completed 28 days ago
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(28),
      patientId: patientMap['meera.patel@test.com']._id,
      patientEmail: 'meera.patel@test.com',
      patientName: 'Meera Patel',
      patientGender: 'Female',
      patientAge: 38,
      patientIllness: 'Hormonal imbalance, skin breakouts.',
      requestAccept: 'accepted',
      amountPaid: 600,
      paymentStatus: 'Completed',
      rating: 4,
      review:
        'Great insight on dietary triggers. Digestion improved noticeably in two weeks. Looking forward to my follow-up.',
    },

    // 10. Completed 45 days ago (Last Month for Monthly Analytics)
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(45),
      patientId: patientMap['vikram.singh@test.com']._id,
      patientEmail: 'vikram.singh@test.com',
      patientName: 'Vikram Singh',
      patientGender: 'Male',
      patientAge: 52,
      patientIllness: 'Early signs of osteoarthritis, stiffness in knees.',
      requestAccept: 'accepted',
      amountPaid: 950,
      dietPlanRequested: true,
      dietPlanFee: 350,
      paymentStatus: 'Completed',
      rating: 5,
      review:
        'The classical Kati Basti and tailor-made herbal decoctions worked wonders. My knee mobility has improved by at least 70%.',
    },

    // 11. Denied Consultation (For History Tab test)
    {
      doctorId: doctor._id,
      doctorName: 'Dr. Priya Nair',
      doctorEmail: doctor.email,
      slotId: mondaySlotId,
      dateOfAppointment: daysAgo(6),
      patientId: patientMap['rajesh.verma@test.com']._id,
      patientEmail: 'rajesh.verma@test.com',
      patientName: 'Rajesh Verma',
      patientGender: 'Male',
      patientAge: 45,
      patientIllness: 'Emergency consultation request during unavailable slot.',
      requestAccept: 'denied',
      doctorsMessage: 'Doctor unavailable due to clinical Panchakarma session. Please reschedule for tomorrow.',
      amountPaid: 600,
      paymentStatus: 'Pending',
    },
  ];

  await Booking.insertMany(sampleBookings);
  console.log('✅ 11 Bookings seeded with completed consults, reviews & ratings');

  // 4. Seed Health Blogs for Dr. Priya Nair
  await Blog.deleteMany({ authorId: doctor._id });

  const blogs = [
    {
      title: 'Balancing Pitta Dosha in Warm Weather: Ayurvedic Diet & Cooling Rituals',
      description:
        'As summer peaks, Pitta dosha naturally accumulates in the body, manifesting as digestive heat, skin sensitivities, and irritability. Discover classical Ahara (food) and Vihara (lifestyle) remedies from the Charaka Samhita to stay cool, calm, and vital.',
      category: 'Ayurvedic Nutrition & Diet',
      authorType: 'doctor',
      authorId: doctor._id,
      authorName: 'Dr. Priya Nair',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      date: daysAgo(5),
    },
    {
      title: 'The Science of Agni & Gut Microbiome: Why Digestion Is the Root of Health',
      description:
        'In classical Ayurveda, "Rogaha Sarvepi Mande Agnou" — all diseases originate from impaired metabolic fire (Agni). Explore how gut health dictates immunity (Ojas), mental clarity (Prana), and cellular longevity.',
      category: 'Herbal Remedies & Formulations',
      authorType: 'doctor',
      authorId: doctor._id,
      authorName: 'Dr. Priya Nair',
      image: 'https://images.unsplash.com/photo-1512290900672-1f55b999a4c5?w=800&auto=format&fit=crop&q=80',
      date: daysAgo(15),
    },
    {
      title: 'Dinacharya: 5 Ancient Ayurvedic Morning Rituals to Triple Your Daily Vitality',
      description:
        'Waking up before sunrise (Brahma Muhurta), tongue scraping (Jihwa Nirlekhana), warm oil pulling (Gandusha), and gentle Abhyanga can reset your circadian rhythm and optimize mitochondrial function naturally.',
      category: 'Dinacharya & Daily Routine',
      authorType: 'doctor',
      authorId: doctor._id,
      authorName: 'Dr. Priya Nair',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
      date: daysAgo(25),
    },
  ];

  await Blog.insertMany(blogs);
  console.log('✅ 3 Health blogs seeded for Dr. Priya Nair');

  console.log('==========================================');
  console.log('🎉 SEEDING COMPLETE FOR TEST DOCTOR!');
  console.log('Email: doctor@test.com');
  console.log('Bookings: 11 (2 Today Upcoming, 1 Today Completed, 2 Later, 5 Past, 1 Denied)');
  console.log('Reviews: 6 (Ratings: 5★ and 4★)');
  console.log('Blogs: 3 Published');
  console.log('Payout: HDFC Bank + UPI configured');
  console.log('==========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
