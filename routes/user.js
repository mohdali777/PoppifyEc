const express = require("express")
const router = express.Router()
const userControl = require("../controller/userControll")
const userControl2 = require("../controller/userControl2")
const userControl3 = require("../controller/userControler3")
const sessions = require("../middleware/usersession")
const passport = require("passport")



// getMethods userControl1
router.get("/login",sessions.islogin,userControl.login)
router.get("/signup",sessions.islogin,userControl.signup)
router.get("/forgetpass",userControl.forgetPass)
router.get("/newpassword",userControl.newpassword)
router.get("/",userControl.home)
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
  router.get("/shop",userControl.getShop)
  router.get("/products-shop",userControl.sort)
  router.get("/categoryFilter/:categoryId",userControl.categoryFilter)
  router.get("/succes-page/:orderId",sessions.sessionCheck,userControl.Success)
  router.get("/verify-Otp-page/:otp",(req,res)=>{
    const otp = req.params.otp; 
    res.render("users/verifyotp", { message: null});
  })


 


// userControl2 Get
  router.get("/accountmangement",sessions.sessionCheck,userControl2.manageAccount)
  router.get("/saved-address",sessions.sessionCheck,userControl2.savedAddress)
  router.get("/add-address",sessions.sessionCheck,userControl2.addaddress)
  router.get("/edit-address/:addressId",sessions.sessionCheck,userControl2.editaddressGet)
  router.get("/cart",sessions.sessionCheck,userControl2.getCart)
  router.get("/fechCartdata",userControl2.fetchCart)
  router.get("/check-out",sessions.sessionCheck,userControl2.checkOut)
  router.get("/getwishlist",sessions.sessionCheck,userControl2.getwishlist)
  router.get("/fethWishlsit",sessions.sessionCheck,userControl2.fetchWishlistData)


  // userControl3 Get
  router.get("/myorders",sessions.sessionCheck,userControl3.getOrdersPage)
  router.get("/wallet", sessions.sessionCheck,userControl3.getWallet)
  router.get("/transactionDeatails",userControl3.getTransaction)








// postMethods userControl1
router.post("/signup",userControl.postsignup)
router.post("/login",userControl.postlogin)
router.post("/verify-otp",userControl.postverifyotp)
router.post("/forgetpass",userControl.forgetpasspost)
router.post("/verify-otp-forget",userControl.postverifyotpforget)
router.post("/newpassword",userControl.newpassword)
router.post("/download-invoice/:orderId",sessions.sessionCheck,userControl.downloadInvoice)

// userControl2 Post
router.post("/changedeatails",sessions.sessionCheck,userControl2.changedeatails)
router.post("/add-address-post",sessions.sessionCheck,userControl2.addaddresspost)
router.post("/edit-address-post",sessions.sessionCheck,userControl2.editaddressPost)
router.delete("/delete-address/:addressId",sessions.sessionCheck,userControl2.deleteAddress)
router.post("/add-to-Cart",sessions.sessionCheck,userControl2.addtocartPost)
router.post("/update-cart",sessions.sessionCheck,userControl2.updateCart)
router.post("/delete-cart-item",sessions.sessionCheck,userControl2.deletecart)
router.post("/addwishlist/:productId",sessions.sessionCheck,userControl2.addtowishlist)
router.post("/removewishlis/:productId",sessions.sessionCheck,userControl2.removeWishlist)


// userControl3 Post
router.post("/place-order",sessions.sessionCheck,userControl3.placeOrder)
router.post("/orders-cancel/:orderId",sessions.sessionCheck,userControl3.cancelOrder)
router.post("/orders/:orderId/return/:productId",sessions.sessionCheck,userControl3.returnrequiest)
router.post("/apply-coupon",sessions.sessionCheck,userControl3.applyCoupens)
router.post("/verify-payment",sessions.sessionCheck,userControl3.verifyPayment)
router.post("/repay-order",sessions.sessionCheck,userControl3.repayOrder)
router.post("/addmoney",sessions.sessionCheck,userControl3.addMoneyWallet)




module.exports = router