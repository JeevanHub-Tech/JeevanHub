const Blog = require('../models/Blog');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin'); // You'll need to create this model if it doesn't exist

// Create a new blog
exports.createBlog = async (req, res) => {
    try {
        const { title, description, category, image } = req.body;
        const authorType = req.user.role;
        const authorId = req.user._id;
        let authorName;

        // Find the author based on type to get the name
        if (authorType === 'doctor') {
            const doctor = await Doctor.findById(authorId);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            authorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        } else if (authorType === 'admin') {
            const admin = await Admin.findById(authorId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }
            authorName = `${admin.firstName} ${admin.lastName}`;
        } else {
            return res.status(400).json({ error: 'Invalid author type' });
        }

        // Create the new blog
        const newBlog = new Blog({
            title,
            description,
            date: new Date(),
            authorType,
            authorId,
            authorName,
            category: category || 'General',
            image: image || ''
        });

        const savedBlog = await newBlog.save();
        res.status(201).json(savedBlog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all blogs (for public view)
exports.getallBlog = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ date: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get blogs by author
exports.getBlogsByAuthor = async (req, res) => {
    try {
        const { authorType, authorId } = req.params;
        const blogs = await Blog.find({ authorType, authorId }).sort({ date: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single blog by ID
exports.getOneBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a blog (title/description/category/image)
exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this blog' });
        }

        const { title, description, category, image } = req.body;
        if (title !== undefined) blog.title = title;
        if (description !== undefined) blog.description = description;
        if (category !== undefined) blog.category = category;
        if (image !== undefined) blog.image = image;

        const updatedBlog = await blog.save();
        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Ownership check
        if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this blog' });
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Translate blog on demand (cached in MongoDB)
exports.translateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetLang = 'hi' } = req.body;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Return cached translation if available
        if (blog.translations && blog.translations[targetLang]) {
            return res.status(200).json({
                title: blog.translations[targetLang].title,
                category: blog.translations[targetLang].category || blog.category,
                description: blog.translations[targetLang].description,
                cached: true
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is not configured' });
        }

        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Translate the following Ayurvedic health blog title and HTML content into natural, authentic, easy-to-read Hindi (हिन्दी).
CRITICAL RULES:
1. Preserve all HTML structure and tags (<p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <img>, <blockquote>, etc.) exactly intact.
2. Only translate the human text content inside the HTML tags into fluent Hindi.
3. Keep classical Ayurvedic Sanskrit/Hindi terms clear and accurate (e.g. वात, पित्त, कफ, अग्नि, ओजस, प्राणायाम, काढ़ा, त्रिफला).
4. Return ONLY a valid JSON object matching this schema without markdown codeblocks:
{
  "title": "हिंदी शीर्षक",
  "category": "श्रेणी का हिंदी नाम",
  "description": "<p>हिंदी में अनुवादित HTML सामग्री...</p>"
}

INPUT:
Title: ${blog.title}
Category: ${blog.category || 'General'}
HTML Description:
${blog.description}
`;

        const resp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.3
            }
        });

        let parsed;
        try {
            parsed = JSON.parse(resp.text);
        } catch (_) {
            const match = String(resp.text || '').match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('Failed to parse translated blog JSON');
            }
        }

        if (!blog.translations) {
            blog.translations = {};
        }

        blog.translations[targetLang] = {
            title: parsed.title || blog.title,
            category: parsed.category || blog.category,
            description: parsed.description || blog.description,
            translatedAt: new Date()
        };

        blog.markModified('translations');
        await blog.save();

        res.status(200).json({
            title: parsed.title || blog.title,
            category: parsed.category || blog.category,
            description: parsed.description || blog.description,
            cached: false
        });
    } catch (error) {
        console.error('Blog translation error:', error);
        res.status(500).json({ message: 'Translation failed', error: error.message });
    }
};