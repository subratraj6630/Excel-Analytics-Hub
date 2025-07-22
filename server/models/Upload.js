// models/upload.js

const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: String,
    required: true
  },
  data: {
    type: Array, // This stores 2D data from Excel files
    required: false // Optional: not all uploads must have parsed data
  }
});

module.exports = mongoose.model('Upload', uploadSchema);
