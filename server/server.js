const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
require('dotenv').config(); // Added to load environment variables

const app = express();

app.use(express.json());
app.use(cors());

// Multer setup with 5MB limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI) // Replaced with environment variable
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }]
});
const User = mongoose.model('User', userSchema);

// Upload Schema
const uploadSchema = new mongoose.Schema({
  fileName: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: Array,
  uploadDate: { type: Date, default: Date.now }
});
const Upload = mongoose.model('Upload', uploadSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { // Replaced with environment variable
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  const numberRegex = /[0-9]/;
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

  if (!numberRegex.test(username)) {
    return res.status(400).json({ message: 'Username must include at least one number' });
  }

  if (!specialCharRegex.test(username)) {
    return res.status(400).json({ message: 'Username must include at least one special character' });
  }

  if (!specialCharRegex.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one special character' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Replaced with environment variable
      res.json({ token, userId: user.username });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

// Upload Route
app.post('/api/uploads', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    const upload = new Upload({ fileName: req.file.originalname, userId: req.userId, data });
    await upload.save();

    const user = await User.findById(req.userId);
    user.uploads.push(upload._id);
    await user.save();

    res.status(201).json({ message: 'Upload saved', upload });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Fetch all uploads (metadata only)
app.get('/api/uploads', authMiddleware, async (req, res) => {
  try {
    const uploads = await Upload.find({ userId: req.userId }).select('_id fileName uploadDate userId');
    res.json(uploads || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching uploads', error: err });
  }
});

// Fetch full upload by ID
app.get('/api/uploads/:id', authMiddleware, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, userId: req.userId });
    if (!upload) return res.status(404).json({ message: 'Upload not found' });
    res.json(upload);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching upload', error: err });
  }
});

// Delete upload
app.delete('/api/uploads/:id', authMiddleware, async (req, res) => {
  try {
    const upload = await Upload.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!upload) return res.status(404).json({ message: 'Upload not found' });

    const user = await User.findById(req.userId);
    user.uploads.pull(req.params.id);
    await user.save();

    res.status(200).json({ message: 'Upload deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting upload', error: err });
  }
});

// Delete account
app.delete('/api/account', authMiddleware, async (req, res) => {
  try {
    await Upload.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    res.status(200).json({ message: 'Account and uploads deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Account deletion failed', error: err });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('API is running.');
});

app.listen(5000, () => console.log('Server running on port 5000'));