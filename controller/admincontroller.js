const {Admin, Coupen,Product,Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const {User,Order,Return,Wallet,Offer} = require("../model/user/usermodel")

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
      const categories = await Category.find({});
      res.render("admins/category", { categories });
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
    
        // Render the edit page with the category details
        res.render('admins/updatecategory', { category });
      } catch (err) {
        console.error('Error rendering edit category page:', err);
        res.status(500).send('An error occurred');
      }
  }


  const updatecategory = async (req,res)=>{
    try {
      const {id,name,description,is_listed} = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const category = await Category.findOne({_id:id});
      if(!category){
        res.render("/admins/updatecategory",{message:"category dont exist"})
      }
      listcehck = is_listed === "true";
      category.name = name || category.name;
      category.description = description || category.description;
      category.is_listed = listcehck;
      if(image_url){
        category.image_url = image_url;
      }
      await category.save();

      const categories = await Category.find();
      res.render("admins/category",{categories})
    } catch (error) {
      res.status(500).send("err")
    }
  }
  
  const products = async (req,res)=>{
    try {
      const products = await Product.find({});

    // Send a success response or redirect
    res.render('admins/products',{products}); 
    } catch (error) {
      console.log(error);
      
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
    res.render('admins/products',{products});  // Redirect to product list after adding the product
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
  console.log(product.image);
  
  res.render("admins/updateproduct",{product,categories})
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
    
    const { name, description, category, price,  brand, variants, id } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }
    const parsevariants = variants ? JSON.parse(variants) : existingProduct.variants;
    const images = req.files ? req.files.map(file => file.filename) : [];
    const updatedProduct = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      price: price || existingProduct.price,
      brand: brand || existingProduct.brand,
      variants: parsevariants || existingProduct.variants,
    };
    await Product.updateOne({ _id: id }, { $set: updatedProduct,$push: { image: { $each: images } } });
    const products = await Product.find({});
    res.render("admins/products", { products });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};
const orderManagment = async (req,res) => {
  try {
    const order = await Order.find();
    res.render("admins/orders",{order})
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


  
   
    
      if (order.paymentMethod === "RazorPay") {
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
            await wallet.save();
            await order.save();
        } else {
            console.error("Wallet not found for user:", userId);
            return res.status(404).json({ message: "User wallet not found" });
        }
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
  try {
    const coupens = await Coupen.find({});
    res.render("admins/coupen",{coupens})
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
      return res.status(400).json({ message: 'Coupon code already exists.' });
    }
    const newCoupen = new Coupen({
      couponCode,
      discount,
      expiryDate,
      description
    })
    await newCoupen.save()
    res.status(201).json({ message: 'Coupon created successfully', });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
}

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


const createOffer = async (req,res) => {
  try {
    console.log(req.body);
    
    const { offerName,offerType, discountType, discountValue, minimumOrderValue, expiryDate,StartingDate, isActive } = req.body;
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
 
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


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
createOffer}