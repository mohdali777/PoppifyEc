const {Admin, Coupen,Product,Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const {User,Order,Return,Wallet,Offer} = require("../model/user/usermodel")
const cron = require('node-cron');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
// const {  } = require("../model/admin/adminmodel");
// const {} = require("../model/admin/adminmodel")
const mongoose = require('mongoose')

let getlogin = async(req,res)=>{
res.render("admins/signin",{message:false})
}
let usermanageside = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Current page number (default: 1)
      const limit = 10; // Number of users per page
      const skip = (page - 1) * limit; // Calculate number of users to skip

      // Fetch paginated users
      const users = await User.find().skip(skip).limit(limit).lean();

      // Count total users for pagination
      const totalUsers = await User.countDocuments();

      // Render the template with pagination data
      res.render("admins/users", {
          users,
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
      });
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
  }
};


const logout = (req,res)=>{
 req.session.destroy();
 res.redirect("/admin/login")
}
let postlogin = async(req,res)=>{
    try {
        const {username,password} = req.body;
        console.log(password,username);
        
        const admin = await Admin.findOne({username})
        if(!admin){
            return res.render("admins/signin",{message:"usernot Found"})
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log(isMatch);
        
        if (!isMatch) {
            return res.render('admins/signin',{message:"Password dosen't Match"});
        } 
        req.session.admin = true;
        res.render("admins/adminhome")
    } catch (err) {
        res.status(500).send(`${err} error found`)
    }
    

}

let gethome = async (req,res)=>{
    
res.render("admins/adminhome")
}

//add user post

const adduser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        const user = await User.findOne({ username });
        if (user) {
            const users = await User.find(); // Fetch existing users
            return res.render("admins/users", { users, message: "User already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedpassword = await bcrypt.hash(password, saltRounds);

        // Create and save the new user
        const newUser = new User({
            email,
            username,
            password: hashedpassword
        });
        await newUser.save();
        res.redirect("/admin/usermangement")
        
    } catch (err) {
        console.error(err);
        res.render("admins/users", { message: "Error adding user. Please try again later." });
    }
};

const deleteuser = async(req,res)=>{
    try{
        const user = req.params.userid;
        await User.findByIdAndDelete(user)
        const users = await User.find({})
        if(req.session.userId == user){
          req.session.destroy()
        }
        res.redirect("/admin/usermangement")
    }catch(err){
console.log(err)
res.status(500).send("failed to delete")
    }
}

const edituser = async (req,res)=>{
    try{
        const {id,email,password} = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password,saltRounds)
        await User.updateOne({_id:id},{$set:{email,password:hashedPassword}})
        res.redirect("/admin/usermangement")
    }catch(err){
        console.log(err)
        res.status(500).send("failed to edit",err)
    }

}
const blockUser = async (req, res) => {
    try {
        const { userid } = req.params;

        const user = await User.findByIdAndUpdate(userid, { status: "blocked" });
        if(req.session.userId == userid){
          req.session.destroy()
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User blocked successfully" });
    } catch (err) {
        console.error("Error blocking user:", err);
        res.status(500).json({ message: "Failed to block user" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userid } = req.params;

        // Set status to "active"
        const user = await User.findByIdAndUpdate(userid, { status: "active" });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User unblocked successfully" });
    } catch (err) {
        console.error("Error unblocking user:", err);
        res.status(500).json({ message: "Failed to unblock user" });
    }
};



const category = async(req,res)=>{
const categories = await Category.find({})
res.render("admins/category",{categories,message:false})
}
const categorybutton = async(req,res)=>{
  const offers = await Offer.find({offerType:"category",isActive:true})
res.render("admins/addcategory",{message:false,offers})
}

const addcategory = async (req, res) => {
  try {
    const { name, description, is_listed ,offer} = req.body;

    // Get the uploaded image file (if any)
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      const categories = await Category.find({})
      return res.render("admins/addcategory", {
        message: "Category already exists",
        categories
      });
    }

    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName:offer }); 
    console.log(OFFer);
    if (OFFer) {  // If an offer is found
      offerId = OFFer._id;  // Assign offerId the _id of the found offer
    }

    // Create a new category
    const newCategory = new Category({
      name,
      description,
      is_listed: is_listed === "true",
      image_url,
      offerId
    });

    await newCategory.save();
    const categories = await Category.find();
    res.render("admins/category", {
      message: "Category added successfully!",categories
    });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).render("admins/addcategory", {
      message: "Error adding category. Please try again.",
    });
  }
};
const deleteCategory = async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      await Category.findByIdAndDelete(categoryId);
      res.status(200).json({message:"Category Deleted Successfully"})
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while deleting the category.");
    }
  };

  const editcategory = async (req,res)=>{
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);
    
        if (!category) {
          return res.status(404).send('Category not found');
        }
        const offers = await Offer.find({offerType:"category",isActive:true})
    
        res.render('admins/updatecategory', { category ,offers,message:false});
      } catch (err) {
        console.error('Error rendering edit category page:', err);
        res.status(500).send('An error occurred');
      }
  }


  const updatecategory = async (req,res)=>{
    try {
      console.log(req.body);
      
      const {id,name,description,is_listed,offer} = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const category = await Category.findOne({_id:id});
      if(!category){
        return res.render("admins/category",{categories,message:"category dont exist"})
      }
      const exist = await Category.findOne({name})
      if(exist && exist._id.toString() !== id){
        const categories = await Category.find();
        return res.render("admins/category",{categories,message:"category Alredy Exist "})
      }
      let offerId = null;  
      const OFFer = await Offer.findOne({ offerName:offer }); 
      console.log(OFFer);
      if (OFFer) {  // If an offer is found
        offerId = OFFer._id;  // Assign offerId the _id of the found offer
      }
      listcehck = is_listed === "true";
      category.name = name || category.name;
      category.description = description || category.description;
      category.is_listed = listcehck;
      if(image_url){
        category.image_url = image_url;
      }
      console.log(category.offerId);
        category.offerId = offerId; // Update the offer reference
        console.log(category.offerId);
        
      
      await category.save();

      const categories = await Category.find();
      res.render("admins/category",{categories,message:"successfull"})
    } catch (error) {
      res.status(500).send("err")
    }
  }
  
  const products = async (req,res)=>{
    
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 9; // Default to 10 products per page

    try {
        const skip = (page - 1) * limit;
        const totalProducts = await Product.countDocuments(); // Get total product count
        const products = await Product.find().skip(skip).limit(limit);
    
      res.render('admins/products', {
          products,
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
      });
    } catch (error) {
        res.status(500).send('Error fetching products');
    }
    
  }


