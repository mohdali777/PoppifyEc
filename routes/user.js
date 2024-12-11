const express = require("express")
const router = express.Router()
const userControl = require("../controller/userControll")
const sessions = require("../middleware/usersession")
const passport = require("passport")
const { Session } = require("express-session")


// getMethods
router.get("/login",sessions.islogin,userControl.login)
router.get("/signup",sessions.islogin,userControl.signup)
router.get("/forget",userControl.forget)
router.get("/verifyOtp",userControl.verifyOtp)
router.get("/newpassword",userControl.newpassword)
router.get("/home",sessions.sessionCheck,userControl.home)
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"] 
  }));
  router.get("/google/callback", 
    passport.authenticate("google", {
      failureRedirect: "/login"
    }),userControl.google);
  router.get("/productdeatails/:productId/:category",userControl.productdeatails)
  router.get("/resend-otp",userControl.resendOtp)
  router.get("/signout",(req,res)=>{
   req.session.destroy();
   res.redirect("/login")
  })
  router.get("/login-sign",userControl.loginsign)
  router.get("/sign-login",userControl.signlogin)

// postMethods
router.post("/signup",userControl.postsignup)
router.post("/login",userControl.postlogin)
router.post("/verify-otp",userControl.postverifyotp)



module.exports = router