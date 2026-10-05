import acidRefluxImg from "../media/hb.png";
import constipationImg from "../media/in.jpg";
import ibsImg from "../media/Irritable Bowel Syndrome.jpeg";
import ulcersImg from "../media/digestive.jpg";
import diabetesImg from "../media/diabeties.jpg";

export const categoryTranslations = {
  "Digestive Health": { en: "Digestive Health", hi: "पाचन स्वास्थ्य (अग्नि एवं कोष्ठ)" },
  "Respiratory Health": { en: "Respiratory Health", hi: "श्वसन स्वास्थ्य (प्राणवह स्रोतस)" },
  "Skin Care": { en: "Skin Care", hi: "त्वचा एवं केश देखभाल" },
  "Joint and Bone Health": { en: "Joint and Bone Health", hi: "संधि एवं अस्थि स्वास्थ्य" },
  "Cardiovascular Health": { en: "Cardiovascular Health", hi: "हृदय एवं रक्त परिसंचरण" },
  "Mental Health and Wellness": { en: "Mental Health and Wellness", hi: "मानसिक स्वास्थ्य एवं शांति" },
  "Metabolic and Endocrine Health": { en: "Metabolic and Endocrine Health", hi: "चयापचय एवं हार्मोनल स्वास्थ्य" },
  "Immune Support": { en: "Immune Support", hi: "रोग प्रतिरोधक क्षमता (ओजस एवं व्याधिक्षमत्व)" },
  "Women's Health": { en: "Women's Health", hi: "स्त्री स्वास्थ्य (स्त्री रोग एवं मातृत्व)" },
  "Men's Health": { en: "Men's Health", hi: "पुरुष स्वास्थ्य (शुक्र धातु एवं पौरुष)" },
  "Liver and Kidney Health": { en: "Liver and Kidney Health", hi: "यकृत एवं वृक्क स्वास्थ्य (लिवर व किडनी)" },
  "Eye Health": { en: "Eye Health", hi: "नेत्र स्वास्थ्य एवं दृष्टि सुधार" },
  "Oral Health": { en: "Oral Health", hi: "मुख स्वास्थ्य एवं दंत चिकित्सा" },
  "General Wellness": { en: "General Wellness", hi: "समग्र स्वास्थ्य एवं कायाकल्प (डिटॉक्स)" },
  "Infections": { en: "Infections", hi: "संक्रमण एवं रोग मुक्ति" },
  "Pain Management": { en: "Pain Management", hi: "दर्द निवारण (वेदना शमन)" },
};