const addproductsget = async (req,res)=> {
  try {
    const categories = await Category.find({is_listed:true});
    const offers = await Offer.find({offerType:"product",isActive:true})
    res.render("admins/addproduct",{categories,offers})
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }


}

const addproductpost = async (req, res) => {
  console.log(req.body);
  
  try {
    const { name, description, category, price, quantity, brand, variants, colors,offer } = req.body;
    console.log(req.files);
    
    const image = req.files.map(file => file.filename);
    const parsevariants = JSON.parse(variants)
    console.log(parsevariants);

    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName:offer }); 
    console.log(OFFer);
    if (OFFer) {  // If an offer is found
      offerId = OFFer._id;  // Assign offerId the _id of the found offer
    }

    const categoryName = await Category.findOne({name:category})
    const categoryId = categoryName._id; 
    
    const newProduct = new Product({
      name,
      description,
      category,
      categoryId,
      price,
      quantity,
      brand,
      variants: parsevariants, // Default to empty array if not provided
      colors: Array.isArray(colors) ? colors : [],
      image,  
      offerId
      
    });

    // Save the new product to the database
    await newProduct.save();
    const products = await Product.find({});


    // Send a success response or redirect
    res.status(200).json({success:true,message:"product Added Successfully"})
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).send('Server Error');  // Send an error response if something goes wrong
  }
};

