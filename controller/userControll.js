const {OTP,User,Address,Cart,Order,Wishlist,Return,Wallet} = require("../model/user/usermodel")
const{Product, Coupen, Category} = require("../model/admin/adminmodel")
// const {Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const env = require("dotenv");
const { category } = require("./admincontroller");
const crypto = require('crypto');
const Razorpay = require('razorpay');




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
        const products = await Product.find({ category: { $in: listedCategoryNames } }).limit(4);
        const productss = await Product.find({ category: { $in: listedCategoryNames } }).skip(4);
        res.render("users/home", { products, categories, productss });
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
        res.render("users/shop", { products ,categories});
    } catch (error) {
      console.log(error);
      
    }
   }

   let loginsign = async (req,res)=>{
   res.redirect("/signup")
   }
   let signlogin = async(req,res)=>{
    console.log(req.session.username);
    
   res.redirect("/login")
   }
   const forgetPass = async (req,res)=>{
    res.render("users/forget",{message:false})
   }

   

   const google = async(req,res)=>{
    const categories = await Category.find({ is_listed: true });
    const listedCategoryNames = categories.map(category => category.name);
    const products = await Product.find({ category: { $in: listedCategoryNames } }).limit(4);
    const productss = await Product.find({ category: { $in: listedCategoryNames } }).skip(4);
    req.session.user = true;
    const username = req.user.username;
    console.log(username);
    const userId = await User.findOne({username});
    console.log(userId);
    req.session.userId = userId._id;
    
    res.render("users/home", { products, categories, productss });
      
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
        console.log("start"+info )
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
            console.log("error");
           return res.render("users/login",{message:"user exist"})
        }
        if(name){
            return res.render("users/signup",{message:"Username Exist"})
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
        console.log("otp sent",otp);
        req.session.email = email;
        req.session.pass = password;
        req.session.username = username;
        req.session.phone = phone;
        req.session.reffer = referralCode;
        res.render("users/verifyotp", { message: null});
       
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
        console.log(username,password);
        
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
        console.log(userId);
        req.session.userId = userId._id;

        
        
        console.log('OTP verified, redirecting to home...');
        
        
        res.redirect("/home");

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
  
      console.log("New OTP sent:", otp);
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
        if(!user) return res.render('users/login',{message:"user not exist"})
            const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('users/signup', { message : 'Password does not match' });
        }
         if(user.status == "blocked"){
            return res.render('users/login', { message : 'User is blocked' });
         }
        console.log(req.body);
        req.session.user = true
        const userId = await User.findOne({username})
        console.log(userId);
        req.session.userId = userId._id;
        console.log(req.session.username);
            res.redirect('/home')
            console.log(req.session.username);
            
        }catch(err){
            res.status(500).send(`${err} error found`)
        }
    }
    const productdeatails = async (req,res)=>{
        try {
            const productId = req.params.productId;
            const categoryid = req.params.category;
            const products = await Product.findById(productId).populate("offerId").populate({path: 'categoryId', populate: {path: 'offerId',},})
            const category = await Product.find({category:categoryid}).limit(4)
            res.render("users/productdeatails",{products,category})
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
            console.log("otp sent",otp);
            req.session.email = email;
            res.render("users/otpforget", { message: null});

        } catch (error) {
            console.log(err);
            
        }
     
    }

    let postverifyotpforget = async(req,res)=>{
        try {
            const {  otp } = req.body; // OTP entered by the user
            console.log(otp);
            const email = req.session.email; 
            const otpRecord = await OTP.findOne({ email, otp, type: 'signup' }); // Find OTP record
    
            console.log("Received OTP:", otp);
            console.log("Stored OTP Record:", otpRecord);
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
    
        console.log("New OTP sent:", otp);
        res.render("users/otpforget", { message: "OTP resent successfully." });
      } catch (err) {
        console.error(err);
        res.render("users/otpforget", { message: "An error occurred while resending the OTP. Please try again." });
      }
    }

    const newpassword = async (req,res)=>{
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


    const manageAccount = async (req,res)=>{
        try {
            const userId = req.session.userId;
            const usertake = await User.findById(userId)
             res.render("users/accountdeatails",{usertake,message:false})
        } catch (error) {
            console.log(error);
            
        }
   
    }

    const changedeatails = async (req, res) => {
        try {
            const { id, username, email, phone } = req.body;
            const usernameCheck = await User.findOne({ username });
            const emailcheck = await User.findOne({email});
            if (usernameCheck && usernameCheck._id.toString() !== id) {
                const usertake = await User.findOne({ _id: id });
                return res.render("users/accountdeatails", {message: "Username already exists. Please choose another one.",usertake});
            }
            if (emailcheck && emailcheck._id.toString() !== id) {
                const usertake = await User.findOne({ _id: id });
                return res.render("users/accountdeatails", {message: "email already exists. Please choose another one.",usertake});
            }
            await User.updateOne({ _id: id },{ $set: { username, email, phone } });
            const usertake = await User.findOne({ _id: id });
            res.render("users/accountdeatails", {usertake,message: "Details updated successfully."});
    
        } catch (error) {
            console.log("Error updating details:", error);
            res.status(500).send("Internal Server Error");
        }
    };
    const savedAddress = async (req,res) => {
      try {
        const userId = req.session.userId;    
        const user = await User.findById(userId).populate('addresses');
        if (!user) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const address = user.addresses.length > 0 ? user.addresses : null;
        res.render("users/savedaddress",{address})
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve addresses.', error });
      }
    
    }
    const addaddress = async (req,res) => {
    res.render("users/addaddress")

    }
    const addaddresspost = async (req, res) => {
      const { name, companyname, streetaddress, appartment, city, phone, email } = req.body;
    
      try {
        // Create a new address document
        const newAddress = new Address({
          name,
          companyname,
          streetaddress,
          appartment,
          city,
          phone,
          email
        });
        await newAddress.save();
        const userId = req.session.userId;
        if (!userId) {
          return res.status(400).json({ error: 'User not logged in' });
        }
        await User.findByIdAndUpdate(userId, { $push: { addresses: newAddress._id } });
        res.redirect("/saved-address")
      } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    };
    
    const editaddressGet = async (req, res) => {
      const { addressId } = req.params; 
      try {
        const address = await Address.findById(addressId);
        if (!address) {
          return res.status(404).json({ error: 'Address not found' });
        }
        res.render("users/editaddress", { address });
      } catch (error) {
        console.error("Error fetching address:", error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };

    const editaddressPost = async (req,res) => {
      const { name, companyname, streetaddress, appartment, city, phone, email ,id} = req.body;
      try {
        await Address.findByIdAndUpdate(id,{$set:{name, companyname, streetaddress, appartment, city, phone, email}})
        const userId = req.session.userId;   
        const user = await User.findById(userId).populate('addresses');
        if (!user) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const address = user.addresses.length > 0 ? user.addresses : null;
        res.render("users/savedaddress",{address})
      } catch (error) {
        console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
      }
    }



    const deleteAddress = async (req, res) => {
      try {
        const userId = req.session.userId;
        if (!userId) {
          return res.status(400).json({ error: "User not logged in" });
        }
        const { addressId } = req.params;
        const deletedAddress = await Address.findByIdAndDelete(addressId);
        if (!deletedAddress) {
          return res.status(404).json({ error: "Address not found" });
        }
        await User.findByIdAndUpdate(userId, { $pull: { addresses: addressId } });
        res.status(200).json({ success: true, message: "Address deleted successfully" });
      } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
    
      const getCart = async (req, res) => {
        try {
          const userId = req.session.userId;
          if (!userId) {
            return res.redirect('/login');
          }
          const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
          if (!cart) {
            return res.render('users/cart', { cart: { items: [], totalPrice: 0, totalQuantity: 0 } });
          }
          res.render('users/cart', {
            cart, 
            success: true, 
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'Internal server error' });
        }
      };
      





      const addtocartPost = async(req,res)=>{
        try {
            console.log(req.body);
            const { productId, price, quantity,variant,totalquantity,discoundOfferPrice,color,colorQuantity} = req.body;
            const userId = req.session.userId;
          console.log(userId);
            let cart = await Cart.findOne({ userId });
        
            if (!cart) {
              cart = new Cart({
                userId,
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
              });
            }
            if(cart.items.length > 10){
                return res.json({
                    success: false,
                    message: 'You cannot add more than 10 different products to your cart.',
                  });
            }
            const existingItem = cart.items.find(item => item.productId.toString() === productId && item.variant === variant && item.color === color);
            if (existingItem ) {
              // const totalQuantityAfterAddition = existingItem.quantity + parseInt(quantity);
              const totalQuantityAfterAddition = existingItem.quantity + parseInt(quantity);
              if(totalQuantityAfterAddition > existingItem.colorQuantity){
              return res.status(400).json({
                error: `You cannot add more than ${existingItem.totalquantity} items. Current quantity in cart: ${existingItem.quantity}, available stock: ${existingItem.totalquantity}`})}
              existingItem.quantity += parseInt(quantity);
              existingItem.total = existingItem.quantity * existingItem.price;
              existingItem.totalOfferPrice = existingItem.quantity * existingItem.discoundOfferPricePer
            } else {
              cart.items.push({
                productId,
                price,
                quantity,
                variant,
                totalquantity,
                total: price * quantity,
                discoundOfferPricePer:discoundOfferPrice,
                totalOfferPrice:discoundOfferPrice*quantity,
                color:color,
                colorQuantity:colorQuantity
                
              });
            }
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
            await cart.save();
            res.status(200).json({ success: true, message: 'Product added to cart' });
          } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Internal server error' });
          }
      }






      const updateCart = async (req, res) => {
        try {
          console.log(req.body);
          
          const {  quantity,id,variant,color} = req.body;

          const userId = req.session.userId;
          const cart = await Cart.findOne({ userId });
          if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
          }
          const item = cart.items.find(item => item._id.toString() === id && item.variant === variant && item.color === color) ;
      
          if (!item) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
          }
          item.quantity = quantity;
          item.total = item.price * quantity;
          item.totalOfferPrice = item.quantity * item.discoundOfferPricePer
          cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
          await cart.save();
          res.json({ success: true, message: 'Cart updated successfully' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'Internal server error' });
        }
      };


      const deletecart = async (req, res) => {
        console.log(req.body); 
        try {
            const { productId ,variant,id} = req.body;
            const userId = req.session.userId;
            if (!userId) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const cart = await Cart.findOne({ userId: userId });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }
            const item = cart.items.find(item => item._id.toString() === id ) ;
            console.log(item);
            cart.items = cart.items.filter(item => item._id.toString() !== id );
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
            await cart.save();
    
            return res.json({ success: true, message: 'Item removed from cart successfully', cart });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };



    const checkOut = async (req, res) => {
      try {
        const userId = req.session.userId;
          if (!userId) {
              console.log("User is not found");
              return res.status(400).json({ success: false, message: 'User is not found' });
          }
            console.log("User found:", userId);

          const cart = await Cart.findOne({ userId: userId}).populate("items.productId");
          if (!cart) {
              console.log("Cart not found for user", userId);
              return res.status(404).json({ success: false, message: 'Cart not found' });
          }
  
          console.log("Cart found:", cart);
          const userAddress = await User.findById(userId).populate('addresses');
          const address = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses[0] : null;
          const addresses = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses : null;
          res.render("users/checkout", { cart, address,addresses });
  
      } catch (error) {
          console.error("Error during checkout:", error);
          res.status(500).json({ success: false, message: 'Internal server error' });
      }
  };


  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,  // Razorpay Key ID
    key_secret: process.env.RAZORPAY_SECRET_KEY,  // Razorpay Key Secret
});
  


    const placeOrder = async (req,res)=>{
      console.log(req.body);
      
      const {paymentMethod, useDefaultAddress, totalPrice,coupenId,coupenDiscountAmount,...newAddress} = req.body
      try {
        const userId = req.session.userId;
       const cart = await Cart.findOne({ userId: userId })
       if (!cart || cart.items.length === 0) {
        console.log("empty cart");
        
        return res.status(400).json({ message: "Cart is empty" });
    }
    if(!newAddress){
      return res.status(400).json({ message: "please Add Address" });
    }
       const cartItems = cart.items;
      const cartDiscount = cart.CartTotalOffer;
       console.log(cartItems);
       
        let finalAddress;
        if(useDefaultAddress){
          const address = await Address.findOne({_id:useDefaultAddress});
          finalAddress = address
        }else{
            finalAddress = newAddress;     
        }
        console.log(finalAddress);
        if(!finalAddress){
          return res.status(400).json({ message: "please Add Address" });
        }
        const orderId = `ORD${Date.now()}`;

        let razorpayOrderId = null;

        // If payment method is Razorpay, create a Razorpay order
        if (paymentMethod === "RazorPay") {
          try {
            console.log("razorpay");
            
              const razorpayOrder = await razorpay.orders.create({
                  amount: Math.round(totalPrice * 100), // Amount in paisa
                  currency: "INR",
                  receipt: orderId,
              });
              razorpayOrderId = razorpayOrder.id;
              console.log(  razorpayOrder.id);
              
          } catch (error) {
              console.error("Error creating Razorpay order:", error);
              return res.status(500).json({ message: "Failed to initiate Razorpay payment." });
          }
      }

      let paymentStatus ;

      if (paymentMethod === 'Wallet') {
       
        const wallet = await Wallet.findOne({ userId });
  
        if (!wallet) {
          return res.status(404).json({ message: 'Wallet not found' });
        }
        if (wallet.balance < totalPrice) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        wallet.balance -= totalPrice;
  
        wallet.transactions.push({
          transactionId: `TXN-${Date.now()}`,
          amount: totalPrice,
          description: `Order Payment of ${orderId}`,
          type: 'debit',
        });
         paymentStatus = "Paid"
        await wallet.save();
      }

        const order = new Order({
          orderId,
          userId:userId,
          paymentMethod,
          totalPrice,
          cartItems,
          address:finalAddress,
          razorpay: {
            orderId: razorpayOrderId, // Save Razorpay order ID
          },
          orderStatus:"Pending",
          paymentStatus,
          coupenId:coupenId,
          coupenDiscountAmount:coupenDiscountAmount,
          CartTotalOffer:cartDiscount
        })
      for (let item of cartItems) {
        const product = await Product.findById(item.productId);
        if (product) {
            const variant = product.variants.find(v => v.variant === item.variant);
            if (variant) {
                variant.quantity -= item.quantity;
                if (variant.quantity < 0) variant.quantity = 0;
                let color = variant.colors.find(color => color.color === item.color)
                if(color){
                  color.quantity -= item.quantity
                }
                await product.save(); 
            }
        }
    }
    await Cart.updateOne({ userId: userId }, { $set: { items: [] ,totalQuantity:0,totalPrice:0} });
    await order.save();
    req.session.orderId = orderId;

    

    res.status(201).json({ 
      message: "Order created successfully", 
      order, 
      razorpayOrderId, 
      key_id: process.env.RAZORPAY_KEY_ID,
      orderId
    });
   
 
   

      } catch (error) {
        console.log(error);
        
      }
    }




    const getOrdersPage = async (req, res) => {
      try {
        const userId = req.session.userId;
        if (!userId) {
          return res.status(404).send("User not found");
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const orders = await Order.find({ userId: userId })
          .sort({ createdAt: -1 }) 
          .skip(skip)   
          .limit(limit) 
          .populate("cartItems.productId");
        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / limit); 
        res.render("users/myorders", {
          orders,
          currentPage: page,
          totalPages: totalPages
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong");
      }
    };
    




    const cancelOrder = async (req, res) => {
      try {
        console.log(req.params.orderId); 
        const userId = req.session.userId;      
          const orderId = req.params.orderId;
          const order = await Order.findById(orderId);
          if (!order) {
              return res.status(404).json({ message: "Order not found" });
          }
          if (order.orderStatus === "Cancelled") {
              return res.status(400).json({ message: "Order has already been cancelled" });
          }
          order.orderStatus = "Cancelled";
          for (let item of order.cartItems) {
              const product = await Product.findById(item.productId);
  
              if (product) {
                  const variant = product.variants.find(v => v.variant === item.variant);
                  if (variant) {
                      variant.quantity += item.quantity; 
                  let color = variant.colors.find(color => color.color === item.color)
                if(color){
                  color.quantity += item.quantity
                }
                      await product.save(); 
                  }
              }
          }

          if (order.paymentMethod === "RazorPay" && order.paymentStatus == "Paid" || order.paymentMethod === "Wallet" && order.paymentStatus == "Paid" ) {
            const wallet = await Wallet.findOne({ userId });
          if(!wallet){
              return res.status(404).json({ message: "Wallet not found for the user." });
          }
            if (wallet) {
                if (typeof order.totalPrice !== 'number' || isNaN(order.totalPrice)) {
                    throw new Error(`Invalid totalAmount: ${order.totalPrice}`);
                }
                wallet.balance += order.totalPrice;
                wallet.transactions.push({
                    transactionId: `Refund-${order._id}`,
                    date: new Date(),
                    description: `Refund for cancelled order ${order._id}`,
                    type: "credit", 
                    amount: order.totalPrice,
                });
                order.paymentStatus = "Refunded"
                await wallet.save();
                await order.save();
            } else {
                console.error("Wallet not found for user:", userId);
                return res.status(404).json({ message: "User wallet not found" });
            }
        }
        
         

          await order.save();
          res.status(200).json({ message: "Order cancelled successfully", order });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: "An error occurred while canceling the order" });
      }
  };



  const Success = async (req,res) => {
    const {orderId} = req.params
    res.render("users/orderSuccess",{orderId})
  }

  const sort = async (req, res) => {
    const { sort, search, category, price, page = 1, limit = 8 } = req.query;

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
        const products = await Product.find({ ...searchQuery, ...categoryQuery, ...priceQuery })
            .populate({
                path: 'categoryId',
                match: { is_listed: true } 
            })
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        
        const filteredProducts = products.filter(product => product.categoryId !== null);
        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);

        res.json({
            products: filteredProducts,
            totalProducts,
            totalPages,
            currentPage: page,
            productsPerPage: limit
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};


 const getwishlist = async (req,res) => {
  try {
    const userId = req.session.userId;
    if(!userId){
      return res.status(401).json({message:"user not authenticated"})
    }
    const wishlist = await Wishlist.findOne({userId:userId}).populate("items.productId")
    res.render("users/wishlist",{wishlist})
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
 }


  const addtowishlist = async (req,res) => {
    console.log("s");
    
    try {
      const {productId} = req.params
      if(!productId){
        return res.status(400).json({success:false,message:"product id is required"})
      }
      const userId = req.session.userId;
      if(!userId){
        return res.status(401).json({success:false,message:"user not authenticated"})
      }
      let wishlist = await Wishlist.findOne({userId:userId})
      if(!wishlist){
        wishlist = new Wishlist({
          userId,
          items:[]
        })
      }
      console.log(productId);
      const existingItem = wishlist.items.find((product)=> product.productId.toString() == productId)
      console.log("item",existingItem);
      

      if(existingItem){
        return res.status(401).json({success:false,message:"product alredy in wishlist"})
      }
      wishlist.items.push({productId})
      await wishlist.save();
      const product = await Product.findByIdAndUpdate(productId,{$set:{WishListVerification:true}})
      res.status(200).json({success:true,message:"product added successfully"})
    } catch (error) {
      console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
    }
  }
  const removeWishlist = async (req,res) => {
    try {
      const {productId} = req.params;
      const userId = req.session.userId;
      if(!userId){
        return res.status(401).json({success:false,message:"user not authenticated"})
      } 
      let wishlist = await Wishlist.findOne({userId:userId});
       wishlist.items = wishlist.items.filter((pr)=> pr.productId.toString()!== productId)
      await wishlist.save()
      const product = await Product.findByIdAndUpdate(productId,{$set:{WishListVerification:false}})
      return res.status(200).json({success:true,message:"removed sucessfully"})
    } catch (error) {
      console.log(error);
      
    }
  }
  const returnrequiest = async (req,res) => {
    try {
      const {productId,orderId} = req.params;
      const userId = req.session.userId;
      console.log(req.body);
      const {reason,itemId} = req.body;
      if (!productId || !orderId || !userId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'something went wrong',
        });
      }
      const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const items = order.cartItems.find( (item) => item._id.toString() == itemId )
    items.reason = reason;
    items.status = "Pending"
    await order.save()
    console.log(items);
    
    const returnrequiest = new Return({
     orderId,
     productId,
     userId,
     reason
    })

 await returnrequiest.save();
 res.status(201).json({
  success: true,
  message: 'Return request submitted successfully.',
});

  } catch (error) {
     console.error('Error processing return request:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
  }
  const applyCoupens = async (req,res) => {
    try {
      console.log(req.body);
      const {couponCode,totalPrice} = req.body;
      const userId = req.session.userId;
      const coupen = await Coupen.findOne({couponCode})
      if(!coupen){
        return res.status(404).json({ success: false, message: "Invalid coupon code." });
      }
      const user = coupen.userId.find((user) => user.toString() == userId)
      if(user){
        return res.status(400).json({ success: false, message: "Coupon already used by this user." })
      }
      const now = new Date();
      if (now > coupen.expiryDate) {
        return res.status(400).json({ success: false, message: "Coupon code has expired." }); 
      }
      const redeem = coupen.status == "redeemed";
      if(redeem){
        console.log("coupen");
        
        return res.status(400).json({ success: false, message: "Coupon code has redeemed." });
      }
      const discount = coupen.discount; 
    const originalTotal = totalPrice; 
    console.log(originalTotal);
    const newTotal = originalTotal - (originalTotal * (discount / 100));

    const totalDiscount = originalTotal - newTotal
    console.log(totalDiscount);


    console.log(newTotal);
    console.log(totalDiscount);
    coupen.count++;
    if (coupen.count >= 3) {
      coupen.status = "redeemed"; 
    }
    coupen.userId.push(userId)



    const coupenId = coupen._id;
    console.log(coupenId);
    
    await coupen.save();
    return res.status(200).json({ success: true, message: `Coupon applied! You saved ${discount}%.`, newTotal ,coupenId,totalDiscount});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
    }
  }
  


  
  const verifyPayment = async (req, res) => {
    console.log("Entering verify payment part");
    console.log(req.body);
  
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    // Ensure session contains the correct orderId
    const orderId = req.session.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID not found in session" });
    }
  
    console.log("Order ID from session:", orderId);
  
    // Generate the expected signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");
  
    // Find the order based on the orderId
    const order = await Order.findOne({ orderId });
    console.log("Order found:", order);
  
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
  
    // Check if the signatures match
    if (expectedSignature === razorpaySignature) {
      // Update the order as successfully paid and return the updated document
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            "razorpay.paymentId": razorpayPaymentId,
            "razorpay.signature": razorpaySignature,
            paymentStatus: "Paid",
            orderStatus: "Pending", // Update the status accordingly
          },
        },
        { new: true } // This option returns the updated document
      );
  
      console.log("Payment verified and order updated", updatedOrder);
      res.status(200).json({ success:true,message: "Payment verified successfully", updatedOrder });
    } else {
      // Update the order as failed and cancelled
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            "razorpay.paymentId": razorpayPaymentId,
            "razorpay.signature": razorpaySignature,
             paymentStatus: "Failed",
            orderStatus: "Cancelled",
          },
        },
        { new: true }
      );
  
      console.log("Signature mismatch - payment verification failed", updatedOrder);
      res.status(400).json({ message: "Payment verification failed" });
    }
  };

  const getWallet = async (req,res) => {
    try {
      const userId = req.session.userId;
      if(!userId){
        return res.status(401).json({success:false,message:"user not authenticated"})
      } 
      function generateCardNumber() {
        const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
        const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
        return cardNumber;
    }
  
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
    const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;
  
  
      let wallet = await Wallet.findOne({userId})
      const user = await User.findById(userId)
      if(!wallet){
        wallet = new Wallet({
          userId: userId,
          cardNumber: generateCardNumber(), 
          balance: 0.0,   
          cardExpiry: cardExpiry,
          cardHolderName: user.username, 
          cardType: 'MasterCard', 
          transactions: []  
  
        })
      }
  
      await wallet.save();
      res.render("users/wallet",{wallet})
    } catch (error) {
      console.error("Error in getWallet:", error);
      res.status(500).json({ success: false, message: "An error occurred while fetching wallet data." });
    }
   
  }
  const categoryFilter = async (req,res) => {
    try {
      const {categoryId} = req.params
      console.log(categoryId);
      const category = await Category.findById(categoryId)
      const name = category.name;
      
      const products = await Product.find({categoryId:categoryId})
      console.log(products);
      
      res.render("users/categoryshop", { products,name }); 
    } catch (error) {
      console.error("Error deleting Offer:", error);
      res.status(500).json({ success: false, message: "Internal server error" })
    }
  }
    
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
manageAccount,
forgetPass,
forgetpasspost,
postverifyotpforget,
changedeatails,
getCart,
addtocartPost,updateCart,
deletecart,
checkOut,
placeOrder,
getOrdersPage,
cancelOrder,
sort,
savedAddress,
addaddress,
addaddresspost,
editaddressGet,
editaddressPost,
deleteAddress,
resendOtpForget,
addtowishlist,
getwishlist,
removeWishlist,
returnrequiest,
applyCoupens,
verifyPayment,
getWallet,
categoryFilter,
Success}