export const treatmentDataEn = {
  "Digestive Health": {
    title: "Digestive Health in Ayurveda",
    description:
      "Digestion is the foundation of health in Ayurveda. A strong Agni (digestive fire) ensures proper metabolism, while imbalances can lead to Ama (toxins) and digestive disorders.",
    concerns: [
      {
        title: "Acid Reflux & Heartburn (Amla Pitta)",
        description:
          "Acid reflux occurs when stomach acid moves up into the esophagus, causing a burning sensation in the chest (heartburn). Ayurveda links this to Pitta Dosha imbalance, aggravated by spicy, oily, and acidic foods.",
        approach: [
          "Avoid hot, sour, and fermented foods. Drink cool herbal teas like fennel (Saunf) and licorice (Mulethi).",
          "Eat meals on time and avoid lying down immediately after eating.",
          "Herbs: Amla, Guduchi, Yashtimadhu (Licorice) help soothe excess acidity.",
        ],
        image: acidRefluxImg,
        callToAction: "Personalized Plan? Book an Ayurvedic consultation for customized dietary & herbal recommendations."
      },
      {
        title: "Constipation & Indigestion (Vibandh & Ajirna)",
        description:
          "Constipation refers to infrequent or difficult bowel movements, often caused by Vata imbalance. Indigestion (Ajirna) happens when food isn't properly broken down, leading to bloating and discomfort.",
        approach: [
          "Increase fiber-rich foods like soaked raisins, ghee, and warm fluids.",
          "Regular meal timings and Abhyanga (self-massage with warm oil) to calm Vata.",
          "Herbs: Triphala, Isabgol (Psyllium husk), and castor oil for gentle relief.",
        ],
        image: constipationImg,
        callToAction: "Need expert advice? Consult our Ayurvedic doctor for a natural, dosha-based solution!"
      },
      {
        title: "Diarrhea & Loose Motions (Atisara)",
        description:
          "Frequent loose stools indicate an aggravated Pitta Dosha or Kapha Dosha. It can be due to infections, food intolerance, or weak digestion.",
        approach: [
          "Light, easy-to-digest foods like moong dal khichdi, buttermilk, and pomegranate juice.",
          "Rest and hydration are key. Avoid heavy, oily, and dairy-rich foods.",
          "Herbs: Bilva (Bael fruit), Kutaj (Holarrhena), and Pippali help restore gut balance.",
        ],
        image: "/images/Diarrhea & Loose Motions.jpeg",
        callToAction: "Experiencing recurring issues? Get a personalized Ayurvedic gut-healing plan from our experts."
      },
      {
        title: "Irritable Bowel Syndrome (IBS)",
        description:
          "IBS causes alternating constipation, diarrhea, bloating, and stomach cramps. Ayurveda links this to an imbalance in Vata Dosha, often triggered by stress, irregular eating, or improper food combinations.",
        approach: [
          "Follow a Satvic (light & fresh) diet with warm, well-cooked foods.",
          "Stress management through meditation and yoga is crucial.",
          "Herbs: Ashwagandha for stress, Triphala for digestion, and Brahmi for calming the mind.",
        ],
        image: ibsImg,
        callToAction: "Struggling with digestive discomfort? Get expert guidance for long-term gut health!"
      },
      {
        title: "Stomach Ulcers (Parinam Shoola)",
        description:
          "Ulcers are open sores in the stomach lining, often due to excessive Pitta Dosha, stress, or infection. They cause burning pain, nausea, and acid regurgitation.",
        approach: [
          "Cooling foods like coconut water, ghee, and soaked almonds. Avoid spicy, fried, and caffeine-based foods.",
          "Reduce stress through pranayama and maintain meal discipline.",
          "Herbs: Yashtimadhu (Licorice), Shatavari, and Aloe Vera help soothe the stomach lining.",
        ],
        image: ulcersImg,
        callToAction: "Need Ayurvedic healing? Consult an Ayurvedic expert for a tailored approach."
      },
    ],
  },

  "Respiratory Health": {
    title: "Respiratory Health in Ayurveda",
    description:
      "The respiratory system is governed by Prana Vayu (life force energy) and influenced by Kapha Dosha (mucus & moisture balance) and Vata Dosha (air & movement). Imbalances in these doshas can lead to chronic respiratory conditions. Ayurveda focuses on herbal remedies, dietary modifications, and lifestyle changes to strengthen the lungs, clear toxins, and restore breath balance.",
    concerns: [
      {
        title: "Asthma & Breathing Problems (Tamaka Shwasa)",
        description:
          "Asthma is a chronic lung condition that causes difficulty in breathing due to airway inflammation and mucus buildup. Ayurveda considers it a Kapha-Vata disorder, where excess mucus blocks airflow, and Vata creates spasms in the lungs.",
        approach: [
          "Diet: Avoid cold, heavy, and dairy-based foods. Consume warm herbal drinks like ginger-turmeric tea.",
          "Lifestyle: Steam inhalation with eucalyptus oil and Pranayama (breathing exercises) for lung strength.",
          "Herbs: Vasaka (Malabar Nut), Yashtimadhu (Licorice), Tulsi (Holy Basil) help open airways.",
        ],
        image: "/images/asthma.jpg",
        callToAction: "Struggling with asthma? Book a consultation to get a customized herbal plan!"
      },
      {
        title: "Chronic Cough & Cold (Kasa & Pratishaya)",
        description:
          "Frequent coughs and colds occur due to low immunity, seasonal changes, or Kapha-Vata imbalances. Coughing can be dry (Vata) or mucus-filled (Kapha), requiring different treatments.",
        approach: [
          "Diet: Warm, easy-to-digest meals. Avoid cold drinks and excess sweets.",
          "Lifestyle: Keep the body warm, do oil massage (Abhyanga) to balance Vata.",
          "Herbs: Sitopaladi Churna, Mulethi (Licorice), and Pippali (Long Pepper) help relieve congestion.",
        ],
        image: "/images/cough.jpg",
        callToAction: "Chronic cough troubling you? Get an expert Ayurvedic consultation for lasting relief!"
      },
      {
        title: "Sinusitis & Nasal Congestion (Peenas)",
        description:
          "Sinusitis is caused by Kapha imbalance, where mucus gets trapped in the sinuses, leading to headaches, congestion, and difficulty breathing.",
        approach: [
          "Diet: Avoid heavy, oily, and dairy-rich foods. Drink warm herbal teas with Tulsi & Ginger.",
          "Lifestyle: Neti Kriya (nasal cleansing with saline water) and steam inhalation help clear sinuses.",
          "Herbs: Trikatu (Ginger, Black Pepper, Pippali), Neem, and Dashmool work effectively.",
        ],
        image: "/images/sinu.jpg",
        callToAction: "Suffering from blocked sinuses? Consult an Ayurvedic expert for relief!"
      },
      {
        title: "Bronchitis & Chest Infections (Kasa Roga)",
        description:
          "Bronchitis occurs when the bronchial tubes in the lungs become inflamed, leading to persistent cough, phlegm, and breathing difficulties. It is caused by Kapha accumulation, cold exposure, or viral infections.",
        approach: [
          "Diet: Warm, light meals like moong dal soup and herbal tonics. Avoid fried foods and cold beverages.",
          "Lifestyle: Steam inhalation, chest massage with warm mustard oil, and gargling with turmeric water.",
          "Herbs: Vasaka, Tulsi, and Licorice help soothe the airways.",
        ],
        image: "/images/chestpain.jpg",
        callToAction: "Need long-term lung care? Get a personalized Ayurvedic treatment plan!"
      }
    ],
  },

  "Skin Care": {
    title: "Skin & Hair Care in Ayurveda",
    description:
      "Skin and hair reflect the balance of Pitta (heat), Kapha (moisture), and Vata (dryness) doshas. Imbalances can lead to conditions like acne, eczema, hair fall, and premature greying. Ayurveda treats these concerns holistically with diet, lifestyle changes, herbal formulations, and detox therapies for long-term healing rather than just temporary relief.",
    concerns: [
      {
        title: "Acne & Pimples (Yauvan Pidika)",
        description:
          "Acne occurs due to excessive Pitta dosha, which increases heat in the blood (Rakta dhatu) and leads to inflammation, pimples, and breakouts. Excessive oily foods, stress, and hormonal imbalance can worsen acne.",
        approach: [
          "Diet: Avoid spicy, fried, and dairy-rich foods. Eat cooling foods like cucumber, coconut water, and fresh fruits.",
          "Lifestyle: Wash face with rose water, apply sandalwood & turmeric paste for cooling.",
          "Herbs: Neem, Manjistha, and Aloe Vera help purify blood and clear acne.",
        ],
        image: "/images/skinacne.jpg",
        callToAction: "Struggling with breakouts? Get a personalized Ayurvedic skincare plan!"
      },
      {
        title: "Eczema & Dry Skin Issues (Vicharchika)",
        description:
          "Eczema is caused by Vata-Pitta imbalance, leading to dry, itchy, inflamed skin. Ayurvedic texts suggest it is a blood & liver disorder, which needs internal and external detoxification.",
        approach: [
          "Diet: Hydrating foods like ghee, coconut, and herbal teas; avoid excessive caffeine and processed foods.",
          "Lifestyle: Oil massage (Abhyanga) with coconut or almond oil before bathing. Use Aloe Vera gel for soothing skin.",
          "Herbs: Neem, Guduchi, and Triphala help detox the liver and reduce inflammation.",
        ],
        image: "/images/Eczema & Dry Skin Issues.jpeg",
        callToAction: "Dealing with chronic eczema? Consult an Ayurvedic expert for deep healing!"
      },
      {
        title: "Psoriasis & Skin Rashes (Kitibha)",
        description:
          "Psoriasis is a chronic autoimmune skin disorder caused by Vata-Kapha imbalance, leading to dry, scaly, and itchy patches. Stress, poor digestion, and toxins aggravate the condition.",
        approach: [
          "Diet: Follow a light detoxifying diet with bitter vegetables like bitter gourd, neem leaves, and turmeric milk. Avoid processed and non-vegetarian food.",
          "Lifestyle: Apply Aloe Vera & Turmeric paste, take oil baths with medicated sesame oil.",
          "Herbs: Triphala, Manjistha, and Bakuchi help cleanse the skin and blood.",
        ],
        image: "/images/psoriasis.jpg",
        callToAction: "Need holistic care for psoriasis? Book a consultation for Ayurvedic guidance!"
      },
      {
        title: "Dandruff & Hair Fall (Darunaka & Khalitya)",
        description:
          "Dandruff is caused by an imbalanced Kapha (excess oil) and Vata (dry scalp), leading to flakes, itching, and hair fall. Excess stress, pollution, and poor diet weaken hair roots.",
        approach: [
          "Diet: Include iron-rich foods like spinach, almonds, and sesame seeds. Reduce junk and sugary foods.",
          "Lifestyle: Use Bhringraj & Amla oil for scalp massage, and wash hair with herbal powders like Shikakai & Reetha.",
          "Herbs: Bhringraj, Brahmi, and Fenugreek strengthen hair roots and prevent fall.",
        ],
        image: "/images/Dandruff.jpg",
        callToAction: "Facing severe hair loss? Get a custom Ayurvedic hair care routine!"
      },
      {
        title: "Premature Greying of Hair (Palitya)",
        description:
          "Greying before age 30 is due to excessive Pitta, stress, and nutritional deficiencies. Ayurveda focuses on nourishing hair from within rather than chemical treatments.",
        approach: [
          "Diet: Eat Amla, curry leaves, black sesame seeds, and almonds. Avoid excess caffeine and fried food.",
          "Lifestyle: Massage scalp with Bhringraj & coconut oil for melanin restoration. Reduce stress with meditation & yoga.",
          "Herbs: Amla, Brahmi, and Ashwagandha boost hair pigmentation.",
        ],
        image: "/images/Premature Greying of Hair.jpeg",
        callToAction: "Want to restore natural hair color? Consult our Ayurvedic specialists today!"
      }
    ],
  },

  "Joint and Bone Health": {
    title: "Joint & Bone Health in Ayurveda",
    description:
      "Ayurveda considers joint and bone health as a balance of Vata (movement), Pitta (metabolism), and Kapha (lubrication). With aging, Vata increases, causing stiffness, pain, and degeneration. Poor digestion, toxin accumulation (Ama), and weak bones (Asthi Dhatu Kshaya) contribute to conditions like arthritis, back pain, and osteoporosis. Ayurvedic treatments focus on deep nourishment, detoxification, and strengthening bones & joints naturally.",
    concerns: [
      {
        title: "Arthritis & Joint Pain (Sandhivata & Amavata)",
        description:
          "Arthritis is caused by Vata imbalance, leading to pain, stiffness, swelling, and reduced mobility. If toxins (Ama) accumulate in joints, it worsens inflammation.",
        approach: [
          "Diet: Eat warm, nourishing foods like soups, ghee, and anti-inflammatory spices (turmeric, ginger). Avoid cold & processed foods.",
          "Lifestyle: Daily oil massage (Abhyanga) with Mahanarayan oil reduces pain and stiffness. Regular gentle yoga & stretching improve flexibility.",
          "Herbs: Ashwagandha, Guggulu, and Shallaki (Boswellia) reduce inflammation & strengthen joints.",
        ],
        image: "/images/jointpain.jpg",
        callToAction: "Struggling with joint pain? Get a customized Ayurvedic arthritis plan!"
      },
      {
        title: "Back Pain & Sciatica (Kateegraham & Gridhrasi)",
        description:
          "Back pain and sciatica are caused by excess Vata, leading to nerve compression, muscle stiffness, and pain radiating to legs. Long sitting hours, poor posture, and weak digestion aggravate it.",
        approach: [
          "Diet: Include calcium-rich foods (sesame seeds, ragi, dairy). Avoid junk food and excessive caffeine.",
          "Lifestyle: Warm oil massages with Dhanwantharam oil, gentle stretching, and Panchakarma therapy (Kati Basti) for nerve healing.",
          "Herbs: Dashmool, Ashwagandha, and Shatavari help strengthen nerves and reduce stiffness.",
        ],
        image: "/images/backpain.jpg",
        callToAction: "Need relief from chronic back pain? Book an Ayurvedic consultation today!"
      },
      {
        title: "Osteoporosis (Asthi Kshaya - Weak Bones)",
        description:
          "Osteoporosis happens due to Vata & Pitta imbalance, leading to bone loss, brittleness, and fractures. Low calcium, improper digestion, and aging speed up bone depletion.",
        approach: [
          "Diet: Increase calcium & mineral intake (ragi, sesame, figs, dates, dairy). Avoid processed & acidic foods.",
          "Lifestyle: Oil massage (Abhyanga) with sesame oil, regular mild weight-bearing exercises like yoga.",
          "Herbs: Hadjod (Cissus quadrangularis), Arjuna, and Ashwagandha boost bone density & strength.",
        ],
        image: "/images/Osteoporosis.jpg",
        callToAction: "Worried about weak bones? Get expert Ayurvedic guidance for bone health!"
      },
      {
        title: "Rheumatism & Muscle Stiffness (Vata-Rakta)",
        description:
          "Rheumatism is linked to Ama (toxins) accumulation & aggravated Vata, causing stiffness, muscle pain, and fatigue. Cold weather and poor digestion worsen symptoms.",
        approach: [
          "Diet: Eat warming, easily digestible foods (soups, ghee, turmeric milk). Avoid cold, stale, and heavy foods.",
          "Lifestyle: Steam therapy (Swedana), warm oil massages, and light exercise improve circulation.",
          "Herbs: Guggulu, Rasna, and Guduchi cleanse toxins and support joint flexibility.",
        ],
        image: "/images/Rheumatism.jpg",
        callToAction: "Suffering from chronic stiffness? Start an Ayurvedic detox today!"
      }
    ],
  },

  "Cardiovascular Health": {
    title: "Ayurvedic Approach to Heart & Blood Circulation Health",
    description:
      "In Ayurveda, heart health is linked to the balance of Rasa Dhatu (plasma), Rakta Dhatu (blood), and Ojas (vital energy). Imbalances in Vata (circulatory movement), Pitta (metabolism), and Kapha (cholesterol buildup) lead to heart issues like high blood pressure, cholesterol, and poor circulation. Ayurvedic treatments focus on detoxifying the blood, strengthening the heart, and improving circulation naturally.",
    concerns: [
      {
        title: "High Blood Pressure (Hypertension - Rakta Gata Vata)",
        description:
          "Hypertension occurs when Vata imbalance increases pressure in blood vessels, often due to stress, poor diet, sedentary lifestyle, and toxin buildup (Ama). If left unchecked, it can lead to heart disease and strokes.",
        approach: [
          "Diet: Consume cooling & hydrating foods (coconut water, pomegranate, beetroot, and coriander water). Avoid salty, fried, and spicy foods.",
          "Lifestyle: Practice deep breathing (Pranayama), meditation, and daily walks to calm the mind.",
          "Herbs: Arjuna, Brahmi, and Jatamansi reduce stress and regulate blood pressure naturally.",
        ],
        image: "/images/bloodpressure.jpg",
        callToAction: "Struggling with high BP? Get a natural Ayurvedic heart health plan!"
      },
      {
        title: "High Cholesterol & Blocked Arteries (Medo Roga & Dhamani Pratichaya)",
        description:
          "Excess Kapha (fat accumulation) leads to plaque buildup in arteries, slowing circulation and increasing the risk of heart attacks. Poor digestion and weak Agni (metabolic fire) contribute to cholesterol imbalance.",
        approach: [
          "Diet: Increase fiber-rich, light foods (moong dal, leafy greens, garlic, ginger). Avoid fried foods, excessive dairy, and heavy meats.",
          "Lifestyle: Regular exercise, yoga, and detoxification therapies (Panchakarma) help clear arteries.",
          "Herbs: Triphala, Guggulu, and Arjuna help dissolve plaque and regulate lipid metabolism.",
        ],
        image: "/images/cholesterol.jpg",
        callToAction: "Concerned about cholesterol? Try a heart-cleansing Ayurvedic program!"
      },
      {
        title: "Poor Blood Circulation (Rakta Dushti & Vyana Vayu Imbalance)",
        description:
          "Poor circulation is caused by weak Vyana Vayu (circulatory energy), toxin buildup, and sluggish blood flow, leading to cold hands & feet, varicose veins, fatigue, and numbness.",
        approach: [
          "Diet: Eat warm, circulation-boosting foods (ginger tea, black pepper, cinnamon, and nuts). Avoid cold & heavy foods.",
          "Lifestyle: Daily self-massage (Abhyanga) with warm sesame or mustard oil stimulates circulation.",
          "Herbs: Ashwagandha, Guggulu, and Manjistha strengthen blood flow and purify the blood.",
        ],
        image: "/images/Poor Blood Circulation.jpg",
        callToAction: "Feeling tired or sluggish? Improve circulation with an Ayurvedic plan!"
      }
    ],
  },

  "Mental Health and Wellness": {
    title: "Ayurvedic Approach to Stress, Anxiety & Mental Wellness",
    description:
      "In Ayurveda, mental health is governed by Sattva (clarity), Rajas (agitation), and Tamas (dullness) and is deeply connected to the balance of Vata, Pitta, and Kapha doshas. Mental disorders arise due to excess Vata (restlessness), aggravated Pitta (anger, frustration), or excessive Kapha (lethargy, depression). Ayurveda focuses on calming the mind, nourishing the nervous system, and promoting emotional balance.",
    concerns: [
      {
        title: "Anxiety & Depression (Chittodvega & Vishada Roga)",
        description:
          "Anxiety (Chittodvega) is caused by excessive Vata, leading to overthinking, nervousness, and restlessness. Depression (Vishada) occurs due to an imbalance in Kapha (heaviness, lack of motivation) and Pitta (self-criticism, burnout).",
        approach: [
          "Diet: Eat grounding and nourishing foods (warm milk with nutmeg, almonds, dates, ghee). Avoid caffeine, refined sugar, and processed foods.",
          "Lifestyle: Daily oil massage (Abhyanga) with sesame oil, yoga, and meditation calm the nervous system.",
          "Herbs: Brahmi, Ashwagandha, and Shankhpushpi help relieve anxiety and uplift mood.",
        ],
        image: "/images/anxiety.jpg",
        callToAction: "Feeling anxious or low? Try an Ayurvedic mind-calming therapy!"
      },
      {
        title: "Insomnia & Sleep Disorders (Nidranasha)",
        description:
          "Insomnia is caused by excessive Vata (overactive mind), aggravated Pitta (racing thoughts at night), or Kapha imbalance (disturbed sleep cycles). It leads to fatigue, irritability, and poor focus.",
        approach: [
          "Diet: Warm turmeric milk, chamomile tea, and dates before bedtime. Avoid heavy meals, caffeine, and spicy foods at night.",
          "Lifestyle: Follow a fixed sleep schedule, use calming essential oils (lavender, sandalwood), and practice Shirodhara (forehead oil therapy).",
          "Herbs: Tagara (Indian valerian), Brahmi, and Jatamansi promote deep and restful sleep.",
        ],
        image: "/images/insomniaS.jpg",
        callToAction: "Struggling with sleep? Try Ayurveda's natural sleep therapy!"
      },
      {
        title: "Stress Management (Manasik Santulan)",
        description:
          "Stress occurs when Vata-Pitta energy is imbalanced, leading to mental burnout, fatigue, irritability, and weakened immunity. Chronic stress can cause lifestyle disorders like high blood pressure, digestive issues, and insomnia.",
        approach: [
          "Diet: Eat cooling and nourishing foods (coconut water, ghee, fresh fruits). Avoid spicy, fried, and acidic foods.",
          "Lifestyle: Practice daily breathing exercises (Pranayama), Yoga Nidra, and Abhyanga (self-massage) for relaxation.",
          "Herbs: Ashwagandha, Tulsi, and Gotu Kola reduce stress and promote emotional balance.",
        ],
        image: "/images/Stress.jpg",
        callToAction: "Feeling overwhelmed? Start Ayurvedic stress relief today!"
      },
      {
        title: "Memory & Concentration Improvement (Medhya Rasayana Therapy)",
        description:
          "Weak memory, lack of focus, and brain fog are caused by Vata imbalance (poor nervous coordination), weak Agni (low digestive fire affecting nutrient absorption), and toxin buildup in the brain.",
        approach: [
          "Diet: Eat brain-boosting foods (walnuts, soaked almonds, Brahmi tea, ghee, dates). Avoid junk food, carbonated drinks, and excessive sugar.",
          "Lifestyle: Practice Trataka (candle gazing), meditation, and Brahmi oil head massage for mental clarity.",
          "Herbs: Brahmi, Shankhpushpi, and Jyotishmati improve cognitive function and enhance memory.",
        ],
        image: "/images/Memory  Improvement.jpg",
        callToAction: "Want sharper focus & better memory? Boost your brain naturally with Ayurveda!"
      }
    ],
  },

  "Metabolic and Endocrine Health": {
    title: "Ayurvedic Approach to Metabolism & Hormonal Health",
    description: "In Ayurveda, metabolism and hormonal balance are controlled by Agni (digestive fire), Ojas (vital energy), and the balance of Vata, Pitta, and Kapha doshas. Metabolic disorders arise due to weak digestion, toxin accumulation (Ama), stress, and an imbalance in the body's natural rhythms. Ayurvedic treatments focus on balancing Agni, detoxifying the body, and using herbs & lifestyle changes to regulate hormones naturally.",
    concerns: [
      {
        title: "Diabetes & Blood Sugar Control (Madhumeha)",
        description: "Diabetes (Madhumeha) is linked to an imbalance in Kapha and Vata doshas, leading to weakened digestion, poor insulin regulation, and excess sugar in the blood. Ayurveda views diabetes as a lifestyle disorder caused by improper diet, stress, and lack of physical activity.",
        approach: [
          "Diet: Eat low-glycemic foods (bitter gourd, fenugreek seeds, amla, turmeric). Avoid processed sugar, white flour, and excess carbohydrates.",
          "Lifestyle: Daily morning walks, yoga (especially Surya Namaskar), and stress management help regulate blood sugar.",
          "Herbs: Gudmar (Sugar Destroyer), Vijaysar, and Jamun help control blood sugar levels naturally."
        ],
        image: diabetesImg,
        callToAction: "Struggling with diabetes? Try Ayurveda's natural sugar-balancing therapy!"
      },
      {
        title: "Thyroid Disorders (Galaganda & Gandamala)",
        description: "Thyroid disorders occur due to imbalance in Kapha (hypothyroidism - weight gain, lethargy) or Pitta (hyperthyroidism - weight loss, restlessness). Poor metabolism, stress, and iodine deficiency contribute to thyroid issues.",
        approach: [
          "Diet: Eat iodine-rich foods (seaweed, pink Himalayan salt) and metabolism-boosting spices (cumin, coriander, black pepper). Avoid processed foods and excessive dairy.",
          "Lifestyle: Perform Ujjayi Pranayama (breathwork), and maintain a regular sleep cycle.",
          "Herbs: Ashwagandha, Guggulu, and Kanchanar Guggulu help regulate thyroid function naturally."
        ],
        image: "/images/thyroidperson.jpg",
        callToAction: "Thyroid imbalance? Get Ayurvedic solutions for hormonal balance!"
      },
      {
        title: "Weight Loss & Metabolism Boost (Sthoulya Chikitsa)",
        description: "Weight gain occurs due to slow Agni (digestive fire), excess Kapha (heaviness, sluggishness), and toxin accumulation (Ama). A poor diet, stress, and lack of movement worsen metabolism.",
        approach: [
          "Diet: Eat warm, light meals (moong dal, green vegetables, buttermilk) and avoid fried, sugary, and heavy foods.",
          "Lifestyle: Daily self-massage (Udwarthanam) with herbal powders, morning yoga, and intermittent fasting (Ayurvedic Upavasa) enhance metabolism.",
          "Herbs: Triphala, Guggulu, and Punarnava help in natural weight loss and detoxification."
        ],
        image: "/images/Weight loss.jpg",
        callToAction: "Want to shed extra weight? Try Ayurvedic weight management therapy!"
      },
      {
        title: "PCOS/PCOD & Menstrual Issues (Stree Roga)",
        description: "Polycystic Ovary Syndrome (PCOS) and irregular periods occur due to excess Kapha (hormonal imbalance, cyst formation), aggravated Vata (irregular cycles), and high Pitta (inflammation, acne, mood swings). Ayurveda treats PCOS by balancing hormones, improving digestion, and reducing stress.",
        approach: [
          "Diet: Eat fiber-rich foods (flaxseeds, whole grains, soaked almonds) and hormone-balancing spices (cinnamon, turmeric, fennel). Avoid junk food, dairy, and excess caffeine.",
          "Lifestyle: Regular exercise, yoga (Baddha Konasana, Malasana), and meditation help regulate periods.",
          "Herbs: Shatavari, Ashoka, and Lodhra restore hormonal balance and support reproductive health."
        ],
        image: "/images/period pain.jpg",
        callToAction: "Struggling with PCOS? Get natural Ayurvedic support for your cycle!"
      }
    ]
  },

  "Immune Support": {
    title: "Ayurvedic Approach to Immune System Support",
    description: "In Ayurveda, Vyadhikshamatva (immunity) is the body's natural defense system governed by Ojas (vital energy), Agni (digestive fire), and a balance of Vata, Pitta, and Kapha doshas. A strong immune system prevents infections, allergies, and chronic diseases. Ayurvedic immunity-boosting focuses on herbs, detoxification, balanced nutrition, and lifestyle practices.",
    concerns: [
      {
        title: "General Immunity Boosting (Vyadhikshamatva Vardhana)",
        description: "A weak immune system results from poor digestion (low Agni), toxin buildup (Ama), and an imbalance in Ojas. Frequent illnesses, low energy, and slow recovery indicate poor immunity.",
        approach: [
          "Diet: Eat warm, nourishing foods (ghee, turmeric milk, seasonal fruits) and avoid junk food, excess sugar, and cold drinks.",
          "Lifestyle: Daily morning sunlight exposure, yoga (Surya Namaskar), and meditation enhance Ojas.",
          "Herbs: Chyawanprash, Ashwagandha, and Giloy (Amrita) naturally boost immunity."
        ],
        image: "/images/Immunity Boosting.jpg",
        callToAction: "Want to strengthen your immunity? Try Ayurveda's Ojas-enhancing therapy!"
      },
      {
        title: "Frequent Allergies & Sinus Issues (Pratisyaya & Nasaroga)",
        description: "Allergies and sinus problems occur due to Kapha imbalance (excess mucus), aggravated Vata (dryness, sneezing), and weak Agni. Dust, pollen, food intolerance, and seasonal changes worsen allergies.",
        approach: [
          "Diet: Eat warm, light foods (ginger tea, soups) and avoid cold, dairy, and fried foods.",
          "Lifestyle: Daily nasal cleansing (Neti Kriya) and steam inhalation with eucalyptus oil reduce sinus congestion.",
          "Herbs: Turmeric, Tulsi (Holy Basil), and Mulethi (Licorice) provide natural allergy relief."
        ],
        image: "/images/Frequent Allergies & Sinus Issues.jpg",
        callToAction: "Struggling with allergies? Get Ayurvedic remedies for long-term relief!"
      },
      {
        title: "Autoimmune Conditions (Ama-Related Disorders)",
        description: "Autoimmune diseases occur when the immune system mistakenly attacks the body's cells due to toxin buildup (Ama), aggravated Pitta (inflammation), and weak Agni. Ayurveda focuses on detoxifying the body and restoring immune balance.",
        approach: [
          "Diet: Eat anti-inflammatory foods (turmeric, ginger, green leafy vegetables) and avoid processed foods, excessive dairy, and nightshades.",
          "Lifestyle: Panchakarma detox, stress management, and regular Pranayama (breathwork) support immune balance.",
          "Herbs: Guduchi (Giloy), Ashwagandha, and Amla help regulate immunity naturally."
        ],
        image: "/images/autoimmuneS.jpg",
        callToAction: "Managing an autoimmune condition? Ayurveda provides holistic, side-effect-free solutions!"
      }
    ]
  },

  "Women's Health": {
    title: "Ayurvedic Approach to Women's Health",
    description: "In Ayurveda, women's health is deeply connected to Rasa Dhatu (nutrition), Shukra Dhatu (reproductive tissues), and the balance of Vata, Pitta, and Kapha doshas. Women go through various hormonal transitions, including menstruation, pregnancy, and menopause, which need holistic care. Ayurveda offers herbs, diet, and lifestyle practices to naturally balance hormones, support reproductive health, and enhance overall well-being.",
    concerns: [
      {
        title: "Menstrual Pain & Irregular Periods (Kashtartava & Anartava)",
        description: "Painful or irregular periods result from imbalanced Vata (causing cramps), Pitta (excess heat leading to heavy flow), or Kapha (blockages causing delayed periods). Stress, poor diet, and a sedentary lifestyle can worsen symptoms.",
        approach: [
          "Diet: Eat warm, cooked foods (moong dal, sesame seeds, jaggery) and avoid spicy, processed, and cold foods.",
          "Lifestyle: Gentle yoga (Supta Baddha Konasana), Abhyanga (oil massage), and warm compresses ease cramps.",
          "Herbs: Ashoka, Shatavari, and Ajwain (Carom seeds) help regulate cycles and reduce pain."
        ],
        image: "/images/irpain.jpg",
        callToAction: "Experiencing period issues? Try Ayurveda's natural hormone-balancing therapy!"
      },
      {
        title: "Menopause & Hormonal Changes (Rajonivritti)",
        description: "Menopause is a natural transition marked by hot flashes, mood swings, insomnia, and bone loss. Ayurveda views it as a shift from Pitta dominance to Vata dominance, requiring nourishment and hormonal balance.",
        approach: [
          "Diet: Increase healthy fats (ghee, almonds, flaxseeds) and avoid caffeine, alcohol, and processed sugar.",
          "Lifestyle: Daily self-massage (warm sesame oil), meditation, and gentle stretching help ease symptoms.",
          "Herbs: Shatavari, Brahmi, and Licorice naturally support hormonal balance."
        ],
        image: "/images/hrchanges.jpg",
        callToAction: "Going through menopause? Get personalized Ayurvedic remedies for smoother transitions!"
      },
      {
        title: "Fertility Support & Pregnancy Care (Garbhasthapana & Garbhini Paricharya)",
        description: "Ayurveda focuses on preparing the body for conception (Sutika Paricharya) and ensuring a healthy pregnancy. Infertility can arise due to weak Agni (digestion), stress, toxin accumulation (Ama), and dosha imbalances.",
        approach: [
          "Diet: Eat fertility-enhancing foods (milk, saffron, almonds, dates) and avoid junk food and excessive stress.",
          "Lifestyle: Preconception Panchakarma detox, daily yoga (Butterfly Pose), and deep breathing improve fertility.",
          "Herbs: Shatavari, Ashwagandha, and Guduchi nourish reproductive tissues and support pregnancy."
        ],
        image: "/images/Fertility.jpg",
        callToAction: "Planning for a baby? Ayurveda offers a natural path to fertility and pregnancy wellness!"
      },
      {
        title: "Vaginal Health & Infections (Yoniroga)",
        description: "Recurring vaginal infections, dryness, and discomfort arise due to poor hygiene, excess Pitta (heat), and imbalanced vaginal flora. Ayurveda focuses on restoring natural balance and preventing infections.",
        approach: [
          "Diet: Eat cooling foods (coconut water, aloe vera, yogurt) and avoid spicy, fried, and sugary foods.",
          "Lifestyle: Maintain intimate hygiene, practice Yoni Prakshalana (herbal washes), and wear breathable cotton clothing.",
          "Herbs: Neem, Triphala, and Lodhra help cleanse and maintain vaginal health."
        ],
        image: "/images/vinfection.jpg",
        callToAction: "Dealing with vaginal discomfort? Ayurveda provides gentle, effective care!"
      }
    ]
  },

  "Men's Health": {
    title: "Ayurvedic Approach to Men's Health",
    description: "Ayurveda views men's health as a balance of Agni (digestive fire), Ojas (vital energy), and the three doshas (Vata, Pitta, Kapha). Factors like stress, poor diet, hormonal imbalances, and lifestyle habits affect sexual wellness, prostate health, and hair strength. Ayurvedic herbs, therapies, and diet modifications can naturally restore vitality and promote long-term well-being.",
    concerns: [
      {
        title: "Sexual Health & Stamina Boosting (Shukra Dhatu Vriddhi)",
        description: "Low stamina, reduced libido, and sexual health concerns arise due to weakened Shukra Dhatu (reproductive tissues), stress, and poor blood circulation. Ayurveda focuses on strengthening Ojas (vital energy) and Shukra (semen quality).",
        approach: [
          "Diet: Increase nuts, dairy, dates, saffron, and ghee while avoiding alcohol, smoking, and junk food.",
          "Lifestyle: Regular exercise, yoga (Kegel exercises, Ashwini Mudra), and adequate sleep improve sexual stamina.",
          "Herbs: Ashwagandha, Shilajit, Safed Musli, and Kaunch Beej enhance vigor and testosterone levels."
        ],
        image: "/images/staminaBoostings.jpg",
        callToAction: "Struggling with energy and stamina? Ayurveda offers natural performance enhancement!"
      },
      {
        title: "Prostate Health (Vasti Roga & Mutravaha Srotas Shuddhi)",
        description: "Prostate issues like BPH (Benign Prostatic Hyperplasia), frequent urination, and inflammation result from Kapha imbalance and toxin buildup. Ayurveda focuses on urinary health, inflammation reduction, and hormone balance.",
        approach: [
          "Diet: Eat pumpkin seeds, barley, pomegranate, and flaxseeds while avoiding processed foods and excess salt.",
          "Lifestyle: Avoid holding urine for long, practice deep squats, and stay hydrated.",
          "Herbs: Gokshura, Punarnava, Varuna, and Shatavari support prostate health and improve urine flow."
        ],
        image: "/images/Prostate Health 1.jpg",
        callToAction: "Facing prostate concerns? Ayurveda ensures long-term relief with natural solutions!"
      },
      {
        title: "Hair Loss & Baldness (Khalitya & Palitya)",
        description: "Hair fall, thinning, and baldness are linked to Pitta imbalance, high stress, nutritional deficiencies, and poor scalp health. Ayurveda aims to cool the body, strengthen hair roots, and improve blood circulation to the scalp.",
        approach: [
          "Diet: Include amla, curry leaves, sesame seeds, and coconut water while avoiding spicy, fried, and excessive salty foods.",
          "Lifestyle: Scalp massage (Shiro Abhyanga) with Bhringraj oil, stress reduction, and adequate hydration help reduce hair fall.",
          "Herbs: Bhringraj, Brahmi, Amla, and Fenugreek nourish hair follicles and prevent premature greying."
        ],
        image: "/images/Hairlos.jpg",
        callToAction: "Struggling with hair loss? Ayurveda helps restore hair strength and volume naturally!"
      }
    ]
  },

  "Liver and Kidney Health": {
    title: "Ayurvedic Approach to Kidney & Liver Health",
    description: "Ayurveda views Kidneys (Vrikka) and Liver (Yakrit) as vital detoxifying organs, responsible for blood purification, metabolic balance, and toxin elimination. Any imbalance in the doshas, especially Pitta (heat & metabolism), Kapha (mucus & fat), and Vata (dryness & filtration), can lead to issues like kidney stones, liver infections, or toxin buildup. Ayurveda offers natural herbs, Panchakarma therapies, and dietary guidelines to restore organ function and prevent long-term damage.",
    concerns: [
      {
        title: "Kidney Stones & Urinary Issues (Vrikka Ashmari & Mutravaha Srotas Vikara)",
        description: "Kidney stones form due to high uric acid levels, dehydration, and excess calcium oxalate deposits. Ayurveda focuses on breaking stones naturally, improving urine flow, and reducing pain & inflammation.",
        approach: [
          "Diet: Drink plenty of barley water, coconut water, and lemon juice while avoiding oxalate-rich foods like spinach, tomatoes, and excess dairy.",
          "Lifestyle: Stay hydrated, avoid holding urine for long, and practice mild yoga stretches.",
          "Herbs: Gokshura (Tribulus terrestris) Improves urinary flow and dissolves stones, Varuna (Crataeva nurvala) - Prevents stone formation and relieves pain, Punarnava (Boerhavia diffusa) - Natural diuretic that flushes toxins."
        ],
        image: "/images/kidneystone.jpg",
        callToAction: "Suffering from kidney stones? Ayurveda provides safe, natural stone removal therapies! Consult an Ayurvedic expert today."
      },
      {
        title: "Liver Detox & Fatty Liver Treatment (Yakrit Shodhana & Medoroga Chikitsa)",
        description: "A sluggish liver, fatty liver, or toxin overload can result from poor digestion, excessive alcohol, high-fat diets, and stress. Ayurveda aims to restore liver function, promote bile flow, and eliminate toxins naturally.",
        approach: [
          "Diet: Eat bitter greens (karela, methi), turmeric, beetroot, and papaya while avoiding fried foods, alcohol, and excess sugar.",
          "Lifestyle: Practice morning detox drinks (warm water with lemon & turmeric), engage in light exercises like Surya Namaskar to stimulate digestion.",
          "Herbs: Bhumyamalaki (Phyllanthus niruri) Best for liver detox and hepatitis, Kutki (Picrorhiza kurroa) - Enhances bile production and detoxifies the liver, Amla (Indian Gooseberry) - Restores liver strength and removes toxins."
        ],
        image: "/images/Fatty Liver Treatment.png",
        callToAction: "Want a healthier liver? Ayurveda offers gentle but powerful detox solutions! Start your liver cleansing journey today."
      },
      {
        title: "Hepatitis & Liver Infections (Yakrit Vikara & Pitta Shaman Chikitsa)",
        description: "Hepatitis is an inflammation of the liver caused by viruses (Hepatitis A, B, C), poor digestion, and toxin accumulation. Ayurveda focuses on boosting immunity, reducing liver inflammation, and cleansing blood impurities.",
        approach: [
          "Diet: Avoid heavy meats, alcohol, and processed foods. Consume turmeric milk, neem juice, and fresh fruits like pomegranate & apples.",
          "Lifestyle: Oil pulling with coconut oil helps eliminate toxins from the system, while Pranayama (deep breathing) & meditation reduce stress, which can aggravate liver disorders.",
          "Herbs: Kalmegh (Andrographis paniculata) A powerful antiviral & liver tonic, Guduchi (Tinospora cordifolia) - Boosts immunity and fights infections, Neem (Azadirachta indica) - Purifies blood and reduces liver inflammation."
        ],
        image: "/images/Liver Infections.jpeg",
        callToAction: "Struggling with hepatitis or liver infection? Ayurveda provides a holistic healing approach! Take the first step towards natural recovery."
      }
    ]
  },

  "Eye Health": {
    title: "Ayurvedic Approach to Eye & Vision Health",
    description: "In Ayurveda, the eyes (Netra) are governed by Pitta dosha, especially Alochaka Pitta, which controls vision. Imbalances in Pitta, along with Vata (dryness) and Kapha (mucus accumulation), can lead to eye strain, poor vision, infections, and night blindness. Ayurveda focuses on cooling the eyes, improving circulation, and strengthening the optic nerves through diet, lifestyle, and herbal remedies.",
    concerns: [
      {
        title: "Dry Eyes & Eye Strain (Shushka Netra & Drishti Kshaya)",
        description: "Excessive screen time, pollution, and poor hydration can cause burning, redness, and dryness in the eyes. Ayurveda aims to lubricate the eyes, relax strained muscles, and restore moisture balance.",
        approach: [
          "Diet: Eat ghee, almonds, carrots, and leafy greens to nourish eye tissues. Avoid excess spicy, fried, and processed foods that increase Pitta.",
          "Lifestyle: Follow the 20-20-20 Rule (Every 20 minutes, look 20 feet away for 20 seconds). Blink often to naturally lubricate the eyes. Wash eyes with rose water or apply cotton pads soaked in Triphala water.",
          "Herbs & Remedies: Netra Tarpana (Ghee Eye Therapy) strengthens and nourishes dry eyes. Triphala Ghrita (Herbal Ghee) improves eye moisture & reduces strain. Anu Tailam (Herbal Nasal Drops) lubricates the eyes through nasal therapy."
        ],
        image: "/images/dry eye.jpg",
        callToAction: "Tired of dry, strained eyes? Ayurveda restores natural eye hydration!"
      },
      {
        title: "Weak Vision & Night Blindness (Drishti Mandya & Nyctalopia)",
        description: "Weak vision results from deficiency in eye-nourishing nutrients, aging, and excess heat in the body. Night blindness is often caused by Vitamin A deficiency and poor retinal function. Ayurveda focuses on strengthening optic nerves and enhancing clarity of vision.",
        approach: [
          "Diet: Eat Amla (Indian gooseberry), carrot juice, walnuts, and cow’s ghee to boost eye health. Avoid excess salt, caffeine, and processed foods, which worsen vision problems.",
          "Lifestyle: Practice the palming technique—rub hands together and place over closed eyes for relaxation. Sun gazing (Surya Trataka) helps strengthen vision by gently looking at the rising sun for a few seconds.",
          "Herbs & Remedies: Triphala Churna (Herbal Eye Cleanser) soaked in water overnight helps wash eyes. Brahmi & Shankhapushpi boost memory & eye clarity. Bilberry & Saffron Extracts support retinal function & night vision."
        ],
        image: "/images/weak eyes.jpg",
        callToAction: "Want sharper, clearer vision? Ayurveda naturally enhances eye strength!"
      },
      {
        title: "Conjunctivitis & Eye Infections (Abhishyanda & Netra Srava)",
        description: "Conjunctivitis (pink eye) and eye infections occur due to dust, bacteria, pollution, and Pitta imbalance. Ayurveda works on reducing inflammation, clearing infections, and soothing irritation naturally.",
        approach: [
          "Diet: Consume cooling foods like cucumber, coriander water, and fresh coconut water. Avoid spicy, fermented, and fried foods, which worsen eye infections.",
          "Lifestyle: Wash eyes with sterile Triphala water to clear mucus and redness. Avoid touching/rubbing eyes to prevent spreading infection.",
          "Herbs & Remedies: Rose water eye drops cool and reduce redness. Neem & Turmeric decoction is a natural antiseptic wash for eye infections. Coriander seed eye wash reduces swelling & irritation."
        ],
        image: "/images/Eye Infections.jpeg",
        callToAction: "Struggling with eye infections? Ayurveda provides natural relief without side effects!"
      }
    ]
  },

  "Oral Health": {
    title: "Ayurvedic Approach to Oral Health",
    description:
      "In Ayurveda, oral health is linked to 'Mukha Swasthya' (mouth hygiene) and is governed by all three doshas: Kapha affects gums and saliva production, Pitta influences inflammation and ulcers, and Vata impacts dryness and tooth sensitivity. Imbalances can lead to gum diseases, cavities, bad breath, and ulcers. Ayurveda emphasizes herbal oral care, oil pulling, and dietary changes for long-lasting dental health.",
    concerns: [
      {
        title: "Gum Disease & Bleeding Gums (Danta Roga & Sheetada)",
        description:
          "Bleeding, swollen, and receding gums are often caused by plaque buildup, poor oral hygiene, Pitta imbalance, and excessive spicy or acidic foods. Ayurveda focuses on strengthening gums, reducing inflammation, and maintaining oral hygiene.",
        approach: [
          "Diet: Increase calcium-rich foods like sesame seeds, almonds, and dairy. Avoid excess sugar, acidic foods, and alcohol.",
          "Lifestyle: Practice oil pulling with sesame or coconut oil daily. Massage gums with Triphala powder or honey.",
          "Herbs & Remedies: Use Babool (Acacia bark) & Neem twig brushing. Rinse with Triphala decoction. Apply Clove oil to stop bleeding."
        ],
        image: "/images/gumbleeding.jpeg",
        callToAction: "Struggling with bleeding gums? Ayurveda heals them naturally!"
      },
      {
        title: "Tooth Decay & Cavities (Danta Shaithilya & Krimi Danta)",
        description:
          "Cavities occur due to bacterial infection, poor diet, and weak enamel. Ayurveda aims to strengthen teeth, remove toxins, and prevent decay naturally.",
        approach: [
          "Diet: Consume calcium-rich foods like ragi, milk, and leafy greens. Avoid processed foods, excess sugar, and carbonated drinks.",
          "Lifestyle: Use oil pulling to prevent plaque and decay. Brush with herbal tooth powders like Neem, Babool, and Clove.",
          "Herbs & Remedies: Apply Babool bark & Clove powder paste. Rinse with Triphala & Neem decoction. Massage with Rock salt & Mustard oil."
        ],
        image: "/images/teeth cavity.jpeg",
        callToAction: "Prevent cavities with Ayurvedic oral care!"
      },
      {
        title: "Bad Breath & Mouth Ulcers (Mukha Durgandha & Mukhapaka)",
        description:
          "Bad breath (Halitosis) and mouth ulcers occur due to poor digestion, excess heat (Pitta imbalance), and bacterial growth. Ayurveda helps cool the mouth, detoxify, and improve digestion for fresh breath and ulcer relief.",
        approach: [
          "Diet: Eat cooling foods like cucumber, coconut water, and fennel seeds. Avoid onion, garlic, alcohol, and smoking.",
          "Lifestyle: Chew fennel seeds or cardamom after meals. Rinse mouth with Triphala or mint water daily.",
          "Herbs & Remedies: Apply Licorice root & Mulethi paste. Use Aloe vera & Honey gel for ulcer relief. Chew Clove & Cardamom for fresh breath."
        ],
        image: "/images/Mouth Ulcers.png",
        callToAction: "Struggling with bad breath or ulcers? Ayurveda restores oral freshness!"
      }
    ]
  },

  "General Wellness": {
    title: "Ayurvedic Approach to General Wellness & Detox",
    description:
      "In Ayurveda, 'Swasthya Rakshan' (maintaining health) is as important as treating diseases. Wellness and detoxification focus on removing toxins (Ama), rejuvenating tissues (Rasayana), and balancing doshas for a vibrant, disease-free life.",
    concerns: [
      {
        title: "Full Body Detox & Cleansing (Ama Nivarana & Shodhana)",
        description:
          "Over time, toxins (Ama) accumulate in the body due to poor digestion, pollution, stress, and processed foods. This leads to fatigue, sluggishness, skin issues, and digestive problems. Ayurveda offers natural detoxification methods to cleanse the body and restore balance.",
        approach: [
          "Diet: Follow a light diet with warm water, fresh fruits, vegetables, and whole grains. Avoid processed foods, sugar, and fried items.",
          "Lifestyle: Practice intermittent fasting, yoga, and deep breathing. Start mornings with warm lemon water and Triphala tea.",
          "Herbs & Remedies: Use Triphala, Neem, and Guduchi for detox. Drink coriander, fennel, and cumin tea to flush out toxins."
        ],
        image: "/images/Detox.jpg",
        callToAction: "Need a full-body cleanse? Ayurveda purifies naturally!"
      },
      {
        title: "Anti-Aging & Skin Rejuvenation (Rasayana Therapy & Twacha Raksha)",
        description:
          "Aging occurs due to natural degeneration, oxidative stress, and dosha imbalances. Ayurveda believes in slowing aging naturally by strengthening tissues, nourishing the skin, and promoting cellular renewal.",
        approach: [
          "Diet: Consume antioxidant-rich foods like amla, pomegranate, almonds, and ghee. Avoid excessive caffeine, alcohol, and junk food.",
          "Lifestyle: Follow a daily skincare routine with oil massage (Abhyanga) using sesame or almond oil. Practice meditation to reduce stress.",
          "Herbs & Remedies: Apply sandalwood & turmeric face masks. Use Ashwagandha & Shatavari for tissue regeneration. Drink saffron milk for glowing skin."
        ],
        image: "/images/Anti-Aging & Skin Rejuvenation.jpg",
        callToAction: "Want youthful skin? Ayurveda reverses aging naturally!"
      },
      {
        title: "Energy Boosters & Weakness Treatment (Bala Vriddhi & Ojas Enhancement)",
        description:
          "Low energy, constant fatigue, and muscle weakness result from Vata-Pitta imbalance, poor digestion, stress, and lack of nourishment. Ayurveda helps restore vitality, improve stamina, and boost immunity naturally.",
        approach: [
          "Diet: Eat energy-boosting foods like dates, nuts, honey, milk, and whole grains. Avoid cold, stale, and excessively spicy foods.",
          "Lifestyle: Maintain a proper sleep schedule, practice yoga, and engage in regular physical activity. Sun exposure in the morning boosts vitality.",
          "Herbs & Remedies: Use Ashwagandha, Brahmi, and Shatavari for energy. Drink warm milk with turmeric & ghee for strength."
        ],
        image: "/images/energy boost.jpg",
        callToAction: "Feeling drained? Ayurveda naturally restores energy!"
      }
    ]
  },

  "Infections": {
    title: "Ayurvedic Approach to Infections & Immunity Support",
    description:
      "Infections occur due to imbalanced doshas, weak immunity (Ojas), and Ama (toxins) accumulation. Ayurveda focuses on strengthening the body's natural defense mechanism through detoxification, herbal remedies, and lifestyle modifications.",
    concerns: [
      {
        title: "Common Cold & Flu Treatment (Jwara & Pratishyay Chikitsa)",
        description:
          "Colds and flu occur due to Kapha-Vata imbalances, exposure to seasonal changes, and a weakened immune system. Ayurveda treats them by reducing mucus, strengthening digestion, and boosting immunity naturally.",
        approach: [
          "Diet: Consume warm, light foods like soups, khichdi, and herbal teas. Avoid cold, fried, and dairy-heavy foods that increase mucus production.",
          "Lifestyle: Stay warm, rest adequately, practice steam inhalation with eucalyptus or tulsi leaves, and gargle with salt water.",
          "Herbs & Remedies: Use tulsi, ginger, black pepper, and honey in herbal teas. Drink turmeric milk to reduce inflammation and boost immunity."
        ],
        image: "/images/CommoncoldTreatment.jpg",
        callToAction: "Want to prevent colds naturally? Ayurveda enhances immunity!"
      },
      {
        title: "Bacterial, Viral & Fungal Infections (Krimi & Rakta Dushti Chikitsa)",
        description:
          "Infections arise from weakened immunity, excessive toxins (Ama), and bacterial or fungal overgrowth. Ayurveda eliminates harmful pathogens without disturbing the body's natural balance.",
        approach: [
          "Diet: Eat detoxifying foods like bitter greens, neem leaves, and turmeric-infused meals. Avoid sugar, processed foods, and excess dairy.",
          "Lifestyle: Maintain good hygiene, practice daily oil pulling, and take warm showers to prevent infections. Engage in pranayama for lung cleansing.",
          "Herbs & Remedies: Use neem, giloy, and turmeric for their antibacterial and antiviral properties. Apply aloe vera or neem paste for skin infections."
        ],
        image: "/images/Bacteriall Infections.jpg",
        callToAction: "Struggling with infections? Ayurveda treats them naturally!"
      },
      {
        title: "Recovery After Illness (Bala Vriddhi & Rasayana Chikitsa)",
        description:
          "After an illness, the body loses strength (Bala) and vital energy (Ojas). Recovery focuses on rebuilding immunity, restoring digestion, and revitalizing the body's natural energy levels.",
        approach: [
          "Diet: Include nourishing foods like ghee, warm milk, dates, almonds, and seasonal fruits. Avoid heavy, fried, or overly spicy foods that burden digestion.",
          "Lifestyle: Follow a proper sleep schedule, practice gentle yoga, and get morning sunlight exposure to restore energy and enhance immunity.",
          "Herbs & Remedies: Use ashwagandha, shatavari, and chyawanprash for strength. Drink herbal decoctions with mulethi and ginger for faster recovery."
        ],
        image: "/images/recovery_after_illnes.jpg",
        callToAction: "Feeling weak after an illness? Ayurveda speeds up recovery!"
      }
    ]
  },

  "Pain Management": {
    title: "Ayurvedic Approach to Pain Management",
    description:
      "Pain in Ayurveda is often linked to Vata imbalance, which disrupts the body's natural flow of energy and causes stiffness, aches, and discomfort. Ayurveda focuses on balancing Vata, reducing inflammation, improving circulation, and strengthening muscles and nerves to relieve pain naturally.",
    concerns: [
      {
        title: "Chronic Pain Relief (Nityavata Vedana Chikitsa)",
        description:
          "Chronic pain is often linked to accumulated toxins (Ama), nerve imbalances, or prolonged Vata disturbance. Ayurveda treats pain by reducing toxins, nourishing the body, and improving circulation.",
        approach: [
          "Diet: Include warm, easy-to-digest foods like soups, stews, and ghee. Avoid cold, dry, or processed foods that aggravate Vata.",
          "Lifestyle: Practice gentle yoga, avoid prolonged sitting, and engage in daily oil massages (Abhyanga) to improve circulation.",
          "Herbs & Remedies: Use ashwagandha, guggulu, and turmeric for pain relief. Apply warm sesame oil or mahanarayan oil to affected areas."
        ],
        image: "/images/crpain.jpg",
        callToAction: "Struggling with pain for months? Ayurveda can help!",
      },
      {
        title: "Muscle Cramps & Body Aches (Mamsagata Vedana Chikitsa)",
        description:
          "Muscle cramps and body aches occur due to electrolyte imbalances, weak blood circulation, and excessive Vata aggravation. Ayurveda focuses on muscle relaxation and deep nourishment.",
        approach: [
          "Diet: Eat potassium- and magnesium-rich foods like bananas, spinach, nuts, and dairy. Stay hydrated with herbal teas and warm water.",
          "Lifestyle: Engage in stretching exercises, get regular massages with warm oils, and practice deep breathing for muscle relaxation.",
          "Herbs & Remedies: Apply a paste of ginger and turmeric to sore muscles. Take triphala to remove toxins and improve blood circulation."
        ],
        image: "/images/Muscle Cramps.jpg",
        callToAction: "Tired of constant aches? Try Ayurveda for relief!",
      },
      {
        title: "Migraine & Headache Relief (Ardhavabhedaka Chikitsa)",
        description:
          "Migraines and headaches are often caused by Vata & Pitta imbalances, leading to nerve irritation, stress, and digestive toxins (Ama). Ayurveda focuses on calming the nervous system and detoxifying the body.",
        approach: [
          "Diet: Consume cooling and grounding foods like coconut water, ghee, and soaked almonds. Avoid spicy, oily, and fermented foods that trigger headaches.",
          "Lifestyle: Maintain a regular sleep schedule, practice stress management techniques like meditation, and avoid excessive screen time.",
          "Herbs & Remedies: Use Brahmi and Shankhpushpi for mental relaxation. Apply sandalwood paste on the forehead and drink tulsi tea for relief."
        ],
        image: "/images/Headache Relief.jpg",
        callToAction: "Suffering from migraines? Ayurveda treats the root cause!",
      },
      {
        title: "Nerve Pain & Neuropathy (Vatavyadhi Chikitsa)",
        description:
          "Nerve pain results from excess Vata causing weakness, tingling, or burning sensations in the body. Ayurveda strengthens nerves and reduces pain naturally.",
        approach: [
          "Diet: Include healthy fats like ghee, nuts, and sesame seeds. Avoid caffeine, alcohol, and processed foods that deplete nerve health.",
          "Lifestyle: Engage in daily warm oil massages (especially with sesame or mahanarayan oil), gentle yoga, and pranayama to improve nerve function.",
          "Herbs & Remedies: Use ashwagandha and Bala (Sida cordifolia) for nerve strength. Apply a turmeric and castor oil paste to affected areas."
        ],
        image: "/images/Nerve Pain.jpg",
        callToAction: "Nerve pain troubling you? Ayurveda offers long-term relief!",
      },
      {
        title: "Post-Surgery & Injury Recovery (Sandhigata Chikitsa)",
        description:
          "After surgery or injuries, the body needs proper nourishment, tissue repair, and immunity support to heal completely. Ayurveda speeds up recovery with deep nourishment.",
        approach: [
          "Diet: Eat protein-rich foods like lentils, dairy, and soaked nuts. Include turmeric, ginger, and fenugreek for faster healing.",
          "Lifestyle: Get adequate rest, practice mild movement to prevent stiffness, and use warm oil therapy for tissue repair.",
          "Herbs & Remedies: Take chyawanprash for immunity, ashwagandha for strength, and drink herbal milk with turmeric and saffron for recovery."
        ],
        image: "/images/Post-Surgery.jpg",
        callToAction: "Need a natural recovery plan? Ayurveda supports your healing!",
      },
    ],
  },
};

