const express = require("express")
const router = express.Router()
const userControl = require("../controller/userControll")
const userControl2 = require("../controller/userControl2")
const sessions = require("../middleware/usersession")
const passport = require("passport")



// getMethods
router.get("/login",sessions.islogin,userControl.login)
router.get("/signup",sessions.islogin,userControl.signup)
router.get("/forgetpass",userControl.forgetPass)
router.get("/newpassword",userControl.newpassword)
router.get("/home",userControl.home)
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"] 
  }));
  router.get("/google/callback", 
    passport.authenticate("google", {
      failureRedirect: "/login"
    }),userControl.google);
  router.get("/productdeatails/:productId/:category",userControl.productdeatails)
  router.get("/resend-otp",userControl.resendOtp)
  router.get("/resend-otp-forget",userControl.resendOtpForget)
  router.get("/signout",(req,res)=>{
   req.session.destroy();
   res.redirect("/login")
  })
  router.get("/login-sign",userControl.loginsign)
  router.get("/sign-login",userControl.signlogin)
  router.get("/accountmangement",sessions.sessionCheck,userControl.manageAccount)
  router.get("/saved-address",sessions.sessionCheck,userControl.savedAddress)
  router.get("/add-address",sessions.sessionCheck,userControl.addaddress)
  router.get("/cart",sessions.sessionCheck,userControl.getCart)
  router.get("/check-out",sessions.sessionCheck,userControl.checkOut)
  router.get("/myorders",sessions.sessionCheck,userControl.getOrdersPage)
  router.get("/shop",userControl.getShop)
  router.get("/products-shop",userControl.sort)
  router.get("/edit-address/:addressId",sessions.sessionCheck,userControl.editaddressGet)
  router.get("/getwishlist",sessions.sessionCheck,userControl.getwishlist)
  router.get("/wallet", sessions.sessionCheck,userControl.getWallet)
  router.get("/categoryFilter/:categoryId",userControl.categoryFilter)
  router.get("/succes-page/:orderId",sessions.sessionCheck,userControl.Success)
  router.get("/verify-Otp-page/:otp",(req,res)=>{
    const otp = req.params.otp; 
    res.render("users/verifyotp", { message: null});
  })
  router.get("/fethWishlsit",sessions.sessionCheck,userControl.fetchWishlistData)
  router.get("/transactionDeatails",userControl.getTransaction)
// postMethods
router.post("/signup",userControl.postsignup)
router.post("/login",userControl.postlogin)
router.post("/verify-otp",userControl.postverifyotp)
router.post("/forgetpass",userControl.forgetpasspost)
router.post("/verify-otp-forget",userControl.postverifyotpforget)
router.post("/newpassword",userControl.newpassword)
router.post("/changedeatails",sessions.sessionCheck,userControl.changedeatails)
router.post("/add-to-Cart",sessions.sessionCheck,userControl.addtocartPost)
router.post("/update-cart",sessions.sessionCheck,userControl.updateCart)
router.post("/delete-cart-item",sessions.sessionCheck,userControl.deletecart)
router.post("/place-order",sessions.sessionCheck,userControl.placeOrder)
router.post("/orders-cancel/:orderId",sessions.sessionCheck,userControl.cancelOrder)
router.post("/add-address-post",sessions.sessionCheck,userControl.addaddresspost)
router.post("/edit-address-post",sessions.sessionCheck,userControl.editaddressPost)
router.post("/addwishlist/:productId",sessions.sessionCheck,userControl.addtowishlist)
router.post("/removewishlis/:productId",sessions.sessionCheck,userControl.removeWishlist)
router.post("/orders/:orderId/return/:productId",sessions.sessionCheck,userControl.returnrequiest)
router.post("/apply-coupon",sessions.sessionCheck,userControl.applyCoupens)
router.post("/verify-payment",sessions.sessionCheck,userControl.verifyPayment)
router.post("/repay-order",sessions.sessionCheck,userControl.repayOrder)
router.post("/download-invoice/:orderId",sessions.sessionCheck,userControl.downloadInvoice)
router.post("/addmoney",sessions.sessionCheck,userControl.addMoneyWallet)



router.delete("/delete-address/:addressId",sessions.sessionCheck,userControl.deleteAddress)




module.exports = router