const {OTP,User} = require("../model/user/usermodel")
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
        const {username,email,password} = req.body;
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
        console.log(username,password);
        
        const saltRounds = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        
        const newUser = new User({ username, email, password: hashedPassword });
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
            const user = await User.findOne({username})
             res.render("users/accountdeatails",{user})
        } catch (error) {
            console.log(error);
            
        }
   
    }
    const addressbook = async (req,res)=>{
        res.render("users/addressbook")
       }



module.exports = {login,
    signup,
    forget,
    newpassword,
    postsignup,
    postlogin,
    home,
    postverifyotp,
    resendOtp,
    loginsign,
    signlogin,
    productdeatails,
    google,
manageAccount,
addressbook,
forgetPass,
forgetpasspost,
postverifyotpforget}