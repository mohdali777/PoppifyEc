const express = require("express")
const router = express.Router();
const AdminRoutes = require("../controller/admincontroller")
const upload = require("../helpers/multer")
const session = require("../middleware/adminsession");
const { Session } = require("express-session");

router.get("/login",session.islogin,AdminRoutes.getlogin)
router.get("/home",session.sessionCheck,AdminRoutes.gethome)
router.get("/usermangement",session.sessionCheck,AdminRoutes.usermanageside)
router.get("/dash",session.sessionCheck,AdminRoutes.gethome)
router.get("/products",session.sessionCheck,AdminRoutes.products)
router.get("/category",session.sessionCheck,AdminRoutes.category)
router.get("/add-category",session.sessionCheck,AdminRoutes.categorybutton)
router.get("/editcategory/:categoryId",AdminRoutes.editcategory)
router.get("/addproducts",session.sessionCheck,AdminRoutes.addproductsget)
router.get("/editproduct/:productId",AdminRoutes.geteditproducts)
router.get("/logout",AdminRoutes.logout)
router.get("/order-management",session.sessionCheck,AdminRoutes.orderManagment)
router.get("/order-deatails/:orderId",session.sessionCheck,AdminRoutes.orderDeatail)
router.get("/coupon-management",session.sessionCheck,AdminRoutes.getCoupens)
router.get("/create-coupen",session.sessionCheck,(req,res)=>{
    res.render("admins/addcoupen",{message:false})
})
router.get("/add-offer",session.sessionCheck,(req,res)=>{
    res.render("admins/createOffer",{message:false})
})
router.get("/offer",session.sessionCheck,AdminRoutes.OffersGet)
router.get("/edit-Offer/:offerId",session.sessionCheck,AdminRoutes.editOffers)
router.get("/sales",session.sessionCheck,AdminRoutes.Getsales)



router.post('/generate-report',session.sessionCheck,AdminRoutes.getFilteredOrders);


router.post("/login",AdminRoutes.postlogin)
router.post("/add-user",session.sessionCheck,AdminRoutes.adduser)
router.post("/user-delete/:userid",session.sessionCheck, AdminRoutes.deleteuser);
router.post("/edit-user",session.sessionCheck,AdminRoutes.edituser)
router.post("/user-block/:userid", session.sessionCheck,AdminRoutes.blockUser);
router.post("/user-unblock/:userid",session.sessionCheck, AdminRoutes.unblockUser);
router.post("/add-category",session.sessionCheck, upload.single("image_url"), AdminRoutes.addcategory);
router.post("/deletecategory/:categoryId",session.sessionCheck,AdminRoutes.deleteCategory)
router.post("/update-category",session.sessionCheck,upload.single("image_url"),AdminRoutes.updatecategory)
router.post("/add-product",session.sessionCheck,upload.array("images"),AdminRoutes.addproductpost)
router.post("/deleteproduct/:productId",session.sessionCheck,AdminRoutes.deleteproduct)
router.post("/removeimage/:image/:productid",session.sessionCheck,AdminRoutes.removeimage)
router.post("/update-product",session.sessionCheck,upload.array("images"),AdminRoutes.updateproduct)
router.post("/update-status",session.sessionCheck,AdminRoutes.updateStatus)
router.post("/returnaccept",session.sessionCheck,AdminRoutes.returnAccept)
router.post("/returnreject",session.sessionCheck,AdminRoutes.returnReject)
router.post("/create-coupon",session.sessionCheck,AdminRoutes.createCoupen)
router.delete("/deletecoupen/:coupenId",session.sessionCheck,AdminRoutes.deleteCoupen)
router.post("/create-offer",session.sessionCheck,AdminRoutes.createOffer)
router.post("/edit-offer-post",session.sessionCheck,AdminRoutes.editOfferPost)
router.post("/delete-Offer/:offerId",session.sessionCheck,AdminRoutes.deleteOfferPost)
router.post('/download-report/excel',session.sessionCheck,AdminRoutes.downloadExcel)
router.post('/download-report/pdf',session.sessionCheck,AdminRoutes.downloadPDF)
router.post("/dashChart",session.sessionCheck,AdminRoutes.renderChart)





module.exports = router