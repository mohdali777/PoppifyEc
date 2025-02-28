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
    offerId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Offer",
      default:null
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
    type: String, // Reference to the Category model                // The name of your Category model
    required: true,  // Category is required
  },
  categoryId:{
    type:mongoose.Schema.Types.ObjectId,
  ref:"Category",
  default:null
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
  variants: [
    {
        variant: { type: String, required:false }, // e.g., "64 GB"
        price: { type: Number, required:false,min: 0 }, // e.g., 100
        quantity:{type:Number,required:false,min:0},
        colors: [
          {
            color: { type: String, required: true },  // e.g., "Red"
            quantity: { type: Number, required: true, min: 0 },  // Quantity for the color
          }
        ]
    }
],
offerId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Offer",
  default:null
},
WishListVerification:{
  type:[String],
  default:[],
},
inStocks:{
type:Boolean
},
  createdAt: {
    type: Date,
    default: Date.now,  
  },
  updatedAt: {
    type: Date,
    default: Date.now, 
  },
});

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'active',
  },createdAt: {
    type: Date,
    default: Date.now,  
  },
  count:{
    type:Number,
    default:0,
  },userId: { type: [mongoose.Schema.Types.ObjectId], 
    default: [] 
  },
});
const Coupen = mongoose.model("coupen",couponSchema)
const Product = mongoose.model('Product', productSchema);
const Admin = mongoose.model('admin', adminSchema);
const Category = mongoose.model('Category', categorySchema);

module.exports = { Admin, Category, Product,Coupen };
