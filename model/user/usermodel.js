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

// Models
const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);
const Address = mongoose.model("Address",AddressSchema)

// Export the models
module.exports = { User, OTP ,Address};