const geteditproducts = async (req,res)=>{
try {
  const productId = new mongoose.Types.ObjectId(req.params.productId);
  const product = await Product.findOne({_id:productId})
  const categories = await Category.find({is_listed:true})
  const offers = await Offer.find({offerType:"product",isActive:true})
  console.log(product.image);
  
  res.render("admins/updateproduct",{product,categories,offers})
} catch (error) {
  console.log(error);
  
}
}

const deleteproduct = async (req,res)=>{
  try {
    productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    const products = await Product.find({});
    res.render('admins/products',{products}); 
  } catch (error) {
    console.log(error);
    
  }


}

const removeimage = async(req,res) =>{

  try {
    const productId = req.params.productid;
    const imageid = req.params.image;
    console.log(productId,imageid);
     await Product.updateOne({_id:productId},{$pull:{image:imageid}})
  } catch (error) {
    
    console.log(error);
    
  }

 
}
const updateproduct = async (req, res) => {
  try {
    console.log(req.body);
    
    const { name, description, category, price,  brand, variants, id,offer } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }
    const parsevariants = variants ? JSON.parse(variants) : existingProduct.variants;
    const images = req.files ? req.files.map(file => file.filename) : [];

    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName:offer }); 
    console.log(OFFer);
    if (OFFer) {  // If an offer is found
      offerId = OFFer._id;  // Assign offerId the _id of the found offer
    }
    console.log("gasvfdgafsdgas",offerId);
    const categoryName = await Category.findOne({name:category})
    const categoryId = categoryName._id;

    console.log("gasvfdgafsdgas",categoryName);
    

    const updatedProduct = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      price: price || existingProduct.price,
      brand: brand || existingProduct.brand,
      variants: parsevariants || existingProduct.variants,
      categoryId:categoryId ||  existingProduct.categoryId,
      offerId:offerId 
    };
    await Product.updateOne({ _id: id }, { $set: updatedProduct,$push: { image: { $each: images } } });
    const products = await Product.find({});
    res.status(200).json({message:"updatedSuccessfully"});
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};
const orderManagment = async (req,res) => {
  const page = parseInt(req.query.page)||1;
  const limit = parseInt(req.query.limit)||10;
  try {
    const skip = (page - 1) * limit
    const totalOrders = await Order.countDocuments();
    const order = await Order.find().skip(skip).limit(limit);
    const orders = await Order.find()
    res.render("admins/orders",{order,orders,currentPage:page,totalPages:Math.ceil(totalOrders/limit)})
  } catch (error) {
    
  }
}

