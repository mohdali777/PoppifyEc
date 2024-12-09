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



const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,  // Product Name is required
    trim: true,
  },
  description: {
    type: String,
    required: true,  // Description is required
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Category model
    ref: 'Category',  // The name of your Category model
    required: true,  // Category is required
  },
  price: {
    type: Number,
    required: true,  // Price is required
    min: 0,  // Price must be a positive value
  },
  image: {
    type: [String],  // URL to the image
    required: true,  // Image URL is required
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',  // Default is In Stock
  },
  ratings: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,  // Default rating is 0
  },
  brand: {
    type: String,
    required: true,  // Brand name is required
  },
  colors: {
    type: [String],  // Array of colors the product is available in
    default: [],     // Default is an empty array
  },
  sizes: {
    type: [String],  // Array of available sizes for the product
    default: [],     // Default is an empty array
  },
  quantity: {
    type: Number,
    required: true,  // Quantity is required
    min: 0,          // Quantity must be a positive integer
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Automatically set the date when the product is created
  },
  updatedAt: {
    type: Date,
    default: Date.now,  // Automatically set the date when the product is last updated
  },
});

const Product = mongoose.model('Product', productSchema);
const Admin = mongoose.model('admin', adminSchema);
const Category = mongoose.model('Category', categorySchema);

module.exports = { Admin, Category, Product };
