const {Admin, Coupen,Product,Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const {User,Order,Return,Wallet,Offer} = require("../model/user/usermodel")
const cron = require('node-cron');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose')

let getlogin = async(req,res)=>{
res.render("admins/signin",{message:false})
}
let usermanageside = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; 
      const limit = 10;
      const skip = (page - 1) * limit;
      const users = await User.find().skip(skip).limit(limit).lean();
      const totalUsers = await User.countDocuments();
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
        
        const admin = await Admin.findOne({username})
        if(!admin){
            return res.render("admins/signin",{message:"usernot Found"})
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (!isMatch) {
            return res.render('admins/signin',{message:"Password dosen't Match"});
        } 
        req.session.admin = true;
        const Users = await User.find({})
        const Orders = await Order.find({orderStatus:"Delivered"})
        const BestProduct = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productId",
          productName:{$first: "$cartItems.productName"},
          totalSold:{$sum:"$cartItems.quantity"}
        }},{$sort:{totalSold:-1}}])

        const BestCategory = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productCategory",
          totalSold:{$sum:"$cartItems.quantity"}
        }},{$sort:{totalSold:-1}}])

        const BestBrand = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productBrand",
          totalSold:{$sum:"$cartItems.quantity"}
        }},{$sort:{totalSold:-1}}])
        

        res.render("admins/adminhome",{Users,Orders,BestProduct,BestCategory,BestBrand})
    } catch (err) {
        res.status(500).send(`${err} error found`)
    }
    

}

let gethome = async (req,res)=>{
  const BestProduct = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productId",
    productName:{$first: "$cartItems.productName"},
    totalSold:{$sum:"$cartItems.quantity"}
  }},{$sort:{totalSold:-1}},{$limit:5}])

  const BestCategory = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productCategory",
    totalSold:{$sum:"$cartItems.quantity"}
  }},{$sort:{totalSold:-1}},{$limit:5}])

  const BestBrand = await Order.aggregate([{$match:{orderStatus:"Delivered"}},{$unwind:"$cartItems"},{$group:{_id:"$cartItems.productBrand",
    totalSold:{$sum:"$cartItems.quantity"}
  }},{$sort:{totalSold:-1}},{$limit:5}])
    
  const Users = await User.find({})
  const Orders = await Order.find({orderStatus:"Delivered"})
  res.render("admins/adminhome",{Users,Orders,BestProduct,BestCategory,BestBrand})
}

//add user post

const adduser = async (req, res) => {
  try {
      const { username, email, password } = req.body;
      const userByUsername = await User.findOne({ username });
      const userByEmail = await User.findOne({ email });

      if (userByUsername) {
          return res.status(400).json({ success: false, message: "Username already exists" });
      }

      if (userByEmail) {
          return res.status(400).json({ success: false, message: "Email already exists" });
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
          email,
          username,
          password: hashedPassword
      });
      await newUser.save();

      res.status(200).json({ success: true, message: "User added successfully" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Error adding user. Please try again later." });
  }
};


const deleteuser = async(req,res)=>{
    try{
        const user = req.params.userid;
        await User.findByIdAndDelete(user)
        if(req.session.userId == user){
          req.session.userId = null;
        }
        const users = await User.find({})
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
    const { name, description, is_listed, offer } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        success:false, message: "Category already exists",
      });
    }
    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName: offer }); 
    if (OFFer) {  // If an offer is found
      offerId = OFFer._id;  // Assign offerId the _id of the found offer
    }
    const newCategory = new Category({
      name,
      description,
      is_listed: is_listed === "true",
      image_url,
      offerId,
    });

    await newCategory.save();
    const categories = await Category.find();
    res.status(201).json({
      success:true, message: "Category added successfully!",
      categories,
    });

  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({
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


  const updatecategory = async (req, res) => {
    try {
  
      const { id, name, description, is_listed, offer } = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const category = await Category.findOne({ _id: id });
      if (!category) {
        return res.status(404).json({ message: "Category doesn't exist" });
      }    
      const exist = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

      if (exist && exist._id.toString() !== id) {
        return res.status(400).json({ message: "Category already exists" });
      }
  

      let offerId = null;
      if (offer) {
        const OFFer = await Offer.findOne({ offerName: offer });
        if (OFFer) {
          offerId = OFFer._id;  
        } else {
          offerId = null;  
        }
      }
  
      const listCheck = is_listed === "true";
  
      
      category.name = name || category.name;
      category.description = description || category.description;
      category.is_listed = listCheck;
      if (image_url) {
        category.image_url = image_url;  
      }
      category.offerId = offerId;  
  
     
      await category.save();
  
      res.status(200).json({
        success:true,
        message: "Category updated successfully",
        category, 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating the category." });
    }
  };
  
  
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
    const { name, description, category, price, quantity, brand, variants, colors,offer,inStocks } = req.body;
    
    const image = req.files.map(file => file.filename);
    const parsevariants = JSON.parse(variants)

    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName:offer }); 
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
      offerId,
      inStocks
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
    res.status(200).json({message:"deleteed Succesfully"}); 
  } catch (error) {
    console.log(error);
    
  }


}