const orderDeatail = async (req,res) => {
  try {
    const orderId = req.params.orderId;
    req.session.orderid = orderId;
    const order = await Order.findById(orderId).populate("cartItems.productId");
    const Returns = await Return.findOne({orderId})
    res.render("admins/orderdeatails",{order,Returns})
  } catch (error) {
    console.log(error);
    
  }
}
const updateStatus = async (req,res) => {
  const { status } = req.body;
  const orderId = req.session.orderid; 
  console.log(orderId);
    try {
        const order = await Order.findById(orderId); 
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if(status == "Cancelled" && order.paymentMethod == "RazorPay" && order.razorpay.paymentStatus == "Success"){
          const userId = order.userId;
          const wallet = await Wallet.findOne({ userId }); 
          if (wallet) {
              console.log(wallet);
              wallet.balance += order.totalPrice;
              wallet.transactions.push({
                  transactionId: `Refund-${order._id}`,
                  date: new Date(),
                  description: `Refund for cancelled order ${order._id}`,
                  type: "credit", 
                  amount: order.totalPrice,  
              });
              order.razorpay.paymentStatus = "Refunded"
              await wallet.save();
          } else {
              console.log("Wallet not found for user:", userId);
          }
      }
      

        order.orderStatus = status;
        await order.save();
        res.status(200).json({ status: order.orderStatus });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order status', error });
    }  
}
const returnAccept = async (req,res) => {
    try {
      console.log(req.body);
      const { orderId, itemId ,userId} = req.body;
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      const item = order.cartItems.find((item) => item._id.toString() === itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found in the order." });
      }


  
   
    
  
        const wallet = await Wallet.findOne({ userId });
      if(!wallet){
          return res.status(404).json({ message: "Wallet not found for the user." });
      }
        if (wallet) {
            if (typeof item.total !== 'number' || isNaN(item.total)) {
                throw new Error(`Invalid totalAmount: ${item.total}`);
            }
            let walletbalance;
            if(order.coupenId != null){
              const coupenId = order.coupenId;
              const coupen = await Coupen.findById(coupenId)
              const discountAmountt = coupen.discount;
              const discountAmount = (item.total * discountAmountt) / 100; 
              walletbalance = item.total - discountAmount; 
            }else{
              walletbalance = item.total
            }
        console.log(`wallet balance ${walletbalance}`);
        
            wallet.balance += walletbalance;
            wallet.transactions.push({
                transactionId: `Refund-${item._id}`,
                date: new Date(),
                description: `Refund for cancelled order ${item._id}`,
                type: "credit", 
                amount: walletbalance,
            });
            order.paymentStatus = "Refunded"
            await wallet.save();
            await order.save();
        } else {
            console.error("Wallet not found for user:", userId);
            return res.status(404).json({ message: "User wallet not found" });
        }
    
      item.status = "Accepted";
      await order.save();
      return res.status(200).json({ success: true, message: "Return request accepted successfully." });
    } catch (error) {
      console.error("Error accepting return request:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the return request. Please try again later.",
      });
    }  
}

const returnReject = async (req,res) => {
  try {
    console.log(req.body);
    const { orderId, itemId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    const item = order.cartItems.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in the order." });
    }
    item.status = "Rejected";
    await order.save();
    return res.status(200).json({ success: true, message: "Return request Rejected successfully." });
  } catch (error) {
    console.error("Error accepting return request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the return request. Please try again later.",
    });
  }  
}

const getCoupens = async (req,res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const skip = (page-1)*limit;
    const totalCoupens = await Coupen.countDocuments();

    const coupens = await Coupen.find().skip(skip).limit(limit);
    res.render("admins/coupen",{coupens,message:false,currentPage:page,totalPages:Math.ceil(totalCoupens/limit)})

  } catch (error) {
    console.error("Error accepting return request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the return request. Please try again later.",
    });
  }
}