export const treatmentDataHi = {
  "Digestive Health": {
    title: "आयुर्वेद में पाचन स्वास्थ्य (अग्नि एवं कोष्ठ)",
    description:
      "आयुर्वेद के अनुसार 'सर्वे रोगाः मन्दाग्नौ' — सभी रोगों की जड़ मंद जठराग्नि है। एक प्रदीप्त जठराग्नि आहार का सही पाचन कर पोषण देती है, जबकि अग्नि का असंतुलन 'आम' (विषाक्त तत्व) बनाता है जिससे पाचन विकार उत्पन्न होते हैं।",
    concerns: [
      {
        title: "अम्लपित्त एवं सीने में जलन (Amla Pitta / Acid Reflux)",
        description:
          "जब पित्त दोष दूषित होकर आमाशय में अत्यधिक अम्ल बनाता है, तो यह अन्नप्रणाली में ऊपर उठकर सीने व गले में जलन पैदा करता है। अत्यधिक तीखा, तला-भुना और खट्टा भोजन इसे बढ़ाता है।",
        approach: [
          "आहार: खट्टा, तीखा और बासी भोजन न लें। सौंफ, मिश्री और मुलेठी की शीतल हर्बल चाय का सेवन करें।",
          "दिनचर्या: समय पर भोजन करें और भोजन के तुरंत बाद लेटने या सोने से बचें।",
          "औषधियां: आंवला, गिलोय, यष्टिमधु (मुलेठी) और अविपत्तिकर चूर्ण अत्यधिक पित्त व जलन को शांत करते हैं।",
        ],
        image: acidRefluxImg,
        callToAction: "व्यक्तिगत आहार व जड़ी-बूटी योजना चाहिए? हमारे प्रमाणित आयुर्वेदिक डॉक्टर से परामर्श लें।"
      },
      {
        title: "कब्ज एवं अपच (Vibandh & Ajirna)",
        description:
          "अपक्व भोजन और वात दोष की वृद्धि से आंतों में सूखापन आ जाता है, जिससे मलत्याग में कठिनाई (विबंध) और पेट फूलना, भारीपन (अजीर्ण) होता है।",
        approach: [
          "आहार: फाइबर युक्त भोजन, भीगी हुई मुनक्का, गुनगुना जल और देसी गाय का घी बढ़ाएं।",
          "दिनचर्या: भोजन का निश्चित समय रखें और वात शमन हेतु पेट पर गुनगुने तिल तेल की मालिश करें।",
          "औषधियां: त्रिफला चूर्ण, इसबगोल की भूसी और एरंड का तेल प्राकृतिक राहत देते हैं।",
        ],
        image: constipationImg,
        callToAction: "पुरानी कब्ज से परेशान हैं? अपनी प्रकृति अनुसार स्थायी आयुर्वेदिक समाधान पाएं।"
      },
      {
        title: "अतिसार एवं दस्त (Atisara / Diarrhea)",
        description:
          "अत्यधिक पित्त या कफ दोष के प्रकुपित होने और जठराग्नि कमजोर होने से आंतों की अवशोषण शक्ति घट जाती है, जिससे बार-बार पतले दस्त लगते हैं।",
        approach: [
          "आहार: हल्का व सुपाच्य भोजन जैसे मूंग दाल की खिचड़ी, भुना जीरा युक्त छाछ (तक्र) और अनार का रस लें।",
          "दिनचर्या: पर्याप्त आराम करें और ओआरएस/नारियल पानी से शरीर में जल संतुलन बनाए रखें।",
          "औषधियां: बिल्व (बेल का गूदा), कुटजघन वटी और पिप्पली आंतों को बल प्रदान करते हैं।",
        ],
        image: "/images/Diarrhea & Loose Motions.jpeg",
        callToAction: "बार-बार पेट खराब रहता है? हमारे विशेषज्ञों से आयुर्वेदिक गट-हीलिंग प्लान प्राप्त करें।"
      },
      {
        title: "इरिटेबल बाउल सिंड्रोम (IBS / संग्रहणी)",
        description:
          "संग्रहणी में कभी कब्ज तो कभी दस्त, पेट में ऐंठन और गैस की समस्या रहती है। यह मुख्य रूप से वात-पित्त असंतुलन और मानसिक तनाव से जुड़ा होता है।",
        approach: [
          "आहार: सात्विक, ताजा और गुनगुना पका हुआ भोजन करें। कच्चे व अत्यधिक ठंडे पदार्थों से बचें।",
          "दिनचर्या: तनाव प्रबंधन के लिए नियमित योग, प्राणायाम और ध्यान अत्यंत आवश्यक हैं।",
          "औषधियां: ब्राह्मी (तनाव शमन), त्रिफला (पाचन सुधार) और कुटजारिष्ट (आंतों की मजबूती) लाभकारी हैं।",
        ],
        image: ibsImg,
        callToAction: "आईबीएस और पाचन की बेचैनी से मुक्ति चाहते हैं? विशेषज्ञ डॉक्टर से संपर्क करें।"
      },
      {
        title: "आमाशय अल्सर एवं घाव (Parinam Shoola / Peptic Ulcer)",
        description:
          "तीव्र पित्त दोष और तनाव के कारण आमाशय की आंतरिक परत पर छाले/अल्सर बन जाते हैं, जिससे पेट में तेज जलन, दर्द और मिचली होती है।",
        approach: [
          "आहार: नारियल पानी, गाय का घी, भीगे बादाम जैसे शीतल पदार्थ लें। चाय, कॉफी, मिर्च-मसाले पूर्णतः त्यागें।",
          "दिनचर्या: शीतली प्राणायाम करें और भोजन का समय नियमित रखें।",
          "औषधियां: यष्टिमधु (मुलेठी), शतावरी और घृतकुमारी (एलोवेरा) आमाशय की परत को ठीक करते हैं।",
        ],
        image: ulcersImg,
        callToAction: "अल्सर के प्राकृतिक उपचार हेतु आयुर्वेदिक विशेषज्ञ से परामर्श लें।"
      },
    ],
  },

  "Respiratory Health": {
    title: "आयुर्वेद में श्वसन स्वास्थ्य (प्राणवह स्रोतस)",
    description:
      "श्वसन प्रणाली प्राण वायु (जीवन शक्ति) द्वारा संचालित होती है और कफ (श्लेष्मा) तथा वात (वायु व गति) दोष से प्रभावित होती है। दोषों के असंतुलन से फेफड़ों में कफ जमाव और सांस में रुकावट आती है। आयुर्वेद फेफड़ों को मजबूत करने और श्वसन मार्ग को शुद्ध करने पर बल देता है।",
    concerns: [
      {
        title: "दमा एवं श्वास कष्ट (Tamaka Shwasa / Asthma)",
        description:
          "तमक श्वास कफ-वातज विकार है, जहां श्वास नलिकाओं में सूजन व कफ जमने से वायु का प्रवाह अवरुद्ध हो जाता है और सांस लेने में घरघराहट होती है।",
        approach: [
          "आहार: ठंडा पानी, आइसक्रीम और भारी दूध उत्पाद न लें। सोंठ, तुलसी और हल्दी की गुनगुनी चाय पिएं।",
          "दिनचर्या: नीलगिरी तेल की भाप लें और फेफड़ों की क्षमता बढ़ाने हेतु अनुलोम-विलोम व भस्त्रिका प्राणायाम करें।",
          "औषधियां: वासा (अडूसा), यष्टिमधु, तुलसी और श्वास कुठार रस श्वास मार्ग को खोलते हैं।",
        ],
        image: "/images/asthma.jpg",
        callToAction: "अस्थमा और श्वास कष्ट से राहत पाने हेतु व्यक्तिगत आयुर्वेदिक परामर्श लें।"
      },
      {
        title: "पुरानी खांसी एवं जुकाम (Kasa & Pratishaya)",
        description:
          "रोग प्रतिरोधक क्षमता कमजोर होने या मौसमी बदलाव से वात-कफ प्रकुपित होकर सूखी (वातज) या बलगम वाली (कफज) खांसी उत्पन्न करते हैं।",
        approach: [
          "आहार: गर्म व सुपाच्य सूप लें। ठंडे पेय और अत्यधिक मिठाइयों से परहेज करें।",
          "दिनचर्या: शरीर को गर्म रखें और छाती पर गुनगुने सरसों तेल की मालिश करें।",
          "औषधियां: सितोपलादि चूर्ण, मुलेठी क्वाथ और पिप्पली गले व फेफड़ों के कफ को साफ करते हैं।",
        ],
        image: "/images/cough.jpg",
        callToAction: "पुरानी खांसी से परेशान हैं? विशेषज्ञ आयुर्वेदिक डॉक्टर से परामर्श लें।"
      },
      {
        title: "साइनस एवं बंद नाक (Peenas / Sinusitis)",
        description:
          "साइनस छिद्रों में कफ जमा होने से सिर में भारीपन, दर्द, नाक बंद होना और सांस लेने में कठिनाई होती है।",
        approach: [
          "आहार: भारी, तैलीय और दही जैसे कफवर्धक आहार से बचें। तुलसी-अदरक का काढ़ा पिएं।",
          "दिनचर्या: जल नेति क्रिया और भाप लेना साइनस मार्ग को तुरंत खोलने में सहायक है।",
          "औषधियां: त्रिकटु (सोंठ, काली मिर्च, पिप्पली), षड्बिन्दु तैल (नस्य) और दशमूल अत्यंत प्रभावी हैं।",
        ],
        image: "/images/sinu.jpg",
        callToAction: "साइनस के स्थायी समाधान हेतु आज ही आयुर्वेदिक परामर्श बुक करें।"
      },
      {
        title: "ब्रोंकाइटिस एवं सीने का संक्रमण (Kasa Roga / Bronchitis)",
        description:
          "श्वास नलिकाओं में संक्रमण व सूजन के कारण लगातार खांसी, बलगम और सीने में जकड़न होती है।",
        approach: [
          "आहार: मूंग दाल का सूप और गर्म हर्बल टॉनिक लें। तले-भुने भोजन से बचें।",
          "दिनचर्या: गर्म सरसों तेल से सीने की मालिश, भाप और हल्दी पानी से गरारे करें।",
          "औषधियां: वासावलेह, तुलसी स्वरस और तालीसादि चूर्ण श्वास नलिकाओं को राहत देते हैं।",
        ],
        image: "/images/chestpain.jpg",
        callToAction: "फेफड़ों के समग्र स्वास्थ्य हेतु अपनी व्यक्तिगत योजना प्राप्त करें।"
      }
    ],
  },

  "Skin Care": {
    title: "आयुर्वेद में त्वचा एवं केश देखभाल",
    description:
      "त्वचा और बाल पित्त (ऊष्मा), कफ (स्निग्धता) और वात (रूखापन) के संतुलन का दर्पण हैं। रक्त दृष्टि और दोषों का असंतुलन मुंहासे, एक्जिमा, सोरायसिस और बालों के झड़ने का कारण बनता है। आयुर्वेद रक्त शोधन और आंतरिक डिटॉक्स द्वारा जड़ से उपचार करता है।",
    concerns: [
      {
        title: "मुंहासे एवं कील-मुहासे (Yauvan Pidika / Acne)",
        description:
          "रक्त धातु में पित्त की अधिकता से चेहरे पर सूजन और दाने निकलते हैं। तैलीय भोजन, तनाव और हार्मोनल असंतुलन इसे और बढ़ाते हैं।",
        approach: [
          "आहार: मिर्च-मसाले, तली चीजें छोड़ें। खीरा, नारियल पानी और ताजे फल जैसे शीतल आहार लें।",
          "दिनचर्या: गुलाब जल से चेहरा धोएं, चंदन व नीम-हल्दी का लेप लगाएं।",
          "औषधियां: नीम, मंजिष्ठा और खदिरारिष्ट रक्त को शुद्ध कर त्वचा को निखारते हैं।",
        ],
        image: "/images/skinacne.jpg",
        callToAction: "साफ और चमकदार त्वचा के लिए आयुर्वेदिक स्किनकेयर प्लान प्राप्त करें।"
      },
      {
        title: "एक्जिमा एवं रूखी त्वचा (Vicharchika / Eczema)",
        description:
          "वात-पित्त के असंतुलन से त्वचा में अत्यधिक सूखापन, खुजली और जलन होती है। यह यकृत और रक्त की अशुद्धि से संबंधित विकार है।",
        approach: [
          "आहार: देसी घी, नारियल और हर्बल पेय लें। प्रोसेस्ड फूड और कैफीन से बचें।",
          "दिनचर्या: स्नान से पूर्व नारियल या बादाम तेल से अभ्यंग करें और एलोवेरा जेल लगाएं।",
          "औषधियां: नीम, गिलोय और कैशोर गुग्गुलु आंतरिक सूजन व खुजली को समाप्त करते हैं।",
        ],
        image: "/images/Eczema & Dry Skin Issues.jpeg",
        callToAction: "एक्जिमा के समग्र और स्थायी समाधान हेतु आयुर्वेदिक डॉक्टर से सलाह लें।"
      },
      {
        title: "सोरायसिस एवं त्वचा चकत्ते (Kitibha / Psoriasis)",
        description:
          "वात-कफज असंतुलन से त्वचा की कोशिकाएं तेजी से बढ़कर पपड़ीदार, रूखे और खुजलीदार चकत्ते बनाती हैं।",
        approach: [
          "आहार: करेला, नीम की पत्तियां जैसी कड़वी सब्जियां लें। मांसाहार व जंक फूड से बचें।",
          "दिनचर्या: 777 तेल या महामरीच्यादि तेल लगाएं और तनाव मुक्त रहें।",
          "औषधियां: मंजिष्ठा, बाकुची और त्रिफला रक्त व त्वचा का शोधन करते हैं।",
        ],
        image: "/images/psoriasis.jpg",
        callToAction: "सोरायसिस के आयुर्वेदिक प्रबंधन हेतु आज ही विशेषज्ञ से परामर्श लें।"
      },
      {
        title: "रूसी एवं बालों का झड़ना (Darunaka & Khalitya)",
        description:
          "स्कैल्प में कफ (अतिरिक्त तेल) और वात (रूखापन) के असंतुलन से डैंड्रफ और बालों की जड़ें कमजोर होकर बाल झड़ने लगते हैं।",
        approach: [
          "आहार: पालक, बादाम, काले तिल और आंवला का सेवन बढ़ाएं।",
          "दिनचर्या: भृंगराज तेल से सिर की मालिश करें और रीठा-शिकाकाई से बाल धोएं।",
          "औषधियां: भृंगराज, ब्राह्मी, मेथी और आमलकी बालों की जड़ों को पोषण देते हैं।",
        ],
        image: "/images/Dandruff.jpg",
        callToAction: "बालों के झड़ने की समस्या रोकने के लिए कस्टमाइज्ड हेयर प्लान लें।"
      },
      {
        title: "समय से पहले बालों का सफेद होना (Palitya / Premature Greying)",
        description:
          "अत्यधिक पित्त, तनाव और पोषण की कमी से 30 वर्ष से पहले बाल सफेद होने लगते हैं। आयुर्वेद आंतरिक पोषण पर ध्यान केंद्रित करता है।",
        approach: [
          "आहार: आंवला, करी पत्ता, काले तिल का नियमित सेवन करें। चाय-कॉफी कम करें।",
          "दिनचर्या: भृंगराज तेल से शिरोअभ्यंग और नस्य क्रिया (नाक में घी डालना) करें।",
          "औषधियां: नवायस लौह, आमलकी रसायन और ब्राह्मी बालों का प्राकृतिक रंग बनाए रखते हैं।",
        ],
        image: "/images/Premature Greying of Hair.jpeg",
        callToAction: "बालों का प्राकृतिक स्वास्थ्य बहाल करने हेतु विशेषज्ञ से संपर्क करें।"
      }
    ],
  },

  "Joint and Bone Health": {
    title: "आयुर्वेद में संधि एवं अस्थि स्वास्थ्य",
    description:
      "संधियों (जोड़ों) की गतिशीलता वात, चयापचय पित्त और स्निग्धता कफ (श्लेषक कफ) पर निर्भर करती है। उम्र बढ़ने या आम (विषाक्त तत्व) जमा होने से जोड़ों में दर्द, जकड़न और अस्थि क्षय (कमजोरी) होती है। आयुर्वेद वात शमन और अस्थि धातु पोषण से उपचार करता है।",
    concerns: [
      {
        title: "गठिया एवं जोड़ों का दर्द (Sandhivata & Amavata)",
        description:
          "संधिवात (ऑस्टियोआर्थराइटिस) वात वृद्धि से और आमवात (रूमेटाइड आर्थराइटिस) जोड़ों में आम दोष जमा होने से सूजन व असहनीय दर्द उत्पन्न करता है।",
        approach: [
          "आहार: गर्म व पौष्टिक सूप, देसी घी, हल्दी-अदरक का सेवन करें। बादी व ठंडी चीजें छोड़ें।",
          "दिनचर्या: महानारायण तेल या प्रसारिणी तेल से अभ्यंग करें और हल्के योगासन करें।",
          "औषधियां: योगराज गुग्गुलु, शल्लाकी (बोसवेलिया), और अश्वगंधा सूजन व दर्द घटाते हैं।",
        ],
        image: "/images/jointpain.jpg",
        callToAction: "जोड़ों के दर्द से मुक्ति हेतु व्यक्तिगत आयुर्वेदिक गठिया उपचार योजना प्राप्त करें।"
      },
      {
        title: "कमर दर्द एवं सायटिका (Kateegraham & Gridhrasi)",
        description:
          "वात प्रकुपित होकर कमर की नसों को दबाता है, जिससे दर्द कमर से पैरों तक जाता है। गलत बैठने की मुद्रा और पाचन की कमजोरी इसे बढ़ाती है।",
        approach: [
          "आहार: कैल्शियम युक्त खाद्य (तिल, रागी, दूध) लें। अत्यधिक चाय-कॉफी से बचें।",
          "दिनचर्या: धन्वंतरम तेल से मालिश, कटि बस्ती थेरेपी और भुजंगासन का अभ्यास करें।",
          "औषधियां: दशमूल, अश्वगंधा, रास्ना और एकांगवीर रस नसों को ताकत देते हैं।",
        ],
        image: "/images/backpain.jpg",
        callToAction: "कमर दर्द व सायटिका से राहत पाने के लिए विशेषज्ञ से परामर्श करें।"
      },
      {
        title: "ऑस्टियोपोरोसिस एवं कमजोर हड्डियां (Asthi Kshaya)",
        description:
          "वात-पित्त असंतुलन और कैल्शियम के अवशोषण में कमी से हड्डियां खोखली व कमजोर होने लगती हैं, जिससे फ्रैक्चर का खतरा बढ़ता है।",
        approach: [
          "आहार: रागी, तिल, अंजीर, खजूर और दूध का सेवन बढ़ाएं। कोल्ड ड्रिंक्स से बचें।",
          "दिनचर्या: तिल के तेल से धूप में बैठकर मालिश करें और हल्का व्यायाम करें।",
          "औषधियां: हड़जोड़ (अस्थिसंहार), प्रवाल पिष्टी, अर्जुन और मुक्ताशुक्ति भस्म हड्डियों का घनत्व बढ़ाते हैं।",
        ],
        image: "/images/Osteoporosis.jpg",
        callToAction: "मजबूत हड्डियों के लिए आज ही आयुर्वेदिक विशेषज्ञ की सलाह लें।"
      },
      {
        title: "मांसपेशियों की जकड़न एवं वातरक्त (Vata-Rakta & Stiffness)",
        description:
          "रक्त और वात के दूषित होने से शरीर में जकड़न, मांसपेशियों में खिंचाव और यूरिक एसिड बढ़ता है।",
        approach: [
          "आहार: सुपाच्य गर्म भोजन, हल्दी वाला दूध पिएं। बासी व खट्टे पदार्थों से बचें।",
          "दिनचर्या: स्वेदन (भाप लेना), गर्म तेल की मालिश और नियमित सैर करें।",
          "औषधियां: कैशोर गुग्गुलु, गिलोय और रास्नादी क्वाथ विषाक्त तत्वों को बाहर निकालते हैं।",
        ],
        image: "/images/Rheumatism.jpg",
        callToAction: "मांसपेशियों के दर्द और जकड़न को दूर करने के लिए परामर्श लें।"
      }
    ],
  },

  "Cardiovascular Health": {
    title: "आयुर्वेद में हृदय एवं रक्त परिसंचरण",
    description:
      "हृदय ओजस का मुख्य स्थान है और रस-रक्त धातु से जुड़ा है। व्यान वायु (परिसंचरण), साधक पित्त (भावनात्मक स्वास्थ्य) और अवलम्बक कफ (हृदय की संरचना) का संतुलन हृदय को स्वस्थ रखता है। आयुर्वेद रक्त शुद्धि और धमनी शोधन पर केंद्रित है।",
    concerns: [
      {
        title: "उच्च रक्तचाप (Hypertension / Rakta Gata Vata)",
        description:
          "मानसिक तनाव, असंतुलित खानपान और रक्त वाहिकाओं में वात के दबाव से रक्तचाप बढ़ता है।",
        approach: [
          "आहार: नारियल पानी, अनार, चुकंदर और धनिए का पानी लें। नमक व तली-भुनी चीजें घटाएं।",
          "दिनचर्या: भ्रामरी प्राणायाम, शवासन, ध्यान और सुबह की सैर मन को शांत करते हैं।",
          "औषधियां: अर्जुन की छाल का काढ़ा, सर्पगंधा, ब्राह्मी और जटामांसी रक्तचाप को नियंत्रित करते हैं।",
        ],
        image: "/images/bloodpressure.jpg",
        callToAction: "हाई बीपी के प्राकृतिक आयुर्वेदिक नियंत्रण हेतु विशेषज्ञ से परामर्श लें।"
      },
      {
        title: "उच्च कोलेस्ट्रॉल एवं धमनी रुकावट (Medo Roga & Dhamani Pratichaya)",
        description:
          "अग्निमांद्य और अतिरिक्त कफ के कारण धमनियों में वसा/प्लाक जमा हो जाता है, जिससे रक्त प्रवाह बाधित होता है।",
        approach: [
          "आहार: लहसुन, अदरक, लौकी का सूप, मूंग दाल लें। भारी डेयरी और तेल-घी कम करें।",
          "दिनचर्या: नियमित कार्डियो योग (सूर्य नमस्कार) और वजन नियंत्रण आवश्यक है।",
          "औषधियां: मेदोहर गुग्गुलु, त्रिफला, अर्जुन और लहसुनादि वटी धमनियों को साफ करते हैं।",
        ],
        image: "/images/cholesterol.jpg",
        callToAction: "हृदय सुरक्षा और कोलेस्ट्रॉल कम करने का आयुर्वेदिक प्रोग्राम अपनाएं।"
      },
      {
        title: "कमजोर रक्त परिसंचरण (Rakta Dushti & Vyana Vayu Imbalance)",
        description:
          "व्यान वायु की दुर्बलता से हाथ-पैर ठंडे रहना, सुन्न पड़ना और वेरीकोज वेन्स की समस्या उत्पन्न होती है।",
        approach: [
          "आहार: अदरक, दालचीनी, काली मिर्च और अखरोट का सेवन करें।",
          "दिनचर्या: सरसों या तिल के तेल से पैरों की मालिश करें।",
          "औषधियां: मंजिष्ठा, अश्वगंधा और पुनर्नवा रक्त प्रवाह को सुगम बनाते हैं।",
        ],
        image: "/images/Poor Blood Circulation.jpg",
        callToAction: "रक्त परिसंचरण और ऊर्जा में सुधार हेतु डॉक्टर से संपर्क करें।"
      }
    ],
  },

  "Mental Health and Wellness": {
    title: "आयुर्वेद में मानसिक स्वास्थ्य एवं आत्मिक शांति",
    description:
      "मानसिक स्वास्थ्य सत्व (स्पष्टता), रजस (चंचलता) और तमस (जड़ता) के गुणों से निर्धारित होता है। वात की अधिकता से चिंता व अनिद्रा, पित्त से क्रोध व जलन, और कफ से अवसाद होता है। आयुर्वेद मेध्य रसायनों और शिरोधरा द्वारा मन को शांत करता है।",
    concerns: [
      {
        title: "चिंता, घबराहट एवं अवसाद (Chittodvega & Vishada)",
        description:
          "अत्यधिक सोच-विचार, तनाव और वात प्रकोप से चित्तोद्वेग (एंजायटी) और कफ-तमस की वृद्धि से अवसाद (डिप्रेशन) होता है।",
        approach: [
          "आहार: जायफल युक्त गुनगुना दूध, भीगे बादाम, घी और खजूर लें। कैफीन और चीनी त्यागें।",
          "दिनचर्या: शिरोअभ्यंग, योग निद्रा और दैनिक ध्यान तंत्रिका तंत्र को पोषण देते हैं।",
          "औषधियां: ब्राह्मी, शंखपुष्पी, अश्वगंधा और सारस्वतारिष्ट मनोदशा को बेहतर बनाते हैं।",
        ],
        image: "/images/anxiety.jpg",
        callToAction: "मानसिक शांति और सकारात्मक ऊर्जा के लिए आयुर्वेदिक थेरेपी शुरू करें।"
      },
      {
        title: "अनिद्रा एवं नींद के विकार (Nidranasha / Insomnia)",
        description:
          "रात में वात-पित्त की वृद्धि और मन की अशांति से गहरी नींद नहीं आती, जिससे थकान व चिड़चिड़ापन रहता है।",
        approach: [
          "आहार: सोने से पूर्व हल्दी वाला दूध या अश्वगंधा क्षीरपाक लें। रात में भारी भोजन न करें।",
          "दिनचर्या: पैर के तलवों में तिल तेल की मालिश (पादाभ्यंग) करें और स्क्रीन से दूरी बनाएं।",
          "औषधियां: तगर (जटामांसी), ब्राह्मी वटी और सर्पगंधा घन वटी गहरी व शांत नींद लाते हैं।",
        ],
        image: "/images/insomniaS.jpg",
        callToAction: "प्राकृतिक और बिना आदत पड़ने वाली आयुर्वेदिक नींद चिकित्सा अपनाएं।"
      },
      {
        title: "तनाव प्रबंधन (Manasik Santulan / Stress Management)",
        description:
          "दैनिक भागदौड़ और वात-पित्त असंतुलन से मानसिक थकान, बर्नआउट और रोग प्रतिरोधक क्षमता में गिरावट आती है।",
        approach: [
          "आहार: नारियल पानी, ताजा फल, आंवला मुरब्बा जैसे पित्तशामक आहार लें।",
          "दिनचर्या: अनुलोम-विलोम प्राणायाम, भ्रामरी और प्रकृति के सानिध्य में समय बिताएं।",
          "औषधियां: अश्वगंधारिष्ट, तुलसी स्वरस और मंडूकपर्णी तनाव हार्मोन को संतुलित करते हैं।",
        ],
        image: "/images/Stress.jpg",
        callToAction: "तनाव मुक्त जीवन के लिए आज ही आयुर्वेदिक विशेषज्ञ से मार्गदर्शन लें।"
      },
      {
        title: "स्मरण शक्ति एवं एकाग्रता (Medhya Rasayana Therapy)",
        description:
          "वात असंतुलन और कमजोर पाचन से मस्तिष्क को पर्याप्त पोषण नहीं मिलता, जिससे ध्यान केंद्रित करने में कठिनाई होती है।",
        approach: [
          "आहार: अखरोट, भीगे बादाम, ब्राह्मी चाय, देसी घी और सौंफ लें।",
          "दिनचर्या: त्राटक क्रिया (दीपक पर ध्यान), गायत्री मंत्र जप और शिरोधरा करें।",
          "औषधियां: ब्राह्मी घृत, शंखपुष्पी सिरप और ज्योतिष्मती तैल मस्तिष्क की कार्यक्षमता बढ़ाते हैं।",
        ],
        image: "/images/Memory  Improvement.jpg",
        callToAction: "तेज दिमाग और एकाग्रता के लिए मेध्य रसायन चिकित्सा अपनाएं।"
      }
    ],
  },

  "Metabolic and Endocrine Health": {
    title: "आयुर्वेद में चयापचय एवं हार्मोनल स्वास्थ्य",
    description:
      "चयापचय और हार्मोनल संतुलन जठराग्नि व धात्वाग्नि द्वारा नियंत्रित होते हैं। असंतुलित जीवनशैली, तनाव और आम संचय से मधुमेह, थायरॉयड और पीसीओडी जैसी समस्याएं उत्पन्न होती हैं। आयुर्वेद अग्नि दीपन और हार्मोन संतुलन पर कार्य करता है।",
    concerns: [
      {
        title: "मधुमेह एवं ब्लड शुगर नियंत्रण (Madhumeha / Diabetes)",
        description:
          "कफ और वात के असंतुलन से इंसुलिन की कार्यक्षमता घट जाती है और रक्त में शर्करा बढ़ जाती है। आयुर्वेद इसे जीवनशैली जन्य विकार मानता है।",
        approach: [
          "आहार: मेथी दाना, जामुन, करेला, आंवला और जौ की रोटी लें। चीनी, मैदा और चावल सीमित करें।",
          "दिनचर्या: प्रतिदिन 45 मिनट तेज गति से पैदल चलें और मंडूकासन व सूर्य नमस्कार करें।",
          "औषधियां: गुड़मार (मधुनाशिनी), विजयसार की लकड़ी का जल, वसंत कुसुमाकर रस और जामुन गुठली चूर्ण।",
        ],
        image: diabetesImg,
        callToAction: "मधुमेह के प्राकृतिक और सुरक्षित नियंत्रण हेतु आयुर्वेदिक परामर्श लें।"
      },
      {
        title: "थायरॉयड विकार (Galaganda & Gandamala / Thyroid)",
        description:
          "कफ वृद्धि से हाइपोथायरॉइडिज्म (वजन बढ़ना, सुस्ती) और पित्त वृद्धि से हाइपरथायरॉइडिज्म (वजन घटना, बेचैनी) होता है।",
        approach: [
          "आहार: सेंधा नमक, धनिया बीज का पानी, अलसी और साबुत अनाज लें। सोया व प्रोसेस्ड फूड से बचें।",
          "दिनचर्या: उज्जायी प्राणायाम, सर्वांगासन और गले पर तिल तेल की मालिश करें।",
          "औषधियां: कांचनार गुग्गुलु, अश्वगंधा और वृद्धदारुक थायरॉयड ग्रंथि को संतुलित करते हैं।",
        ],
        image: "/images/thyroidperson.jpg",
        callToAction: "थायरॉयड को प्राकृतिक रूप से नियंत्रित करने के लिए विशेषज्ञ से संपर्क करें।"
      },
      {
        title: "वजन घटाना एवं मेटाबॉलिज्म सुधार (Sthoulya Chikitsa)",
        description:
          "मंद जठराग्नि और कफ-मेद धातु की अत्यधिक वृद्धि से शरीर में अतिरिक्त चर्बी जमा होती है।",
        approach: [
          "आहार: गर्म जल, मूंग दाल, भुनी सब्जियां और त्रिकटु युक्त गुनगुने पानी का सेवन करें।",
          "दिनचर्या: उद्वर्तन (हर्बल सूखे चूर्ण से शरीर पर मालिश), कपालभाति और उपवास।",
          "औषधियां: मेदोहर विडंग गुग्गुलु, त्रिफला गुग्गुलु और पुनर्नवारिष्ट चर्बी घटाने में सहायक हैं।",
        ],
        image: "/images/Weight loss.jpg",
        callToAction: "स्वस्थ तरीके से वजन घटाने हेतु आयुर्वेदिक वेट लॉस प्लान लें।"
      },
      {
        title: "पीसीओडी/पीसीओएस एवं मासिक धर्म विकार (Stree Roga / PCOS)",
        description:
          "कफ-वात असंतुलन से अंडाशय में सिस्ट बनते हैं, जिससे पीरियड्स में अनियमितता, चेहरे पर अनचाहे बाल और वजन बढ़ता है।",
        approach: [
          "आहार: दालचीनी की चाय, अलसी, हरी पत्तेदार सब्जियां लें। डेयरी व बेकरी उत्पाद बंद करें।",
          "दिनचर्या: बद्धकोणासन, तितली आसन और नियमित व्यायाम करें।",
          "औषधियां: कचनार गुग्गुलु, शतावरी, अशोकारिष्ट और लोध्रासव हार्मोनल संतुलन लाते हैं।",
        ],
        image: "/images/period pain.jpg",
        callToAction: "PCOS/PCOD के जड़ से उपचार के लिए विशेषज्ञ महिला आयुर्वेदिक डॉक्टर से परामर्श लें।"
      }
    ]
  },

  "Immune Support": {
    title: "रोग प्रतिरोधक क्षमता (ओजस एवं व्याधिक्षमत्व)",
    description:
      "आयुर्वेद में व्याधिक्षमत्व शरीर की प्राकृतिक सुरक्षा प्रणाली है जो ओजस (परम ऊर्जा) और प्रदीप्त अग्नि पर आधारित है। एक सुदृढ़ प्रतिरक्षा तंत्र संक्रमणों और पुरानी बीमारियों से रक्षा करता है।",
    concerns: [
      {
        title: "समग्र रोग प्रतिरोधक क्षमता वृद्धि (Vyadhikshamatva Vardhana)",
        description:
          "पाचन की कमजोरी और ओजस क्षय से बार-बार बीमार पड़ना, थकान और संक्रमण की संभावना बढ़ जाती है।",
        approach: [
          "आहार: च्यवनप्राश, हल्दी-दूध, आंवला, मुनक्का और मौसमी फलों का सेवन करें।",
          "दिनचर्या: प्रातःकाल धूप सेवन, सूर्य नमस्कार और प्राणायाम ओजस बढ़ाते हैं।",
          "औषधियां: गिलोय (अमृता), अश्वगंधा, तुलसी और स्वर्ण भस्म युक्त रसायन।",
        ],
        image: "/images/Immunity Boosting.jpg",
        callToAction: "ओजस और इम्युनिटी बढ़ाने के लिए आयुर्वेदिक रसायन थेरेपी अपनाएं।"
      },
      {
        title: "एलर्जी एवं साइनस संवेदनशीलता (Pratisyaya & Allergies)",
        description:
          "धूल, परागकण या मौसम बदलाव से कफ-वात प्रकुपित होकर छींकें, नाक बहना और आंखों में खुजली पैदा करते हैं।",
        approach: [
          "आहार: सोंठ-तुलसी की चाय, गर्म सूप पिएं। ठंडे पेय और दही का त्याग करें।",
          "दिनचर्या: अणु तैल का नस्य (नाक में 2 बूंद) और भाप लेना श्वसन मार्ग की रक्षा करता है।",
          "औषधियां: हरिद्रा खंड, सितोपलादि चूर्ण और लक्ष्मीविलास रस एलर्जी को शांत करते हैं।",
        ],
        image: "/images/Frequent Allergies & Sinus Issues.jpg",
        callToAction: "एलर्जी से हमेशा के लिए राहत पाने हेतु आयुर्वेदिक उपचार लें।"
      },
      {
        title: "ऑटोइम्यून स्थितियां (Ama-Related Disorders)",
        description:
          "जब शरीर में संचित 'आम' दोष कोशिकाओं को दूषित करता है, तो प्रतिरक्षा तंत्र स्वयं के ऊतकों पर आक्रमण करने लगता है।",
        approach: [
          "आहार: सूजनरोधी आहार (हल्दी, अदरक, करेला) लें। भारी व प्रोसेस्ड फूड से बचें।",
          "दिनचर्या: पंचकर्म द्वारा शरीर का शोधन और तनाव मुक्त जीवनशैली अपनाएं।",
          "औषधियां: गुडूची (गिलोय), मंजिष्ठा और आमलकी प्रतिरक्षा को संतुलित करते हैं।",
        ],
        image: "/images/autoimmuneS.jpg",
        callToAction: "ऑटोइम्यून विकारों के समग्र आयुर्वेदिक प्रबंधन हेतु परामर्श लें।"
      }
    ]
  },

  "Women's Health": {
    title: "आयुर्वेद में स्त्री स्वास्थ्य (मातृत्व एवं स्त्री रोग)",
    description:
      "स्त्री स्वास्थ्य रस धातु और शुक्र/आर्तव धातु से सीधे जुड़ा है। मासिक धर्म, गर्भधारण और रजोनिवृत्ति जैसे हार्मोन्स के परिवर्तनों में वात-पित्त-कफ का संतुलन बनाए रखना अनिवार्य है।",
    concerns: [
      {
        title: "मासिक धर्म दर्द एवं अनियमितता (Kashtartava & Anartava)",
        description:
          "वात की दृष्टि से गर्भाशय में ऐंठन व दर्द होता है, और कफ के अवरोध से मासिक धर्म में देरी या रक्तस्राव में रुकावट आती है।",
        approach: [
          "आहार: तिल-गुड़ का काढ़ा, अजवाइन का पानी और गर्म सुपाच्य भोजन लें।",
          "दिनचर्या: पेट के निचले हिस्से पर गर्म पानी की सिकाई करें और तितली आसन करें।",
          "औषधियां: अशोकारिष्ट, दशमूलारिष्ट, शतावरी और कुमार्यासव मासिक चक्र नियमित करते हैं।",
        ],
        image: "/images/irpain.jpg",
        callToAction: "मासिक धर्म की समस्याओं के प्राकृतिक समाधान हेतु विशेषज्ञ से सलाह लें।"
      },
      {
        title: "रजोनिवृत्ति एवं हार्मोनल बदलाव (Rajonivritti / Menopause)",
        description:
          "मेनोपॉज के दौरान पित्त से वात प्रधानता की ओर बदलाव होता है, जिससे हॉट फ्लैशेस, अनिद्रा, मूड स्विंग्स और हड्डियों की कमजोरी होती है।",
        approach: [
          "आहार: बादाम, अलसी, गाय का घी और नारियल पानी लें। कैफीन व तीखे भोजन से बचें।",
          "दिनचर्या: नियमित तेल मालिश (अभ्यंग) और शीतली प्राणायाम करें।",
          "औषधियां: शतावरी चूर्ण, ब्राह्मी और मुक्ता पिष्टी हार्मोनल शांति लाते हैं।",
        ],
        image: "/images/hrchanges.jpg",
        callToAction: "मेनोपॉज के दौर को सहज व स्वस्थ बनाने के लिए आयुर्वेदिक परामर्श लें।"
      },
      {
        title: "गर्भधारण एवं मातृत्व देखभाल (Garbhasthapana & Paricharya)",
        description:
          "आयुर्वेद गर्भधारण से पूर्व शरीर शुद्धि (बीज शुद्धि) और गर्भावस्था के नौ महीनों में विशेष परिचर्या पर बल देता है।",
        approach: [
          "आहार: केसर युक्त दूध, बादाम, अखरोट, घी और सात्विक भोजन ग्रहण करें।",
          "दिनचर्या: शांत वातावरण, सकारात्मक चिंतन और सौम्य योग का अभ्यास करें।",
          "औषधियां: फलगृत, शतावरी घृत और अश्वगंधा जननांगों को पुष्ट करते हैं।",
        ],
        image: "/images/Fertility.jpg",
        callToAction: "स्वस्थ मातृत्व और प्रजनन स्वास्थ्य के लिए आयुर्वेदिक मार्गदर्शन लें।"
      },
      {
        title: "योनि स्वास्थ्य एवं संक्रमण (Yoniroga & Infections)",
        description:
          "अस्वच्छता या पित्त-कफ असंतुलन से श्वेत प्रदर (ल्यूकोरिया), खुजली व संक्रमण उत्पन्न होते हैं।",
        approach: [
          "आहार: ठंडा व सुपाच्य भोजन करें। अत्यधिक खट्टा और मीठा न खाएं।",
          "दिनचर्या: त्रिफला क्वाथ से योनि प्रक्षालन (धोना) करें और सूती अंतःवस्त्र पहनें।",
          "औषधियां: पत्रांगासव, लोध्र और प्रदरारि लौह संक्रमण को शांत करते हैं।",
        ],
        image: "/images/vinfection.jpg",
        callToAction: "स्त्री जननांग स्वास्थ्य के सुरक्षित समाधान हेतु परामर्श बुक करें।"
      }
    ]
  },

  "Men's Health": {
    title: "आयुर्वेद में पुरुष स्वास्थ्य एवं पौरुष",
    description:
      "पुरुष स्वास्थ्य शुक्र धातु (प्रजनन ऊतक), ओजस और समान वायु के संतुलन पर आधारित है। तनाव, अस्वस्थ खानपान और भागदौड़ से पौरुष शक्ति, प्रोस्टेट और बालों का स्वास्थ्य प्रभावित होता है।",
    concerns: [
      {
        title: "यौन स्वास्थ्य एवं ऊर्जा वृद्धि (Shukra Dhatu Vriddhi & Vigor)",
        description:
          "शुक्र धातु की दुर्बलता, मानसिक तनाव और रक्त प्रवाह में कमी से स्टैमिना और ऊर्जा में कमी आती है। आयुर्वेद वाजीकरण चिकित्सा द्वारा नवजीवन देता है।",
        approach: [
          "आहार: खजूर, बादाम, अखरोट, केसर, देसी घी और दूध का सेवन बढ़ाएं। धूम्रपान व मदिरा छोड़ें।",
          "दिनचर्या: अश्विनी मुद्रा, कीगल एक्सरसाइज और पर्याप्त गहरी नींद लें।",
          "औषधियां: शिलाजीत, अश्वगंधा, सफेद मूसली और कौंच बीज टेस्टोस्टेरोन व शक्ति बढ़ाते हैं।",
        ],
        image: "/images/staminaBoostings.jpg",
        callToAction: "पौरुष शक्ति और ऊर्जा में प्राकृतिक वृद्धि के लिए आयुर्वेदिक परामर्श लें।"
      },
      {
        title: "प्रोस्टेट स्वास्थ्य एवं मूत्र विकार (Vasti Roga & Prostate Care)",
        description:
          "कफ दोष और आम संचय से प्रोस्टेट ग्रंथि में सूजन (BPH) और बार-बार या रुक-रुक कर पेशाब आने की समस्या होती है।",
        approach: [
          "आहार: कद्दू के बीज (पंपकिन सीड्स), जौ का पानी और अनार लें। अत्यधिक नमक से बचें।",
          "दिनचर्या: पेशाब न रोकें, भरपूर पानी पिएं और स्क्वाट व्यायाम करें।",
          "औषधियां: गोक्षुरादि गुग्गुलु, वरुणादि क्वाथ, पुनर्नवा और चंदनासव प्रोस्टेट को स्वस्थ रखते हैं।",
        ],
        image: "/images/Prostate Health 1.jpg",
        callToAction: "प्रोस्टेट और यूरिनरी समस्याओं के लिए सुरक्षित आयुर्वेदिक समाधान पाएं।"
      },
      {
        title: "पुरुषों में बाल झड़ना एवं गंजापन (Khalitya & Palitya)",
        description:
          "स्कैल्प में पित्त दोष की अधिकता और जड़ों में कमजोरी से बाल तेजी से झड़ने लगते हैं।",
        approach: [
          "आहार: आंवला, कढ़ी पत्ता, काले तिल और नारियल पानी लें। तीखे व खट्टे भोजन से बचें।",
          "दिनचर्या: भृंगराज तेल से रोजाना 10 मिनट सिर की मालिश करें।",
          "औषधियां: भृंगराज, आमलकी रसायन, ब्राह्मी और त्रिफला बालों की जड़ों को मजबूत बनाते हैं।",
        ],
        image: "/images/Hairlos.jpg",
        callToAction: "बालों का झड़ना रोकने और घनत्व बढ़ाने के लिए परामर्श लें।"
      }
    ]
  },

  "Liver and Kidney Health": {
    title: "आयुर्वेद में यकृत एवं वृक्क स्वास्थ्य (लिवर व किडनी)",
    description:
      "यकृत (लिवर) और वृक्क (किडनी) शरीर के प्रमुख शोधक अंग हैं जो रक्त शुद्धि और विषाक्त पदार्थों को निकालने का कार्य करते हैं। पित्त और कफ का असंतुलन फैटी लिवर, पथरी या संक्रमण उत्पन्न करता है। आयुर्वेद प्राकृतिक जड़ी-बूटियों से अंगों का कायाकल्प करता है।",
    concerns: [
      {
        title: "किडनी की पथरी एवं मूत्र विकार (Vrikka Ashmari)",
        description:
          "शरीर में डिहाइड्रेशन और यूरिक एसिड व कैल्शियम ऑक्सालेट जमने से गुर्दे में पथरी बनती है जो असहनीय दर्द करती है।",
        approach: [
          "आहार: जौ का पानी, कुलथी की दाल का सूप और नारियल पानी पिएं। पालक व टमाटर से बचें।",
          "दिनचर्या: भरपूर जल पिएं और मूत्र वेग को कदापि न रोकें।",
          "औषधियां: पाषाणभेद, गोक्षुर, वरुण की छाल और पुनर्नवा पथरी को गलाकर बाहर निकालते हैं।",
        ],
        image: "/images/kidneystone.jpg",
        callToAction: "किडनी की पथरी के बिना सर्जरी प्राकृतिक आयुर्वेदिक उपचार हेतु परामर्श लें।"
      },
      {
        title: "फैटी लिवर एवं लिवर डिटॉक्स (Yakrit Shodhana & Fatty Liver)",
        description:
          "अत्यधिक तला-भुना, शराब और मंद पाचन से यकृत पर वसा जमा हो जाती है, जिससे पाचन धीमा और सुस्ती रहती है।",
        approach: [
          "आहार: करेला, मेथी, पपीता, चुकंदर और हल्दी लें। तला-भुना व चीनी पूर्णतः बंद करें।",
          "दिनचर्या: सुबह गुनगुने पानी में नींबू व हल्दी पिएं और सूर्य नमस्कार करें।",
          "औषधियां: भूम्यामराकी (भूमि आंवला), कुटकी, कालमेघ और पुनर्नवारिष्ट लिवर को नया जीवन देते हैं।",
        ],
        image: "/images/Fatty Liver Treatment.png",
        callToAction: "फैटी लिवर को रिवर्स करने और लिवर डिटॉक्स हेतु आज ही परामर्श बुक करें।"
      },
      {
        title: "हेपेटाइटिस एवं लिवर संक्रमण (Yakrit Vikara & Hepatitis)",
        description:
          "वायरस और पित्त प्रकोप से यकृत में सूजन आ जाती है, जिससे पीलिया (कामला), भूख न लगना और कमजोरी होती है।",
        approach: [
          "आहार: गन्ने का ताजा रस, मूंग पानी, अनार और हल्का भोजन लें। चिकनाई बिल्कुल न लें।",
          "दिनचर्या: पूर्ण विश्राम करें और प्राणायाम द्वारा तनाव कम करें।",
          "औषधियां: आरोग्यवर्धिनी वटी, कालमेघ, गिलोय और नीम यकृत की सूजन व वायरस को नष्ट करते हैं।",
        ],
        image: "/images/Liver Infections.jpeg",
        callToAction: "लिवर संक्रमण और पीलिया के सुरक्षित आयुर्वेदिक उपचार के लिए संपर्क करें।"
      }
    ]
  },

  "Eye Health": {
    title: "आयुर्वेद में नेत्र स्वास्थ्य एवं दृष्टि सुधार",
    description:
      "नेत्र पित्त दोष, विशेष रूप से 'आलोचक पित्त' द्वारा संचालित होते हैं। स्क्रीन के अत्यधिक उपयोग, प्रदूषण और गर्मी से आंखों में सूखापन, रोशनी कमजोर होना और जलन होती है। आयुर्वेद त्रिफला और तर्पण द्वारा दृष्टि को सुदृढ़ करता है।",
    concerns: [
      {
        title: "आंखों का सूखापन एवं तनाव (Shushka Netra / Dry Eyes)",
        description:
          "कंप्यूटर/मोबाइल स्क्रीन और वात वृद्धि से आंखों की नमी समाप्त होकर जलन व खिंचाव होता है।",
        approach: [
          "आहार: गाय का शुद्ध घी, गाजर, पालक और बादाम लें। तीखा-तला भोजन कम करें।",
          "दिनचर्या: 20-20-20 नियम अपनाएं (हर 20 मिनट बाद 20 सेकंड दूर देखें) और गुलाब जल से आंखें धोएं।",
          "औषधियां: त्रिफला घृत, नेत्र तर्पण चिकित्सा और अणु तैल का नस्य आंखों को स्निग्ध करते हैं।",
        ],
        image: "/images/dry eye.jpg",
        callToAction: "ड्राई आईज और आंखों के तनाव से प्राकृतिक राहत पाने के लिए परामर्श लें।"
      },
      {
        title: "कमजोर दृष्टि एवं रतौंधी (Drishti Mandya & Weak Vision)",
        description:
          "पोषक तत्वों की कमी और पित्त प्रकोप से दृष्टि का चश्मा नंबर बढ़ता है और रात में देखने में कठिनाई होती है।",
        approach: [
          "आहार: आंवला का मुरब्बा, सौंफ-बादाम-मिश्री का चूर्ण और गाजर का रस लें।",
          "दिनचर्या: सुबह नंगे पैर हरी घास पर चलें और सूर्य त्राटक व पामिंग एक्सरसाइज करें।",
          "औषधियां: सप्तामृत लौह, त्रिफला चूर्ण जल प्रक्षालन और महात्रिफला घृत रोशनी बढ़ाते हैं।",
        ],
        image: "/images/weak eyes.jpg",
        callToAction: "नेत्र ज्योति बढ़ाने और चश्मे का नंबर घटाने के आयुर्वेदिक उपाय जानें।"
      },
      {
        title: "आंख आना एवं संक्रमण (Abhishyanda / Conjunctivitis)",
        description:
          "धूल और बैक्टीरिया से आंखों में लाली, कीचड़, सूजन और चुभन होती है।",
        approach: [
          "आहार: खीरा, धनिए का पानी और नारियल पानी जैसे शीतल पेय लें।",
          "दिनचर्या: शुद्ध त्रिफला जल से आंखें धोएं और बार-बार आंखें छूने से बचें।",
          "औषधियां: गुलाब जल आई ड्रॉप्स, नीम-हल्दी क्वाथ धावन तुरंत राहत देते हैं।",
        ],
        image: "/images/Eye Infections.jpeg",
        callToAction: "आंखों के संक्रमण से त्वरित और सुरक्षित मुक्ति हेतु संपर्क करें।"
      }
    ]
  },

  "Oral Health": {
    title: "आयुर्वेद में मुख स्वास्थ्य एवं दंत चिकित्सा",
    description:
      "मुख स्वास्थ्य 'मुख स्वच्छता' और तीनों दोषों के संतुलन पर निर्भर करता है। कफ मसूड़ों और लार को, पित्त छालों व सूजन को और वात दांतों की संवेदनशीलता को प्रभावित करता है। आयुर्वेद गंडूष (ऑयल पुलिंग) और जड़ी-बूटियों पर बल देता है।",
    concerns: [
      {
        title: "मसूड़ों के रोग एवं खून आना (Danta Roga & Sheetada / Bleeding Gums)",
        description:
          "पायरिया और मसूड़ों से खून आना पित्त की अशुद्धि और बैक्टीरिया के जमाव से होता है।",
        approach: [
          "आहार: आंवला, तिल, बादाम जैसे विटामिन-सी व कैल्शियम युक्त खाद्य लें।",
          "दिनचर्या: प्रतिदिन तिल या नारियल तेल से कुल्ला (ऑयल पुलिंग) करें।",
          "औषधियां: बबूल की छाल, नीम दातून, त्रिफला काढ़ा और लौंग का तेल मसूड़ों को मजबूत करते हैं।",
        ],
        image: "/images/gumbleeding.jpeg",
        callToAction: "मसूड़ों के रक्तस्राव और पायरिया से स्थायी आयुर्वेदिक मुक्ति पाएं।"
      },
      {
        title: "दांतों में कीड़ा व सड़न (Krimi Danta / Cavities)",
        description:
          "अत्यधिक मीठे व अम्लीय भोजन से इनेमल कमजोर होकर दांतों में कैविटी और दर्द पैदा होता है।",
        approach: [
          "आहार: रागी, दूध और हरी सब्जियां लें। कोल्ड ड्रिंक्स व टॉफी से दूर रहें।",
          "दिनचर्या: भोजन के बाद कुल्ला करें और हर्बल दंतमंजन से ब्रश करें।",
          "औषधियां: बबूल, लौंग चूर्ण, सेंधा नमक और सरसों के तेल की दांतों पर मालिश करें।",
        ],
        image: "/images/teeth cavity.jpeg",
        callToAction: "दांतों को सड़न और कीड़े से बचाने के लिए आयुर्वेदिक दंत चिकित्सा अपनाएं।"
      },
      {
        title: "मुंह की बदबू एवं छाले (Mukha Durgandha & Mukhapaka / Mouth Ulcers)",
        description:
          "पेट की खराबी और पित्त की अत्यधिक गर्मी से मुंह में छाले पड़ते हैं और दुर्गंध आती है।",
        approach: [
          "आहार: सौंफ, मिश्री, नारियल पानी लें। प्याज, लहसुन और तली चीजें घटाएं।",
          "दिनचर्या: भोजनोपरांत इलायची चबाएं और त्रिफला जल से कुल्ला करें।",
        ],
        image: "/images/Mouth Ulcers.png",
        callToAction: "मुंह के छालों और दुर्गंध के जड़ से उपचार हेतु परामर्श लें।"
      }
    ]
  },

  "General Wellness": {
    title: "समग्र स्वास्थ्य एवं कायाकल्प (डिटॉक्स व रसायन)",
    description:
      "आयुर्वेद का प्रथम उद्देश्य 'स्वस्थस्य स्वास्थ्य रक्षणम्' — स्वस्थ व्यक्ति के स्वास्थ्य की रक्षा करना है। रसायन चिकित्सा और शरीर शोधन (डिटॉक्स) द्वारा दोषों का संतुलन कर ओजस और दीर्घायु की प्राप्ति होती है।",
    concerns: [
      {
        title: "संपूर्ण शरीर डिटॉक्स एवं शोधन (Ama Nivarana & Shodhana)",
        description:
          "गलत खानपान, प्रदूषण और तनाव से शरीर में संचित 'आम' दोष सुस्ती, आलस्य और रोग उत्पन्न करता है।",
        approach: [
          "आहार: हल्का सुपाच्य भोजन, गुनगुना पानी, मौसमी फल और जीरा-धनिया-सौंफ की चाय लें।",
          "दिनचर्या: सप्ताह में एक दिन उपवास, नियमित प्राणायाम और प्रातः गुनगुना नींबू पानी लें।",
          "औषधियां: त्रिफला, नीम, गिलोय और पुनर्नवा शरीर की समस्त अशुद्धियों को बाहर निकालते हैं।",
        ],
        image: "/images/Detox.jpg",
        callToAction: "शरीर की आंतरिक शुद्धि और नई ऊर्जा के लिए डिटॉक्स प्रोग्राम अपनाएं।"
      },
      {
        title: "एंटी-एजिंग एवं त्वचा कायाकल्प (Rasayana & Rejuvenation)",
        description:
          "कोशिकाओं की उम्र बढ़ने की प्रक्रिया को धीमा करने और ऊतकों को नवजीवन देने हेतु रसायन चिकित्सा अचूक है।",
        approach: [
          "आहार: आंवला, अनार, बादाम, अखरोट और देसी घी का सेवन करें।",
          "दिनचर्या: तिल या बादाम तेल से दैनिक अभ्यंग करें और ध्यान लगाएं।",
          "औषधियां: च्यवनप्राश, अश्वगंधा, शतावरी और केसर युक्त दूध यौवन बनाए रखते हैं।",
        ],
        image: "/images/Anti-Aging & Skin Rejuvenation.jpg",
        callToAction: "सदा युवा और ऊर्जावान बने रहने के लिए आयुर्वेदिक रसायन अपनाएं।"
      },
      {
        title: "ऊर्जा व स्फूर्ति वृद्धि (Bala Vriddhi & Vitality Boost)",
        description:
          "लगातार कमजोरी, थकान और ऊर्जा की कमी को दूर कर मांसपेशियों व नसों को बल प्रदान करना।",
        approach: [
          "आहार: खजूर, दूध, मुनक्का, अंजीर और शहद का सेवन करें।",
          "दिनचर्या: सुबह की गुनगुनी धूप लें और नियमित हल्का योग करें।",
          "औषधियां: अश्वगंधा पाक, कौंच पाक और द्राक्षासव शरीर में अपार शक्ति भरते हैं।",
        ],
        image: "/images/energy boost.jpg",
        callToAction: "कमजोरी दूर करने और नई स्फूर्ति पाने हेतु आयुर्वेदिक परामर्श लें।"
      }
    ]
  },

  "Infections": {
    title: "आयुर्वेद में संक्रमण एवं रोग मुक्ति",
    description:
      "संक्रमण कमजोर व्याधिक्षमत्व (इम्युनिटी) और रक्त दृष्टि के कारण पनपते हैं। आयुर्वेद प्राकृतिक एंटी-माइक्रोबियल जड़ी-बूटियों द्वारा शरीर के प्राकृतिक संतुलन को बिगाड़े बिना कीटाणुओं का नाश करता है।",
    concerns: [
      {
        title: "सर्दी, जुकाम एवं मौसमी फ्लू (Jwara & Pratishyay Chikitsa)",
        description:
          "कफ-वात के प्रकोप से बुखार, सिरदर्द, नाक बहना और बदन दर्द होता है।",
        approach: [
          "आहार: मूंग दाल की पतली खिचड़ी, गर्म काढ़ा और अदरक-तुलसी की चाय पिएं।",
          "दिनचर्या: पर्याप्त विश्राम करें और नमक के गुनगुने पानी से गरारे व भाप लें।",
          "औषधियां: त्रिभुवन कीर्ति रस, महासुदर्शन काढ़ा और संशमनी वटी फ्लू को समाप्त करते हैं।",
        ],
        image: "/images/CommoncoldTreatment.jpg",
        callToAction: "मौसमी फ्लू से त्वरित राहत हेतु आयुर्वेदिक परामर्श लें।"
      },
      {
        title: "जीवाणु, विषाणु एवं फंगल संक्रमण (Krimi & Rakta Dushti)",
        description:
          "रक्त की अशुद्धि और कमजोर ओजस से त्वचा व आंतरिक अंगों में बार-बार संक्रमण होते हैं।",
        approach: [
          "आहार: नीम की कोपलें, करेला, हल्दी युक्त भोजन लें। मीठा व दही बंद करें।",
          "दिनचर्या: गंडूष करें, शुद्ध वातावरण में रहें और गुनगुने पानी से स्नान करें।",
          "औषधियां: नीम घनवटी, गिलोय स्वरस और गंधक रसायन सभी प्रकार के संक्रमण नष्ट करते हैं।",
        ],
        image: "/images/Bacteriall Infections.jpg",
        callToAction: "संक्रमणों के प्राकृतिक और जड़ से निवारण के लिए संपर्क करें।"
      },
      {
        title: "बीमारी के बाद रिकवरी एवं बल संचय (Post-Illness Recovery)",
        description:
          "लंबी बीमारी के बाद शरीर का बल (इम्युनिटी) और पाचन कमजोर हो जाता है, जिसे पुनः सशक्त करना आवश्यक है।",
        approach: [
          "आहार: देसी घी, बादाम का दूध, खजूर और ताजे फल लें।",
          "दिनचर्या: नियमित हल्की सैर और सुबह की धूप लें।",
          "औषधियां: अश्वगंधा चूर्ण, शतावरी और द्राक्षारिष्ट शरीर को पुनः ऊर्जावान बनाते हैं।",
        ],
        image: "/images/recovery_after_illnes.jpg",
        callToAction: "बीमारी के बाद शीघ्र स्वास्थ्य लाभ हेतु आयुर्वेदिक रिकवरी प्लान लें।"
      }
    ]
  },

  "Pain Management": {
    title: "आयुर्वेद में दर्द निवारण (वेदना शमन चिकित्सा)",
    description:
      "आयुर्वेद के अनुसार 'न वातात विना शूलम्' — बिना वात दोष के शरीर में कोई दर्द नहीं हो सकता। आयुर्वेद वात शमन, सूजन निवारण और रक्त परिसंचरण सुधार द्वारा बिना किसी साइड इफेक्ट के दर्द से मुक्ति दिलाता है।",
    concerns: [
      {
        title: "दीर्घकालिक पुराना दर्द (Nityavata Vedana / Chronic Pain)",
        description:
          "महीनों पुराना दर्द नसों में वात रुकावट और आंतों में संचित आम दोष से होता है।",
        approach: [
          "आहार: गर्म सुपाच्य सूप, लहसुन, हींग और देसी घी लें। बासी व ठंडे भोजन से बचें।",
          "दिनचर्या: प्रभावित स्थान पर गर्म तेल की मालिश और गुनगुनी सिकाई करें।",
          "औषधियां: महायोगराज गुग्गुलु, वातगजांकुश रस और रास्नादि क्वाथ स्थायी आराम देते हैं।",
        ],
        image: "/images/crpain.jpg",
        callToAction: "महीनों पुराने दर्द से राहत पाने के लिए विशेषज्ञ से परामर्श लें।"
      },
      {
        title: "मांसपेशियों में ऐंठन व बदन दर्द (Mamsagata Vedana / Muscle Cramps)",
        description:
          "रक्त प्रवाह की कमी, इलेक्ट्रोलाइट असंतुलन और वात वृद्धि से मांसपेशियों में तेज ऐंठन होती है।",
        approach: [
          "आहार: केला, पालक, अखरोट और सेंधा नमक युक्त जल लें।",
          "दिनचर्या: मांसपेशियों का हल्का खिंचाव (स्ट्रेचिंग) करें और गर्म तेल मालिश करें।",
          "औषधियां: अश्वगंधा, बला और दशमूलारिष्ट मांसपेशियों को शिथिल व पुष्ट करते हैं।",
        ],
        image: "/images/Muscle Cramps.jpg",
        callToAction: "मांसपेशियों की ऐंठन और दर्द से मुक्ति हेतु आयुर्वेदिक उपाय अपनाएं।"
      },
      {
        title: "माइग्रेन एवं आधासीसी सिरदर्द (Ardhavabhedaka / Migraine)",
        description:
          "वात-पित्त के प्रकुपित होने और मानसिक तनाव से सिर के आधे हिस्से में तेज धड़कता हुआ दर्द होता है।",
        approach: [
          "आहार: नारियल पानी, देसी गाय का घी, भीगे बादाम लें। खट्टे व तीखे खाद्य से बचें।",
          "दिनचर्या: माथे पर चंदन का लेप लगाएं और नस्य (नाक में 2 बूंद देसी घी) करें।",
          "औषधियां: पाथ्यादि काढ़ा, शिरःशूलादि वज्र रस और ब्राह्मी माइग्रेन को शांत करते हैं।",
        ],
        image: "/images/Headache Relief.jpg",
        callToAction: "माइग्रेन के मूल कारण को खत्म करने हेतु आज ही परामर्श बुक करें।"
      },
      {
        title: "नसों का दर्द एवं सुन्नपन (Vatavyadhi & Neuropathy)",
        description:
          "नसों की कमजोरी और वात प्रकोप से हाथ-पैरों में झनझनाहट, सुन्नपन या जलन होती है।",
        approach: [
          "आहार: अखरोट, अलसी, तिल और घी लें। कैफीन व शराब से परहेज करें।",
          "दिनचर्या: तिल या महानारायण तेल से नसों की मालिश करें।",
          "औषधियां: एकांगवीर रस, महावात विध्वंसन रस और अश्वगंधा नसों को मजबूती देते हैं।",
        ],
        image: "/images/Nerve Pain.jpg",
        callToAction: "नसों के दर्द और सुन्नपन के सुरक्षित समाधान हेतु संपर्क करें।"
      },
      {
        title: "सर्जरी व चोट के बाद रिकवरी (Sandhigata & Post-Surgery Recovery)",
        description:
          "ऑपरेशन या चोट के उपरांत ऊतकों के पुनर्निर्माण, दर्द निवारण और घाव भरने हेतु विशेष पोषण।",
        approach: [
          "आहार: हल्दी-दूध, मूंग दाल, मेथी और प्रोटीन युक्त सात्विक भोजन लें।",
          "दिनचर्या: पर्याप्त आराम करें और गुनगुने तेल की पट्टी रखें।",
          "औषधियां: त्रिफला गुग्गुलु, च्यवनप्राश और लाख (लाक्षादि गुग्गुलु) शीघ्र घाव भरते हैं।",
        ],
        image: "/images/Post-Surgery.jpg",
        callToAction: "चोट या सर्जरी के बाद तीव्र रिकवरी के लिए आयुर्वेदिक सलाह लें।"
      },
    ],
  },
};

