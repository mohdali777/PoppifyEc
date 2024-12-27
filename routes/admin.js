const express = require("express")
const router = express.Router();
const AdminRoutes = require("../controller/admincontroller")
const upload = require("../helpers/multer")
const session = require("../middleware/adminsession");
const { Session } = require("express-session");

router.get("/login",session.islogin,AdminRoutes.getlogin)
router.get("/home",session.sessionCheck,AdminRoutes.gethome)
router.get("/usermangement",session.sessionCheck,AdminRoutes.usermanageside)
router.get("/dash",session.sessionCheck,(req,res)=>{
res.render("admins/adminhome")
})
router.get("/product",session.sessionCheck,AdminRoutes.products)
router.get("/category",session.sessionCheck,AdminRoutes.category)
router.get("/add-category",session.sessionCheck,AdminRoutes.categorybutton)
router.get("/editcategory/:categoryId",AdminRoutes.editcategory)
router.get("/addproducts",session.sessionCheck,AdminRoutes.addproductsget)
router.get("/editproduct/:productId",AdminRoutes.geteditproducts)
router.get("/logout",AdminRoutes.logout)
router.get("/order-management",session.sessionCheck,AdminRoutes.orderManagment)
router.get("/order-deatails/:orderId",session.sessionCheck,AdminRoutes.orderDeatail)
router.get("/coupon-management",AdminRoutes.getCoupens)
router.get("/create-coupen",(req,res)=>{
    res.render("admins/addcoupen")
})


router.post("/login",AdminRoutes.postlogin)
router.post("/add-user",AdminRoutes.adduser)
router.post("/user-delete/:userid", AdminRoutes.deleteuser);
router.post("/edit-user",AdminRoutes.edituser)
router.post("/user-block/:userid", AdminRoutes.blockUser);
router.post("/user-unblock/:userid", AdminRoutes.unblockUser);
router.post("/add-category", upload.single("image_url"), AdminRoutes.addcategory);
router.post("/deletecategory/:categoryId",AdminRoutes.deleteCategory)
router.post("/update-category",upload.single("image_url"),AdminRoutes.updatecategory)
router.post("/add-product",upload.array("images"),AdminRoutes.addproductpost)
router.post("/deleteproduct/:productId",AdminRoutes.deleteproduct)
router.post("/removeimage/:image/:productid",AdminRoutes.removeimage)
router.post("/update-product",upload.array("images"),AdminRoutes.updateproduct)
router.post("/update-status",AdminRoutes.updateStatus)
router.post("/returnaccept",AdminRoutes.returnAccept)
router.post("/returnreject",AdminRoutes.returnReject)
router.post("/create-coupon",AdminRoutes.createCoupen)
router.delete("/deletecoupen/:coupenId",AdminRoutes.deleteCoupen)






module.exports = router