const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const Blog = require("../models/Blog");
const DietYoga = require("../models/DietYoga");
const { fuzzySearch } = require("../utils/fuzzySearch");

router.get("/", async (req, res) => {
  const { s, type } = req.query;
  if (!s || !type) return res.status(400).json({ message: "Missing query or type" });

  try {
    let results = [];

    switch (type) {
      case "doctor": {
        const doctors = await Doctor.find().select("firstName lastName _id");
        const docs = doctors.map((d) => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, firstName: d.firstName, lastName: d.lastName }));
        const matches = fuzzySearch(docs, ["firstName", "lastName"], s);
        results = matches.map((m) => ({ id: m.item.id, name: m.item.name }));
        break;
      }
      case "medicine": {
        const medicines = await Medicine.find().select("name");
        const matches = fuzzySearch(medicines, ["name"], s);
        results = matches.map((m) => ({ _id: m.item._id, name: m.item.name }));
        break;
      }
      case "blogs-videos": {
        const blogs = await Blog.find().select("title _id");
        const matches = fuzzySearch(blogs, ["title"], s);
        results = matches.map((m) => ({ id: m.item._id, title: m.item.title }));
        break;
      }
      case "diet-yoga": {
        const entries = await DietYoga.find().select("diet yoga _id");
        const matches = fuzzySearch(entries, ["diet", "yoga"], s);
        results = matches.map((m) => ({ name: m.item.diet || m.item.yoga }));
        break;
      }
      case "disease": {
        // No separate Treatment/Disease model exists; fuzzy-match against
        // Medicine.diseasesTreated and Medicine.description instead.
        const medicines = await Medicine.find().select("name description diseasesTreated");
        const matches = fuzzySearch(
          medicines,
          [
            { name: "diseasesTreated", weight: 0.7 },
            { name: "description", weight: 0.3 },
          ],
          s
        );
        results = matches.map((m) => {
          const lowerQuery = s.toLowerCase();
          const diseaseMatch = (m.item.diseasesTreated || []).find((d) => d.toLowerCase().includes(lowerQuery));
          return {
            id: m.item._id,
            name: m.item.name,
            matched: diseaseMatch || m.item.description,
          };
        });
        break;
      }
    }

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
