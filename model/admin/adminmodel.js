const mongoose = require('mongoose');

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true, 
      unique: true, 
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
    },
  },
  { timestamps: true } 
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
    },
    description: {
      type: String,
      required: true,
    },
    is_listed: {
      type: Boolean,
      default: true, 
    },
    image_url: {
      type: String, 
    },
  },
  { timestamps: true } 
);


const Admin = mongoose.model('admin', adminSchema);
const Category = mongoose.model('Category', categorySchema);

module.exports = { Admin, Category };
