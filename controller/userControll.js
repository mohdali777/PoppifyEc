const {OTP,User,Address,Cart,Order} = require("../model/user/usermodel")
const{Product} = require("../model/admin/adminmodel")
const {Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const env = require("dotenv");
const { category } = require("./admincontroller");
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
      const categories = await Category.find({ is_listed: true });
        const listedCategoryNames = categories.map(category => category.name);
        const products = await Product.find({ category: { $in: listedCategoryNames } })
        res.render("users/shop", { products });
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
        const {username,email,password,phone} = req.body;
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
        const otpRecord = await OTP.findOne({ email, otp, type: 'signup' }); // Find OTP record

        console.log("Received OTP:", otp);
        console.log("Stored OTP Record:", otpRecord);
       
        

        // Check if OTP exists and is not expired
        if (!otpRecord) {
            return res.render("users/verifyotp", { message: "Invalid OTP or OTP expired." });
        }

        // Check if OTP has expired
        if (otpRecord.expiresAt < Date.now()) {
            return res.render("users/verifyotp", { message: "OTP has expired. Please request a new one." });
        }

        // const { username, password } = req.body;
        const username = req.session.username;
        const password = req.session.pass;
        const phone = req.session.phone;
        console.log(username,password);
        
        const saltRounds = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        
        const newUser = new User({ username, email, password: hashedPassword ,phone});
        await newUser.save();

        
        await OTP.deleteOne({ email });

        req.session.user = true;
        req.session.username = username;
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
  
      // Generate a new OTP
      const otp = genarateotp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set new expiration time
  
      // Update the OTP record or create a new one
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
        req.session.username = username;
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
            const products = await Product.findById(productId)
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
           
            
    
            // Check if OTP exists and is not expired
            if (!otpRecord) {
                return res.render("users/verifyotp", { message: "Invalid OTP or OTP expired." });
            }
    
            // Check if OTP has expired
            if (otpRecord.expiresAt < Date.now()) {
                return res.render("users/verifyotp", { message: "OTP has expired. Please request a new one." });
            }
    
            res.render("users/newpassword",{email})
    
        } catch (err) {
            console.error(err);
            res.render("users/verifyotp", { message: "An error occurred during OTP verification. Please try again." });
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
            const username = req.session.username;
            const usertake = await User.findOne({username})
            req.session.userId = usertake._id;
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
        const username = req.session.username; 
        const userId = await User.findOne({username})
        console.log(userId);   
        const user = await User.findById(userId._id).populate('addresses');
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
        const username = req.session.username;
        const user = await User.findOne({username})
        if (!username) {
          return res.status(400).json({ error: 'User not logged in' });
        }
        await User.findByIdAndUpdate(user._id, { $push: { addresses: newAddress._id } });
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
        const username = req.session.username; 
        const userId = await User.findOne({username})
        console.log(userId);   
        const user = await User.findById(userId._id).populate('addresses');
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
        const username = req.session.username;
        if (!username) {
          return res.status(400).json({ error: "User not logged in" });
        }
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        const { addressId } = req.params;
        const deletedAddress = await Address.findByIdAndDelete(addressId);
        if (!deletedAddress) {
          return res.status(404).json({ error: "Address not found" });
        }
        await User.findByIdAndUpdate(user._id, { $pull: { addresses: addressId } });
        res.status(200).json({ success: true, message: "Address deleted successfully" });
      } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
    
      const getCart = async (req, res) => {
        try {
          const username = req.session.username;
          if (!username) {
            return res.redirect('/login');
          }
          const user = await User.findOne({ username });
          if (!user) {
            return res.redirect('/login');
          }
          const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
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
            
            const { productId, price, quantity,variant,totalquantity} = req.body;
            const username = req.session.username;
          const user = await User.findOne({username})
          const userId = user._id;
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
            const existingItem = cart.items.find(item => item.productId.toString() === productId && item.variant === variant);
            if (existingItem ) {
              existingItem.quantity += parseInt(quantity);
              existingItem.total = existingItem.quantity * existingItem.price;
            } else {
              cart.items.push({
                productId,
                price,
                quantity,
                variant,
                totalquantity,
                total: price * quantity,
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
          const { productId, quantity ,id,variant} = req.body;
          const username = req.session.username ;
          const user = await User.findOne({username});
          const userId = user._id;
          const cart = await Cart.findOne({ userId });
          if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
          }
          const item = cart.items.find(item => item._id.toString() === id && item.variant === variant ) ;
      
          if (!item) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
          }
          item.quantity = quantity;
          item.total = item.price * quantity;
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
            const username = req.session.username;
            const user = await User.findOne({ username });
            console.log(user); 
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const cart = await Cart.findOne({ userId: user._id });
    
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
          const username = req.session.username;
          if (!username) {
              console.log("Username is not found in the session");
              return res.status(400).json({ success: false, message: 'Username is required' });
          }
 
          const user = await User.findOne({ username });
          if (!user) {
              console.log(`User with username ${username} not found`);
              return res.status(404).json({ success: false, message: 'User not found' });
          }
  
          console.log("User found:", user);

          const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
          if (!cart) {
              console.log("Cart not found for user", user._id);
              return res.status(404).json({ success: false, message: 'Cart not found' });
          }
  
          console.log("Cart found:", cart);
          const userAddress = await User.findById(user._id).populate('addresses');
          const address = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses[0] : null;
          const addresses = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses : null;
          res.render("users/checkout", { cart, address,addresses });
  
      } catch (error) {
          console.error("Error during checkout:", error);
          res.status(500).json({ success: false, message: 'Internal server error' });
      }
  };
  
    const placeOrder = async (req,res)=>{
      console.log(req.body);
      
      const {paymentMethod, useDefaultAddress, totalPrice,...newAddress} = req.body
      try {
        const username = req.session.username;
        const user = await User.findOne({username}) 
       console.log(user._id);
       const cart = await Cart.findOne({ userId: user._id })
       if (!cart || cart.items.length === 0) {
        console.log("empty cart");
        
        return res.status(400).json({ message: "Cart is empty" });
    }
       const cartItems = cart.items;
       console.log(cartItems);
       
        let finalAddress;
        if(useDefaultAddress){
          const address = await Address.findOne({_id:useDefaultAddress});
          finalAddress = address
        }else{
            finalAddress = newAddress;     
        }
        console.log(finalAddress);
        const orderId = `ORD${Date.now()}`;

        const order = new Order({
          orderId,
          userId:user._id,
          paymentMethod,
          totalPrice,
          cartItems,
          address:finalAddress,
          status:"pending",
        })
      for (let item of cartItems) {
        const product = await Product.findById(item.productId);
        if (product) {
            const variant = product.variants.find(v => v.variant === item.variant);
            if (variant) {
                variant.quantity -= item.quantity;
                if (variant.quantity < 0) variant.quantity = 0;
                await product.save(); 
            }
        }
    }
    await Cart.updateOne({ userId: user._id }, { $set: { items: [] ,totalQuantity:0,totalPrice:0} });
    await order.save();
    res.status(201).json({ message: "Order placed successfully", order });
   
      } catch (error) {
        console.log(error);
        
      }
    }




    const getOrdersPage = async (req, res) => {
      try {
        const username = req.session.username; 
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).send("User not found");
        }
        const orders = await Order.find({ userId: user._id }).populate("cartItems.productId");    
        res.render("users/myorders", { orders });
      } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong");
      }
    };




    const cancelOrder = async (req, res) => {
      try {
        console.log(req.params.orderId);       
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
                      await product.save(); 
                  }
              }
          }
          await order.save();
          res.status(200).json({ message: "Order cancelled successfully", order });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: "An error occurred while canceling the order" });
      }
  };
  const sort = async (req,res) => {
    const { sort, search } = req.query;

    let sortQuery = {};
    if (sort === 'priceLowToHigh') sortQuery = { 'price': 1 };
    else if (sort === 'priceHighToLow') sortQuery = { 'price': -1 };
    else if (sort === 'popularity') sortQuery = { 'popularity': -1 };
    else if (sort === 'averageRatings') sortQuery = { 'rating': -1 };
    else if (sort === 'newArrivals') sortQuery = { 'createdAt': -1 };
    else if (sort === 'aToZ') sortQuery = { 'name': 1 };
    else if (sort === 'zToA') sortQuery = { 'name': -1 };

    const searchQuery = search ? { name: new RegExp(search, 'i') } : {};

    try {
        const products = await Product.find(searchQuery).sort(sortQuery);
        res.json({ products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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
deleteAddress}