export const ayurvedicConsultationsEn = [
  {
    title: "Why Choose Ayurvedic Consultation?",
    points: [
      "Personalized Treatment based on Dosha balance.",
      "Natural Healing with diet, herbs, and lifestyle changes.",
      "Long-Term Relief rather than symptomatic suppression.",
      "Mind-Body Balance for holistic well-being.",
    ],
    callToAction:
      "Not sure where to start? Book an online consultation with our certified Ayurvedic doctors today!",
  },
  {
    title: "Experience Holistic Healing with Ayurveda",
    points: [
      "Customized Ayurvedic plans for lasting health.",
      "Safe, natural, and effective herbal remedies.",
      "Root cause healing instead of temporary relief.",
      "Balance mind, body, and spirit with Ayurveda.",
    ],
    callToAction:
      "Get expert guidance from Ayurvedic doctors. Book your consultation today!",
  },
  {
    title: "Heal Naturally with Ayurveda",
    points: [
      "Find the right Ayurvedic solution for your health needs.",
      "100% Natural remedies with no side effects.",
      "Restore harmony with holistic treatments.",
      "Prevent diseases with Ayurveda's ancient wisdom.",
    ],
    callToAction:
      "Ready to take charge of your health? Connect with an Ayurvedic expert now!",
  },
];

