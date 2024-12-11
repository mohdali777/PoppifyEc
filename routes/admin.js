const express = require("express")
const router = express.Router();
const AdminRoutes = require("../controller/admincontroller")
const upload = require("../helpers/multer")

router.get("/login",AdminRoutes.getlogin)
router.get("/home",AdminRoutes.gethome)
router.get("/usermangement",AdminRoutes.usermanageside)
router.get("/dash",(req,res)=>{
res.render("admins/adminhome")
})
router.get("/product",AdminRoutes.products)
router.get("/category",AdminRoutes.category)
router.get("/add-category",AdminRoutes.categorybutton)
router.get("/editcategory/:categoryId",AdminRoutes.editcategory)
router.get("/addproducts", AdminRoutes.addproductsget)
router.get("/editproduct/:productId",AdminRoutes.geteditproducts)


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






module.exports = router