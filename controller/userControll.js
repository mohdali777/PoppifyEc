const {OTP,User,Address,Cart,Order,Return,Wallet} = require("../model/user/usermodel")
const{Product, Coupen, Category} = require("../model/admin/adminmodel")

const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const env = require("dotenv");
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');





const login = async (req,res)=> {
    res.render("users/login",{message:null})
}
let signup = async (req,res)=>{
 res.render("users/signup",{message:null})
}
let forget = async (req,res)=>{
    res.render("users/forget")
}



   let home = async (req,res)=>{
    try {
        // Fetch only the listed categories
        const categories = await Category.find({ is_listed: true });
        const listedCategoryNames = categories.map(category => category.name);

        const products =  await Product.find({ 
          category: { $in: listedCategoryNames }, 
          inStocks: true 
        }).limit(4);

        const productMonth = await Product.aggregate([
          { 
            $match: { 
              category: { $in: listedCategoryNames }, 
              inStocks: true 
            } 
          }, 
          { $sample: { size: 4 } }
        ]);
          
        const productYear = await Product.aggregate([
          { 
            $match: { 
              category: { $in: listedCategoryNames }, 
              inStocks: true 
            } 
          }, 
          { $sample: { size: 8 } }
        ]);

        const userId = req.session.userId
        res.render("users/home", { products, categories, productMonth ,productYear,userId});
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while loading the home page.");
      }
   
   }
   const getShop = async (req,res) => {
    try {
      const categorieS = await Category.find({ is_listed: true });
        const listedCategoryNames = categorieS.map(category => category.name);
        const products = await Product.find({ category: { $in: listedCategoryNames } })
        const categories = await Category.find({is_listed: true})
        res.render("users/shop", { products ,categories,userId:req.session.userId});
    } catch (error) {
      console.log(error);
      
    }
   }

   let loginsign = async (req,res)=>{
   res.redirect("/signup")
   }
   let signlogin = async(req,res)=>{
   res.redirect("/login")
   }
   const forgetPass = async (req,res)=>{
    res.render("users/forget",{message:false})
   }

   

   const google = async(req,res)=>{
    const username = req.user.username;
    const userId = await User.findOne({username});
    if (userId.status == "blocked"){
 res.redirect("/login")
    }
    req.session.userId = userId._id;
    req.session.user = true;
    res.redirect("/")
      
   }
   

//    otp genarate function
function genarateotp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function otpTransport(email,otp) {
    try{
        const Transporter = nodemailer.createTransport({
            service : "gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODE_MAILER_EMAIL,
                pass:process.env.NODE_MAILER_PASS
            }
        })

        const info = await Transporter.sendMail({
            from: process.env.NODE_MAILER_EMAIL,
            to:email,
            subject:"verify Your Account",
            text:`your OTP is${otp} its valid for 10 miniutes`,
            html: `<b> your OTP is ${otp} its valid for 10 miniutes </b>` 
        })
        return info.accepted.length > 0

    }catch(e){
  console.error(e)
  return false
    }
    
   
    }
  
// siginup post
let postsignup = async (req,res)=>{
  
    try{      
        const {username,email,password,phone,referralCode} = req.body;
        let user = await User.findOne({email})
        let name = await User.findOne({username})
        if(user){
          return res.status(400).json({ success: false, message: "User already exists" });
        }
        if (name) {
          return res.status(400).json({ success: false, message: "Username already exists" });
      }

        const otp = genarateotp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
        const otpRecord = new OTP({
            email,
            otp,
            type: 'signup', 
            expiresAt,
        });
        
        await otpRecord.save();


        const emailsent = await otpTransport(email,otp)
        if (!emailsent) {
          return res.status(500).json({ success: false, message: "Failed to send OTP" });
      }
        console.log("otp sent",otp);
        req.session.email = email;
        req.session.pass = password;
        req.session.username = username;
        req.session.phone = phone;
        req.session.reffer = referralCode;

        return res.status(200).json({
          success: true,
          message: "OTP sent successfully. Please verify.",
          otp:otp
      });
       
    }catch(err){
        console.error(err);
        res.render("users/login", { message: "An error occurred. Please try again." })
    }
}   