export const ayurvedicConsultationsHi = [
  {
    title: "आयुर्वेदिक परामर्श क्यों चुनें?",
    points: [
      "वात-पित्त-कफ त्रिदोष संतुलन पर आधारित व्यक्तिगत उपचार।",
      "आहार, जड़ी-बूटियों और दिनचर्या द्वारा प्राकृतिक चिकित्सा।",
      "केवल लक्षणों को दबाने के बजाय रोग का जड़ से स्थायी निवारण।",
      "तन और मन के संपूर्ण स्वास्थ्य का संतुलन।",
    ],
    callToAction:
      "शुरुआत कहां से करें? आज ही हमारे प्रमाणित आयुर्वेदिक डॉक्टरों से ऑनलाइन परामर्श बुक करें!",
  },
  {
    title: "आयुर्वेद के साथ समग्र स्वास्थ्य लाभ का अनुभव करें",
    points: [
      "स्थायी स्वास्थ्य के लिए अनुकूलित आयुर्वेदिक उपचार योजनाएं।",
      "सुरक्षित, प्राकृतिक और दुष्प्रभाव रहित हर्बल औषधियां।",
      "अस्थायी राहत के बजाय रोग के मूल कारण का उपचार।",
      "आयुर्वेद के प्राचीन ज्ञान से मन, शरीर और आत्मा का संतुलन।",
    ],
    callToAction:
      "आयुर्वेदिक विशेषज्ञों से मार्गदर्शन प्राप्त करें। आज ही अपना परामर्श बुक करें!",
  },
  {
    title: "आयुर्वेद के साथ प्राकृतिक रूप से स्वस्थ हों",
    points: [
      "अपनी स्वास्थ्य आवश्यकताओं के लिए सटीक आयुर्वेदिक समाधान पाएं।",
      "बिना किसी साइड इफेक्ट के 100% प्राकृतिक उपचार।",
      "समग्र चिकित्सा द्वारा आंतरिक सद्भाव और स्फूर्ति बहाल करें।",
      "आयुर्वेद के शाश्वत ज्ञान से बीमारियों से हमेशा सुरक्षित रहें।",
    ],
    callToAction:
      "अपने स्वास्थ्य की बागडोर संभालने के लिए तैयार हैं? अभी आयुर्वेदिक विशेषज्ञ से जुड़ें!",
  },
];

export function getTreatmentData(categoryKey, lang = "en") {
  const dataset = lang === "hi" ? treatmentDataHi : treatmentDataEn;
  if (dataset[categoryKey]) return dataset[categoryKey];

  // Try looking up via category translation map
  for (const [engKey, trans] of Object.entries(categoryTranslations)) {
    if (engKey === categoryKey || trans.hi === categoryKey || trans.en === categoryKey) {
      return dataset[engKey] || treatmentDataEn[engKey];
    }
  }

  return treatmentDataEn[categoryKey] || null;
}
