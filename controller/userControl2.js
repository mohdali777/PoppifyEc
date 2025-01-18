const {OTP,User,Address,Cart,Order,Wishlist,Return,Wallet} = require("../model/user/usermodel")
const{Product, Coupen, Category} = require("../model/admin/adminmodel")

const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const env = require("dotenv");
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');






const manageAccount = async (req,res)=>{
    try {
        const userId = req.session.userId;
        const usertake = await User.findById(userId)
         res.render("users/accountdeatails",{usertake,message:false})
    } catch (error) {
        console.log(error);
        
    }

}

const changedeatails = async (req, res) => {
    try {
        const { id, username, email, phone } = req.body;
        const usernameCheck = await User.findOne({ username });
        const emailcheck = await User.findOne({email});
        if (usernameCheck && usernameCheck._id.toString() !== id) {
            const usertake = await User.findOne({ _id: id });
            return res.render("users/accountdeatails", {message: "Username already exists. Please choose another one.",usertake});
        }
        if (emailcheck && emailcheck._id.toString() !== id) {
            const usertake = await User.findOne({ _id: id });
            return res.render("users/accountdeatails", {message: "email already exists. Please choose another one.",usertake});
        }
        await User.updateOne({ _id: id },{ $set: { username, email, phone } });
        const usertake = await User.findOne({ _id: id });
        res.render("users/accountdeatails", {usertake,message: "Details updated successfully."});

    } catch (error) {
        console.log("Error updating details:", error);
        res.status(500).send("Internal Server Error");
    }
};
const savedAddress = async (req,res) => {
  try {
    const userId = req.session.userId;    
    const user = await User.findById(userId).populate('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const address = user.addresses.length > 0 ? user.addresses : null;
    res.render("users/savedaddress",{address})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve addresses.', error });
  }

}
const addaddress = async (req,res) => {
res.render("users/addaddress")

}
const addaddresspost = async (req, res) => {
  const { name, companyname, streetaddress, appartment, city, phone, email } = req.body;

  try {
    // Create a new address document
    const newAddress = new Address({
      name,
      companyname,
      streetaddress,
      appartment,
      city,
      phone,
      email
    });
    await newAddress.save();
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User not logged in' });
    }
    await User.findByIdAndUpdate(userId, { $push: { addresses: newAddress._id } });
    res.redirect("/saved-address")
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const editaddressGet = async (req, res) => {
  const { addressId } = req.params; 
  try {
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.render("users/editaddress", { address });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const editaddressPost = async (req,res) => {
  const { name, companyname, streetaddress, appartment, city, phone, email ,id} = req.body;
  try {
    await Address.findByIdAndUpdate(id,{$set:{name, companyname, streetaddress, appartment, city, phone, email}})
    const userId = req.session.userId;   
    const user = await User.findById(userId).populate('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const address = user.addresses.length > 0 ? user.addresses : null;
    res.render("users/savedaddress",{address})
  } catch (error) {
    console.error("Error updating address:", error);
res.status(500).json({ success: false, message: "Internal server error" });
  }
}



const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: "User not logged in" });
    }
    const { addressId } = req.params;
    const deletedAddress = await Address.findByIdAndDelete(addressId);
    if (!deletedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }
    await User.findByIdAndUpdate(userId, { $pull: { addresses: addressId } });
    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};





const getCart = async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }
      const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
      if (!cart) {
        return res.render('users/cart', { cart: { items: [], totalPrice: 0, totalQuantity: 0 } });
      }
      res.render('users/cart', {
        cart, 
        success: true, 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  





  const addtocartPost = async(req,res)=>{
    try {
        console.log(req.body);
        const { productId, price, quantity,variant,totalquantity,discoundOfferPrice,color,colorQuantity} = req.body;
        const userId = req.session.userId;
        if (!userId) {
          return res.status(401).json({ success: false, message: 'Please Login Or Signup' });
      }
        let cart = await Cart.findOne({ userId });
    
        if (!cart) {
          cart = new Cart({
            userId,
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
          });
        }
        if(cart.items.length > 10){
            return res.json({
                success: false,
                message: 'You cannot add more than 10 different products to your cart.',
              });
        }
        const existingItem = cart.items.find(item => item.productId.toString() === productId && item.variant === variant && item.color === color);
        if (existingItem ) {
          // const totalQuantityAfterAddition = existingItem.quantity + parseInt(quantity);
          const totalQuantityAfterAddition = existingItem.quantity + parseInt(quantity);
          if(totalQuantityAfterAddition > existingItem.colorQuantity){
          return res.status(400).json({
            error: `You cannot add more than ${existingItem.totalquantity} items. Current quantity in cart: ${existingItem.quantity}, available stock: ${existingItem.totalquantity}`})}
          existingItem.quantity += parseInt(quantity);
          existingItem.total = existingItem.quantity * existingItem.price;
          existingItem.totalOfferPrice = existingItem.quantity * existingItem.discoundOfferPricePer
        } else {
         let ProductDeat = await Product.findById(productId)
          const productName = ProductDeat.name;
          const productImage = ProductDeat.image[0];
          const productCategory = ProductDeat.category
          const productBrand = ProductDeat.brand
          console.log(productName);
          console.log(productImage);
          cart.items.push({
            productId,
            productName,
            productImage,
            productCategory,
            productBrand,
            price,
            quantity,
            variant,
            totalquantity,
            total: price * quantity,
            discoundOfferPricePer:discoundOfferPrice,
            totalOfferPrice:discoundOfferPrice*quantity,
            color:color,
            colorQuantity:colorQuantity
            
          });
        }
        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
        await cart.save();
        res.status(200).json({ success: true, message: 'Product added to cart' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
  }






  const updateCart = async (req, res) => {
    try {
      console.log(req.body);
      
      const {  quantity,id,variant,color} = req.body;

      const userId = req.session.userId;
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found' });
      }
      const item = cart.items.find(item => item._id.toString() === id && item.variant === variant && item.color === color) ;
  
      if (!item) {
        return res.status(404).json({ success: false, message: 'Product not found in cart' });
      }
      item.quantity = quantity;
      item.total = item.price * quantity;
      item.totalOfferPrice = item.quantity * item.discoundOfferPricePer
      cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
      const updatePrice = cart.totalPrice;
      const itemPrice = item.total;
      await cart.save();
      res.json({ success: true, message: 'Cart updated successfully' ,updatePrice,itemPrice});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };


  const deletecart = async (req, res) => {
    console.log(req.body); 
    try {
        const { productId ,variant,id} = req.body;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        const item = cart.items.find(item => item._id.toString() === id ) ;
        console.log(item);
        cart.items = cart.items.filter(item => item._id.toString() !== id );
        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
        const updatePrice = cart.totalPrice;
        await cart.save();

        return res.json({ success: true, message: 'Item removed from cart successfully', cart ,updatePrice});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const checkOut = async (req, res) => {
  try {
    const userId = req.session.userId;
      if (!userId) {
          console.log("User is not found");
          return res.status(400).json({ success: false, message: 'User is not found' });
      }
        console.log("User found:", userId);

      const cart = await Cart.findOne({ userId: userId}).populate("items.productId");
      if (!cart) {
          console.log("Cart not found for user", userId);
          return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      console.log("Cart found:", cart);
      const userAddress = await User.findById(userId).populate('addresses');
      const address = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses[0] : null;
      const addresses = userAddress.addresses && userAddress.addresses.length > 0 ? userAddress.addresses : null;
      res.render("users/checkout", { cart, address,addresses });

  } catch (error) {
      console.error("Error during checkout:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getwishlist = async (req,res) => {
    try {
      res.render("users/wishlist")
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
   }
  
  
   const fetchWishlistData = async (req, res) => {
    try {
      const userId = req.session.userId;
      const wishlist = await Wishlist.find({ userId })
        .populate('items.productId') // Populate the product details
        .exec(); // Using exec with await to get the result
  
      res.json({ success: true, items: wishlist[0]?.items || [] }); // Return items if present, else empty array
    } catch (err) {
      console.error(err); // Log the error
      res.status(500).json({ success: false, message: 'Unable to fetch wishlist' });
    }
  };
  
  
    const addtowishlist = async (req,res) => {
      
      try {
        const {productId} = req.params
        if(!productId){
          return res.status(400).json({success:false,message:"product id is required"})
        }
        const userId = req.session.userId;
        if(!userId){
          return res.status(401).json({success:false,message:"Please Login"})
        }
        let wishlist = await Wishlist.findOne({userId:userId})
        if(!wishlist){
          wishlist = new Wishlist({
            userId,
            items:[]
          })
        }
        console.log(productId);
        const existingItem = wishlist.items.find((product)=> product.productId.toString() == productId)
        console.log("item",existingItem);
        
  
        if(existingItem){
          return res.status(401).json({success:false,message:"product alredy in wishlist"})
        }
        wishlist.items.push({productId})
        await wishlist.save();
        await Product.findByIdAndUpdate(
          productId,
          { $push: { WishListVerification: userId } }, 
        );
      
        res.status(200).json({success:true,message:"product added successfully"})
      } catch (error) {
        console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
      }
    }
    const removeWishlist = async (req,res) => {
      console.log("remove")
      try {
        const {productId} = req.params;
        const userId = req.session.userId;
        if(!userId){
          return res.status(401).json({success:false,message:"user not authenticated"})
        } 
        let wishlist = await Wishlist.findOne({userId:userId});
         wishlist.items = wishlist.items.filter((pr)=> pr.productId.toString()!== productId)
        await wishlist.save()
        await Product.findByIdAndUpdate(
          productId,
          { $pull: { WishListVerification: userId } }, 
        )
        return res.status(200).json({success:true,message:"removed sucessfully"})
      } catch (error) {
        console.log(error);
        
      }
    }



module.exports = {manageAccount,
    changedeatails,
    savedAddress,
    addaddress,
    addaddresspost,
    editaddressGet,
    editaddressPost,
    deleteAddress,
    getCart,
    addtocartPost,
    updateCart,
    deletecart,
    checkOut,
    addtowishlist,
    getwishlist,
    removeWishlist,
    fetchWishlistData,}