const removeimage = async(req,res) =>{

  try {
    const productId = req.params.productid;
    const imageid = req.params.image;
     await Product.updateOne({_id:productId},{$pull:{image:imageid}})
  } catch (error) {
    
    console.log(error);
    
  }

 
}
const updateproduct = async (req, res) => {
  try {
    console.log(req.body);
    
    const { name, description, category, price,  brand, variants, id,offer,inStocks } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }
    const parsevariants = variants ? JSON.parse(variants) : existingProduct.variants;
    const images = req.files ? req.files.map(file => file.filename) : [];

    let offerId = null;  
    const OFFer = await Offer.findOne({ offerName:offer }); 
   
    if (OFFer) {  // If an offer is found
      offerId = OFFer._id;  // Assign offerId the _id of the found offer
    }
    
    const categoryName = await Category.findOne({name:category})
    const categoryId = categoryName._id;

    
    

    const updatedProduct = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      price: price || existingProduct.price,
      brand: brand || existingProduct.brand,
      variants: parsevariants || existingProduct.variants,
      categoryId:categoryId ||  existingProduct.categoryId,
      offerId:offerId,
      inStocks
    };
    await Product.updateOne({ _id: id }, { $set: updatedProduct,$push: { image: { $each: images } } });
    const products = await Product.find({});
    res.status(200).json({message:"updatedSuccessfully"});
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};
const renderChart = async (req, res) => {
  try {
    const { filter } = req.body; // Extract filter (e.g., "yearly" or "monthly")
    
    
    let matchCondition = {};
    let groupBy = {};
    let labels = [];
    
    
    if (filter === "yearly") {
      const currentYear = new Date().getFullYear();
      matchCondition = { 
        createdAt: { 
          $gte: new Date(`${currentYear}-01-01`),  
          $lt: new Date(`${currentYear + 1}-01-01`) 
        },
        orderStatus: "Delivered" 
      };
      groupBy = { $month: "$createdAt" };
      labels = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];
    } else if (filter === "monthly") {
      const currentMonth = new Date().getMonth() + 1; // Current month (1-based index)
      const currentYear = new Date().getFullYear();
      matchCondition = { 
        createdAt: { 
          $gte: new Date(`${currentYear}-${currentMonth}-01`), 
          $lt: new Date(`${currentYear}-${currentMonth + 1}-01`) 
        } ,orderStatus: "Delivered"
      };
      groupBy = { $dayOfMonth: "$createdAt" }; 
      labels = Array.from({ length: 31 }, (_, i) => i + 1); // Generate an array from 1 to 31
    } 

    // Fetch data from the database using aggregation
    const chartData = await Order.aggregate([
      { $match: matchCondition }, // Apply the date filter (e.g., only for current month/year)
      { $group: { 
          _id: groupBy, 
          totalRevenue: { $sum: "$totalPrice" }, // Calculate total revenue
          count: { $sum: 1 } // Count orders
        }
      },
      { $sort: { _id: 1 } } // Sort by group (month/day)
    ]);

    // Format data for the chart
    const data = new Array(labels.length).fill(0); // Initialize data array with zero values
    chartData.forEach(item => {
      const index = item._id - 1; // Adjust index for 0-based array
      if (index >= 0 && index < labels.length) {
        data[index] = item.totalRevenue; // Assign revenue for the corresponding day/month
      }
    });

  
    
    // Send response
    res.status(200).json({
      success: true,
      labels,
      data,
    });
  } catch (error) {
    console.error("Error rendering chart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chart data" });
  }
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
renderChart
}