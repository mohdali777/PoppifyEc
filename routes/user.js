const express = require("express")
const router = express.Router()
const userControl = require("../controller/userControll")
const sessions = require("../middleware/usersession")
const passport = require("passport")
const { Session } = require("express-session")
const { route } = require("./admin")


// getMethods
router.get("/login",sessions.islogin,userControl.login)
router.get("/signup",sessions.islogin,userControl.signup)
router.get("/forgetpass",userControl.forgetPass)
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
  router.get("/accountmangement",sessions.sessionCheck,userControl.manageAccount)
  router.get("/saved-address",userControl.savedAddress)
  router.get("/add-address",userControl.addaddress)
  router.get("/cart",userControl.getCart)
  router.get("/check-out",userControl.checkOut)
  router.get("/myorders",userControl.getOrdersPage)
  router.get("/shop",userControl.getShop)
  router.get("/products-shop",userControl.sort)
  router.get("/edit-address/:addressId",userControl.editaddressGet)
// postMethods
router.post("/signup",userControl.postsignup)
router.post("/login",userControl.postlogin)
router.post("/verify-otp",userControl.postverifyotp)
router.post("/forgetpass",userControl.forgetpasspost)
router.post("/verify-otp-forget",userControl.postverifyotpforget)
router.post("/newpassword",userControl.newpassword)
router.post("/changedeatails",userControl.changedeatails)
router.post("/add-to-Cart",userControl.addtocartPost)
router.post("/update-cart",userControl.updateCart)
router.post("/delete-cart-item",userControl.deletecart)
router.post("/place-order",userControl.placeOrder)
router.post("/orders-cancel/:orderId",userControl.cancelOrder)
router.post("/add-address-post",userControl.addaddresspost)
router.post("/edit-address-post",userControl.editaddressPost)



router.delete("/delete-address/:addressId",userControl.deleteAddress)




module.exports = router