const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone:{
  type:String,
  },
  password: {
    type: String,
    minlength: 8,
    required: false,
  },
  googleId: {
    type: String,
    unique: true, 
    sparse: true, 
  },
  status: {
     type: String, 
    default: "active" ,
  },addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address', // Referencing the Address model
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// OTP schema
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['signup', 'reset'], // Indicates the purpose of the OTP
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Expire OTP automatically after the specified time
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AddressSchema = new mongoose.Schema({
  name:{
    type:String,
    trim: true,
    required:true,
  },
  companyname:{
    type:String,
  },
  streetaddress:{
    type:String,
    required:true,
  },
  appartment:{
    type:String,
    required:true,
  },
  city:{
    type:String,
    required:true,
  },
  phone:{
    type:Number,
    required:true,
  },
  email:{
    type:String,
    required:true,
  },
},
 { timestamps: true } ,
)

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assumes you have a 'User' model
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Assumes you have a 'Product' model
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      variant:{
      type:String,
      required:true,
      },
      price: {
        type: Number,
        required: true,
      },
      totalquantity:{
       type :Number,
       required:true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  totalQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.pre('save', function (next) {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + item.total, 0);
  next();
});

const orderSchema = new mongoose.Schema({
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Refers to the User collection
      required: true
  },
  orderId: { type: String, unique: true },
  cartItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Assumes you have a 'Product' model
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      variant:{
      type:String,
      required:true,
      },
      price: {
        type: Number,
        required: true,
      },
      totalquantity:{
       type :Number,
       required:true,
      },
      total: {
        type: Number,
        required: true,
      },reason: { type: String,default:null},
      status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: null },
    },
  ],
  totalPrice: {
      type: Number,
      required: true
  },
  paymentMethod: {
      type: String,
      enum: ['COD', 'Card', 'RazorPay', 'NetBanking'],
      default: 'COD'
  },
  address: {
      firstName: { type: String, required: true },
      companyName: { type: String },
      streetAddress: { type: String, required: true },
      apartment: { type: String },
      city: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
  },
  razorpay: {
    orderId: { type: String ,default:null}, 
    paymentId: { type: String ,default:null}, 
    signature: { type: String ,default:null}, 
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Failed', 'Success','Returned'], 
      default: 'Pending' 
    },
  },
  orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Returned'],
      default: 'Pending'
  },
  coupenId:{
    type:String,
    default:null
  },
  createdAt: {
      type: Date,
      default: Date.now
  },
  updatedAt: {
      type: Date,
      default: Date.now
  }
});
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, 
  }
);

const returnRequestSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  productId:
   { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 

   },
  userId: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'User', 
     required: true
     },
  reason: { type: String, required: true

   },
  status: {
     type: String,
      enum: ['Pending', 'Accepted', 'Rejected'], 
      default: 'Pending'
     },
  requestedAt: { type: Date, default: Date.now 

  },
  reviewedAt: { type: Date }
});

const walletSchema = new mongoose.Schema({
  userId: { // Referring to the user owning the wallet
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  cardNumber: {
      type: String,
      required: true,
      unique: true
  },
  balance: {
      type: Number,
      required: true,
      default: 0.0
  },
  cardExpiry: {
      type: String, // 'MM/YY' format
      required: true
  },
  cardHolderName: {
      type: String,
      required: true
  },
  cardType: {
      type: String,
      enum: ['MasterCard', 'Visa', 'American Express'], // Different card types
      required: true
  },
  transactions: [{
      transactionId: {
          type: String,
          required: true,
          unique: true
      },
      amount: {
          type: Number,
          required: true,
          min: 0
      },
      transactionDate: {
          type: Date,
          default: Date.now
      },
      description: {
          type: String,
          required: true
      },
      type: { // 'credit' or 'debit'
          type: String,
          enum: ['credit', 'debit'],
          required: true
      }
  }],
  createdAt: {
      type: Date,
      default: Date.now
  }
});





const offerSchema = new mongoose.Schema({
  offerName:{
    type:String,
    required:true
  },
  offerType: { 
      type: String, 
      enum: ["product", "category", "referral"], 
      required: true 
  }, 
  discountType: { 
      type: String,  
      required: true 
  }, 
  discountValue: { type: Number, required: true }, 
  minimumOrderValue: { type: Number, default: 0 }, 
  expiryDate: { type: Date, required: true }, 
  StartingDate: { type: Date, required: true },
  usageLimit: { type: Number, default: null },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  isActive: { type: Boolean, default: true }, 
});


// Create and export the Wallet model




const Offer = mongoose.model("Offer", offerSchema);
const Cart = mongoose.model('Cart', cartSchema);
const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);
const Address = mongoose.model("Address",AddressSchema)
const Order =  mongoose.model('Order', orderSchema);
const Wishlist = mongoose.model("Wishlist",wishlistSchema)
const Return = mongoose.model('ReturnRequest', returnRequestSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

// Export the models
module.exports = { User, OTP ,Address,Cart,Order,Wishlist,Return,Wallet,Offer};