let postverifyotp = async(req,res)=>{
    try {
        const {  otp } = req.body; // OTP entered by the user
        console.log(otp);
        const email = req.session.email; 
        const otpRecord = await OTP.findOne({ email, otp, type: 'signup' });
        console.log("Received OTP:", otp);
        console.log("Stored OTP Record:", otpRecord);
        if (!otpRecord) {
            return res.render("users/verifyotp", { message: "Invalid OTP or OTP expired." });
        }
        if (otpRecord.expiresAt < Date.now()) {
            return res.render("users/verifyotp", { message: "OTP has expired. Please request a new one." });
        }
        const username = req.session.username;
        const password = req.session.pass;
        const phone = req.session.phone;
        const referralCode = req.session.reffer;
        
        const saltRounds = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        
        const newUser = new User({ username, email, password: hashedPassword ,phone,referredBy:referralCode});
        await newUser.save();

if(referralCode){
        const user = await User.findOne({referralCode:referralCode})
        user.referredUsers.push(newUser._id)
       let wallet = await Wallet.findOne({ userId: user._id });
       function generateCardNumber() {
        const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
        const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
        return cardNumber;
    }
  
    function generateTransactionId(prefix, userId) {
      const timestamp = Date.now(); // Get the current timestamp
      return `${prefix}-${user._id}-${timestamp}`;
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
    const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;
      if(!wallet){
        wallet = new Wallet({
          userId: user._id,
          cardNumber: generateCardNumber(), 
          balance: 0.0,   
          cardExpiry: cardExpiry,
          cardHolderName: user.username, 
          cardType: 'MasterCard', 
          transactions: []  
  
        })
      }


    wallet.balance += 50;
  wallet.transactions.push({
    transactionId: generateTransactionId(),
    date: new Date(),
    description: `Referral bonus for inviting ${newUser.username}`,
    type: "credit",
    amount: 50, // Fixed referral bonus amount
  });

  await wallet.save();
}

if(referralCode){
 let wallet = await Wallet.findOne({ userId: newUser._id });
 function generateCardNumber() {
  const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
  const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
  return cardNumber;
}

const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;

function generateTransactionId(prefix, userId) {
  const timestamp = Date.now(); // Get the current timestamp
  return `${prefix}-${newUser._id}-${timestamp}`;
}
if(!wallet){
  wallet = new Wallet({
    userId: newUser._id,
    cardNumber: generateCardNumber(), 
    balance: 0.0,   
    cardExpiry: cardExpiry,
    cardHolderName: newUser.username, 
    cardType: 'MasterCard', 
    transactions: []  

  })
}
wallet.balance += 50; // Adding referral bonus to the balance
wallet.transactions.push({
  transactionId: generateTransactionId(),
  date: new Date(),
  description: `Referral bonus for signing up using referral code`,
  type: "credit",
  amount: 50, // Fixed referral bonus amount
});

await wallet.save();
}
        await OTP.deleteOne({ email });
        req.session.user = true;
        req.session.username = username;
        const userId = await User.findOne({username})
        req.session.userId = userId._id;
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.render("users/verifyotp", { message: "An error occurred during OTP verification. Please try again." });
    }
}
let resendOtp = async (req, res) => {
    try {
      const email = req.session.email; // Get the email from session
      if (!email) {
        return res.render("users/login", { message: "Session expired. Please log in again." });
      }
      const otp = genarateotp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      const otpRecord = await OTP.findOneAndUpdate(
        { email, type: 'signup' },
        { otp, expiresAt },
        { upsert: true, new: true }
      );
      const emailsent = await otpTransport(email, otp);
      if (!emailsent) {
        return res.render("users/verifyotp", { message: "Failed to resend OTP. Please try again." });
      }
  
      res.render("users/verifyotp", { message: "OTP resent successfully." });
    } catch (err) {
      console.error(err);
      res.render("users/verifyotp", { message: "An error occurred while resending the OTP. Please try again." });
    }
  };
  
// login post

let postlogin = async (req,res)=>{
    try{
        const {username,password} = req.body;
        const user = await User.findOne({username})
        if(!user)  return res.status(404).json({ message: "User does not exist" });
            const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Password does not match" });
        }
         if(user.status == "blocked"){
          return res.status(403).json({ message: "User is blocked" });
         }
        req.session.user = true
        const userId = await User.findOne({username})
        req.session.userId = userId._id;
        res.status(200).json({ message: "Login successful", redirectUrl: "/" });
            
        }catch(err){
            res.status(500).send(`${err} error found`)
        }
    }
    const productdeatails = async (req,res)=>{
      
        try {
            const productId = req.params.productId;
            const categoryid = req.params.category;
            const products = await Product.findById(productId).populate("offerId").populate({path: 'categoryId', populate: {path: 'offerId',},})
            const category = await Product.find({
              category: categoryid, // Filter by category ID
              inStocks: true         // Ensure the product is in stock
          }).limit(4);
                      res.render("users/productdeatails",{products,category,userId:req.session.userId})
        } catch (error) {
            console.log(error);
            
        }
   
    }

    const forgetpasspost = async (req,res)=>{
        try {
            const{email} = req.body;
            const emailcheck = await User.findOne({email});
            if(!emailcheck){
                return res.render("users/forget",{message:"user not exist"})
            } 

            const otp = genarateotp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
            const otpRecord = new OTP({
                email,
                otp,
                type: 'signup', 
                expiresAt,
            });
            
            await otpRecord.save();
    
    
            const emailsent = await otpTransport(email,otp)
            if (!emailsent) {
                return res.render("users/login", { message: "Failed to send OTP" });
            }
            req.session.email = email;
            res.render("users/otpforget", { message: null});

        } catch (error) {
            console.log(err);
            
        }
     
    }

    let postverifyotpforget = async(req,res)=>{
        try {
            const {  otp } = req.body; // OTP entered by the user
            const email = req.session.email; 
            const otpRecord = await OTP.findOne({ email, otp, type: 'signup' }); // Find OTP record
    

            if (!otpRecord) {
                return res.render("users/otpforget", { message: "Invalid OTP or OTP expired." });
            }
            if (otpRecord.expiresAt < Date.now()) {
                return res.render("users/otpforget", { message: "OTP has expired. Please request a new one." });
            }
    
            res.render("users/newpassword",{email})
        } catch (err) {
            console.error(err);
            res.render("users/otpforget", { message: "An error occurred during OTP verification. Please try again." });
        }
    }

    const resendOtpForget = async (req,res) => {
      try {
        const email = req.session.email; 
        if (!email) {
          return res.render("users/login", { message: "Session expired. Please log in again." });
        }
        const otp = genarateotp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
        const otpRecord = await OTP.findOneAndUpdate(
          { email, type: 'signup' },
          { otp, expiresAt },
          { upsert: true, new: true }
        );
    
        // Send the new OTP via email
        const emailsent = await otpTransport(email, otp);
        if (!emailsent) {
          return res.render("users/verifyotp", { message: "Failed to resend OTP. Please try again." });
        }
    
        res.render("users/otpforget", { message: "OTP resent successfully." });
      } catch (err) {
        console.error(err);
        res.render("users/otpforget", { message: "An error occurred while resending the OTP. Please try again." });
      }
    }

    const newpassword = async (req,res)=>{
      console.log(req.body);
      
        try {
            const {password,email} = req.body;
 const saltRounds = 10;
 const hashedPassword = await bcrypt.hash(password,saltRounds)
 await User.updateOne({email:email},{$set:{password:hashedPassword}})
 res.render("users/login",{message:"password Changed Successfully"})
        } catch (error) {
            console.log(error);
            
        }
 
    }

  const Success = async (req,res) => {
    const {orderId} = req.params
    res.render("users/orderSuccess",{orderId})
  }

  const sort = async (req, res) => {
    
    const { sort, search, category, variant,price } = req.query;

    let sortQuery = {};
    if (sort === 'priceLowToHigh') sortQuery = { 'price': 1 };
    else if (sort === 'priceHighToLow') sortQuery = { 'price': -1 };
    else if (sort === 'popularity') sortQuery = { 'popularity': -1 };
    else if (sort === 'averageRatings') sortQuery = { 'rating': -1 };
    else if (sort === 'newArrivals') sortQuery = { 'createdAt': -1 };
    else if (sort === 'aToZ') sortQuery = { 'name': 1 };
    else if (sort === 'zToA') sortQuery = { 'name': -1 };

 
    const searchQuery = search ? { name: new RegExp(search, 'i') } : {};

  
    let priceQuery = {};
    if (price) {
        const [minPrice, maxPrice] = price.split('-');
        priceQuery = {
            price: {
                $gte: parseInt(minPrice),
                $lte: parseInt(maxPrice)
            }
        };
    }

    try {

        let categoryQuery = {};
        if (category) {
            categoryQuery = { category: category };
        }

        let variantQuery = {};
        if (variant) {
            variantQuery = { "variants.variant": variant };
        }

        let stockQueryy = {};
        stockQueryy = { inStocks: true };

        const products = await Product.find({ ...searchQuery, ...categoryQuery, ...priceQuery ,...variantQuery,...stockQueryy})
            .populate({
                path: 'categoryId',
                match: { is_listed: true } 
            })
            .sort(sortQuery)        
        const filteredProducts = products.filter(product => product.categoryId !== null);
        const totalProducts = filteredProducts.length;

        res.json({
            products: filteredProducts,
            totalProducts,
            userId:req.session.userId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

  
  const categoryFilter = async (req,res) => {
    try {
      const {categoryId} = req.params
      const category = await Category.findById(categoryId)
      const name = category.name;
      
      const products = await Product.find({ 
        categoryId: categoryId,  // Matches the specific categoryId
        inStocks: true            // Ensures the product is in stock
      });

      res.render("users/categoryshop", { products,name,userId:req.session.userId }); 
    } catch (error) {
      console.error("Error deleting Offer:", error);
      res.status(500).json({ success: false, message: "Internal server error" })
    }
  }


const downloadInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Fetch the order from the database
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ ok: false, message: "Order not found" });
    }
    res.status(200).json({ ok: true, order, message: "Invoice details retrieved successfully" });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};





    
module.exports = {login,
    signup,
    forget,
    newpassword,
    postsignup,
    postlogin,
    home,
    getShop,
    postverifyotp,
    resendOtp,
    loginsign,
    signlogin,
    productdeatails,
    google,
forgetPass,
forgetpasspost,
postverifyotpforget,
sort,
resendOtpForget,
categoryFilter,
Success,
downloadInvoice,
}