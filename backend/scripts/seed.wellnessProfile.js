require("dotenv").config();
const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const AyurvedaWellnessProfile = require("../models/AyurvedaWellnessProfile");

const EMAIL = process.argv[2];

const SAMPLE_PROFILE = {
    basicDetails: {
        heightCm: 170,
        weightKg: 68,
        bodyType: "Medium, athletic build",
    },
    healthInfo: {
        conditions: { diabetes: false, highBP: false, obesityFocus: false, other: [] },
        medications: [],
        allergies: ["Peanuts"],
    },
    lifestyle: {
        activityLevel: "moderate",
        sleepHours: 7,
        sleepQuality: "good",
        stressLevel: "moderate",
        exerciseHabits: "Yoga 3x/week, walking daily",
        workRoutine: "Desk job, 9-6",
    },
    foodHabits: {
        dietType: "vegetarian",
        preferredFoods: ["Rice", "Lentils", "Seasonal vegetables"],
        dislikedFoods: ["Bitter gourd"],
        eatingTimings: "Breakfast 8am, Lunch 1pm, Dinner 8pm",
        waterIntakeLiters: 2.5,
    },
    season: { current: "monsoon" },
};

(async () => {
    if (!EMAIL) {
        console.error("Usage: node seed.wellnessProfile.js <patient-email>");
        process.exit(1);
    }
    await mongoose.connect(process.env.MDB);

    const patient = await Patient.findOne({ email: EMAIL });
    if (!patient) {
        console.error(`No patient found for ${EMAIL}`);
        process.exit(1);
    }

    const profile = await AyurvedaWellnessProfile.findOneAndUpdate(
        { patientId: patient._id },
        SAMPLE_PROFILE,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded wellness profile for ${EMAIL} (${patient._id}).`);

    await mongoose.disconnect();
})();