const createCoupen = async (req,res) => {
  try {
    const {couponCode,discount,expiryDate,description} = req.body;
    const existingCoupen = await Coupen.findOne({couponCode});
    if(existingCoupen){
      const coupens = await Coupen.find({});
    return res.render("admins/addcoupen",{coupens,message:"coupen Alredy Exist"})
    }
    const newCoupen = new Coupen({
      couponCode,
      discount,
      expiryDate,
      description
    })
    await newCoupen.save()
    const coupens = await Coupen.find({});
    res.render("admins/addcoupen",{coupens,message:"coupen Created Successfully"})
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
}



cron.schedule('0 0 * * *', async () => {
  try {
    const expiredCoupons = await Coupen.updateMany(
      { expiryDate: { $lt: moment().tz('Asia/Kolkata').toDate() }, status: 'active' },
      { status: 'inactive' }
    );
    console.log(`Updated ${expiredCoupons.nModified} expired coupons.`);
  } catch (error) {
    console.error('Error updating expired coupons:', error);
  }
});


const deleteCoupen = async (req, res) => {
  try {
    console.log(req.body);
    
    const { coupenId } = req.params;
    const coupen = await Coupen.findByIdAndDelete(coupenId);
    if (!coupen) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const OffersGet = async (req,res) => {

  const page = parseInt(req.query.page)||1;
  const limit = parseInt(req.query.limit)||10;
  try {
    const skip =  (page - 1) * limit
    const totalOffers = await Offer.countDocuments();
    const offers = await Offer.find().skip(skip).limit(limit);
    res.render("admins/offers",{offers,currentPage:page,totalPages:Math.ceil(totalOffers / limit)})
  } catch (error) {
    console.error("Error getting order page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const editOffers = async (req,res) => {
  try {
    const {offerId} = req.params;
    const offer = await Offer.findById(offerId)
    console.log(offer);
    
    res.render("admins/editOffer",{offer,message:false})
  } catch (error) {
    console.error("Error getting edit Offer page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const editOfferPost = async (req, res) => {
  try {
    const { id, offerName, offerType, discountType, discountValue, minimumOrderValue, expiryDate, StartingDate, isActive } = req.body;
    if (!id || !offerName || !offerType) {
      return res.status(400).json({ message: 'Offer ID, name, and type are required.' });
    }
    const exist = await Offer.findOne({offerName})
    if( exist && exist._id.toString() !== id){
      return res.render("admins/createOffer",{message:"offer  Alredy Exist"})
    }
    const updatedOffer = await Offer.findByIdAndUpdate(id, {
      $set: {
        offerName,
        offerType,
        discountType,
        discountValue,
        minimumOrderValue,
        expiryDate,
        StartingDate,
        isActive
      }
    }, { new: true });
    if (!updatedOffer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }
    const offer = await Offer.findById(id)
    res.render("admins/editOffer",{offer,message:"offer Updated Successfully"})
    // res.status(200).json({ message: 'Offer updated successfully', offer: updatedOffer });
    

  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const createOffer = async (req,res) => {
  try {
    console.log(req.body);
    
    const { offerName,offerType, discountType, discountValue, minimumOrderValue, expiryDate,StartingDate, isActive } = req.body;
    
    const exist = await Offer.findOne({offerName})
    if( exist){
      return res.render("admins/createOffer",{message:"offer Alredy Exist"})
    }
     const newOffer = new Offer({
         offerName,
          offerType,
          discountType,
          discountValue,
          minimumOrderValue,
          expiryDate,
          StartingDate, 
          isActive
    })   

    await newOffer.save()
   res.render("admins/createOffer",{message:"offer Created Succeffully"})
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const deleteOfferPost = async (req,res) => {
  try {
    const {offerId} = req.params;
    await Offer.findByIdAndDelete(offerId)
    res.status(200).json({ success: true, message: "deleted successfully" });
    console.log("delete");
    
  } catch (error) {
    console.error("Error deleting Offer:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
const Getsales = async (req,res) => {
  try {
    const orders = await Order.find({orderStatus:"Delivered"})
    const totalSalesResult = await Order.aggregate([
      {
        $match: { orderStatus: "Delivered" },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;
    console.log(totalSales);


    const totalOfferResult = await Order.aggregate([
      {
        $match: { orderStatus: "Delivered" },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$CartTotalOffer" },
        },
      },
    ]);
    const totalOffers = totalOfferResult.length > 0 ? totalOfferResult[0].totalSales : 0;
   console.log(totalOffers);
   
    res.render("admins/sales",{orders,totalSales,totalOffers})
  } catch (error) {
    console.error("Error deleting Offer:", error);
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

function parseDateRange(predefinedRange) {
  const now = new Date();
  let startDate, endDate;

  switch (predefinedRange) {
    case '1-day':
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      break;
    case '1-week':
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      break;
    case '1-month':
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
      break;
    default:
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate: now };
}

// Controller function to fetch filtered orders
const getFilteredOrders = async (req, res) => {
  try {
    const { predefinedRange, startDate, endDate } = req.body;
    let filters = {};
   console.log("dgvfgshdf");
   
    // Apply date filters
    if (predefinedRange && predefinedRange !== 'custom') {
      const dateRange = parseDateRange(predefinedRange);
      filters.createdAt = { $gte: dateRange.startDate, $lte: dateRange.endDate };
    } else if (startDate && endDate) {
      filters.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    filters.orderStatus = 'Delivered';
    // Fetch filtered orders from the database
    const orders = await Order.find(filters).sort({ createdAt: 1 });


    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOffers = orders.reduce((sum, order) => sum + (order.CartTotalOffer || 0) + (order.coupenDiscountAmount || 0), 0);

    res.json({ orders, totalSales, totalOffers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating report', error });
  }
};

const downloadExcel = async (req, res) => {
  console.log(req.body);
  
  const { orders } = req.body;

  try {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add header row
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Order ID', key: 'orderId', width: 20 },
      { header: 'Total Amount', key: 'totalPrice', width: 15 },
      { header: 'Discount', key: 'CartTotalOffer', width: 15 },
      { header: 'Coupon Discount', key: 'coupenDiscountAmount', width: 20 },
      { header: 'Net Sales', key: 'netSales', width: 15 },
    ];

    // Add data rows
    orders.forEach(order => {
      worksheet.addRow({
        date: new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        orderId: order.orderId,
        totalPrice: `₹${order.totalPrice}`,
        CartTotalOffer: `₹${order.CartTotalOffer || 0}`,
        coupenDiscountAmount: `₹${order.coupenDiscountAmount || 0}`,
        netSales: `₹${order.totalPrice - (order.CartTotalOffer || 0) - (order.coupenDiscountAmount || 0)}`,
      });
    });

    // Apply formatting (Optional)
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (rowNumber === 1) {
          cell.font = { bold: true };
        }
      });
    });

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.xlsx');

    // Send workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send('Failed to generate Excel report.');
  }
};




const downloadPDF = async (req, res) => {
  const { orders } = req.body;

  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.pdf');

  doc.pipe(res);

  // Title
  doc.fontSize(16).text('Sales Report', { align: 'center' });

  let yPosition = 60;

  // Add headers with standard spacing and alignment
  const headerTitles = ['Date', 'Order ID', 'Total Amount', 'Discount', 'Coupon Discount', 'Net Sales'];
  const headerPositions = [20, 100, 180, 260, 340, 420]; // Standard positions for each column

  doc.fontSize(12);
  headerTitles.forEach((title, index) => {
    doc.text(title, headerPositions[index], yPosition);
  });

  yPosition += 20; // Move to the next row after headers

  // Add data rows with consistent alignment and spacing
  orders.forEach(order => {
    doc.text(new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), headerPositions[0], yPosition);
    doc.text(order.orderId.toString(), headerPositions[1], yPosition);
    doc.text(`₹${order.totalPrice}`, headerPositions[2], yPosition);
    doc.text(`₹${order.CartTotalOffer || 0}`, headerPositions[3], yPosition);
    doc.text(`₹${order.coupenDiscountAmount || 0}`, headerPositions[4], yPosition);
    doc.text(`₹${order.totalPrice - (order.CartTotalOffer || 0) - (order.coupenDiscountAmount || 0)}`, headerPositions[5], yPosition);

    yPosition += 20; // Increment yPosition for the next row
  });

  doc.end();
};








module.exports = {
    getlogin,
    postlogin,
    gethome,
    usermanageside,
    adduser,
    deleteuser,
    edituser,
    blockUser,
    unblockUser,
    category,
    categorybutton,
    addcategory,
    deleteCategory,
    editcategory,
    updatecategory,
  products,
addproductsget,
addproductpost,
geteditproducts,
deleteproduct,
removeimage,
updateproduct,
logout,
orderManagment,
orderDeatail,
updateStatus,
returnAccept,
returnReject,
createCoupen,
getCoupens,
deleteCoupen,
createOffer,
OffersGet,
editOffers,
editOfferPost,
Getsales,
deleteOfferPost,
getFilteredOrders,
downloadExcel,
downloadPDF,
}