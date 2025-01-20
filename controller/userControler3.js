const {OTP,User,Address,Cart,Order,Return,Wallet} = require("../model/user/usermodel")
const{Product, Coupen, Category} = require("../model/admin/adminmodel")

const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const env = require("dotenv");
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,  
    key_secret: process.env.RAZORPAY_SECRET_KEY,  
});

const verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature ,type} = req.body;
    if(type == "Wallet"){      
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
          .update(body.toString())
          .digest("hex");
      const userId = req.session.userId;
      const wallet = await Wallet.findOne({userId});
      if (!wallet) {
          return res.status(404).json({ success: false, message: "wallet not found" });
      }

      if (expectedSignature === razorpaySignature) {
        const amount = req.session.amount;
        
        wallet.balance += amount;
        wallet.transactions.push({
            transactionId: `addmoney-${razorpayOrderId}`,
            date: new Date(),
            description: "Add Money To Wallet",
            type: "credit", 
            amount: amount,
        });
        await wallet.save();
        return  res.status(200).json({ success: true, message: "Payment verified successfully" });
      } else {

         return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    }

    
    const orderId = req.session.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID not found in session" });
    }
  
    if(type == "repay"){
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
          .update(body.toString())
          .digest("hex");

      const order = await Order.findOne( {orderId:orderId} );
      if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (expectedSignature === razorpaySignature) {
          order.paymentStatus = "Paid";
          order.orderStatus = "Pending"; 
          order.paymentMethod = "RazorPay"
          order.razorpay = { paymentId: razorpayPaymentId, signature: razorpaySignature };
          await order.save();

        return  res.status(200).json({ success: true, message: "Payment verified successfully", orderId });
      } else {
          order.paymentStatus = "Failed";
          order.orderStatus = "Cancelled";
          order.razorpay = { paymentId: razorpayPaymentId, signature: razorpaySignature };
          await order.save();

         return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    }


    


  
  
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");
    const order = await Order.findOne({ orderId });
  
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
  
    if (expectedSignature === razorpaySignature) {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            "razorpay.paymentId": razorpayPaymentId,
            "razorpay.signature": razorpaySignature,
            paymentStatus: "Paid",
            orderStatus: "Pending", // Update the status accordingly
          },
        },
        { new: true } // This option returns the updated document
      );

      res.status(200).json({ success:true,message: "Payment verified successfully", updatedOrder ,orderId});
    } else {
      // Update the order as failed and cancelled
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            "razorpay.paymentId": razorpayPaymentId,
            "razorpay.signature": razorpaySignature,
             paymentStatus: "Failed",
            orderStatus: "Cancelled",
          },
        },
        { new: true }
      );
  
      res.status(400).json({ message: "Payment verification failed" });
    }
  };


  const placeOrder = async (req,res)=>{
    const {paymentMethod, useDefaultAddress, totalPrice,coupenId,coupenDiscountAmount,...newAddress} = req.body
    try {
      const userId = req.session.userId;
     const cart = await Cart.findOne({ userId: userId })
     if (!cart || cart.items.length === 0) {
      
      return res.status(400).json({ message: "Cart is empty" });
  }
  if(!newAddress){
    return res.status(400).json({ message: "please Add Address" });
  }
     const cartItems = cart.items;
    const cartDiscount = cart.CartTotalOffer;
     
      let finalAddress;
      if(useDefaultAddress){
        const address = await Address.findOne({_id:useDefaultAddress});
        finalAddress = address
      }else{
          finalAddress = newAddress;     
      }
      console.log(finalAddress);
      if(!finalAddress){
        return res.status(400).json({ message: "please Add Address" });
      }
      const orderId = `ORD${Date.now()}`;

    if(coupenId){

      const coupen = await Coupen.findById(coupenId)
      coupen.count++;
       if (coupen.count >= 3) {
    coupen.status = "redeemed"; 
  }
  coupen.userId.push(userId)
  await coupen.save()
    }
      let razorpayOrderId = null;
      let paymentStatus ;
      if (paymentMethod === "RazorPay") {
        try {
          
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalPrice * 100), // Amount in paisa
                currency: "INR",
                receipt: orderId,
            });
            razorpayOrderId = razorpayOrder.id;
            paymentStatus = "Failed"
            console.log(  razorpayOrder.id);
            
        } catch (error) {
            console.error("Error creating Razorpay order:", error);
            return res.status(500).json({ message: "Failed to initiate Razorpay payment." });
        }
    }
    if (paymentMethod === 'Wallet') {
     
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      if (wallet.balance < totalPrice) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      wallet.balance -= totalPrice;

      wallet.transactions.push({
        transactionId: `TXN-${Date.now()}`,
        amount: totalPrice,
        description: `Order Payment of ${orderId}`,
        type: 'debit',
      });
       paymentStatus = "Paid"
      await wallet.save();
    }

      const order = new Order({
        orderId,
        userId:userId,
        paymentMethod,
        totalPrice,
        cartItems,
        address:finalAddress,
        razorpay: {
          orderId: razorpayOrderId, // Save Razorpay order ID
        },
        orderStatus:"Pending",
        paymentStatus,
        coupenId:coupenId,
        coupenDiscountAmount:coupenDiscountAmount,
        CartTotalOffer:cartDiscount
      })
    for (let item of cartItems) {
      const product = await Product.findById(item.productId);
      if (product) {
          const variant = product.variants.find(v => v.variant === item.variant);
          if (variant) {
              variant.quantity -= item.quantity;
              if (variant.quantity < 0) variant.quantity = 0;
              let color = variant.colors.find(color => color.color === item.color)
              if(color){
                color.quantity -= item.quantity
              }
              await product.save(); 
          }
      }
  }
  await Cart.updateOne({ userId: userId }, { $set: { items: [] ,totalQuantity:0,totalPrice:0} });
  await order.save();
  req.session.orderId = orderId;

  

  res.status(201).json({ 
    message: "Order created successfully", 
    order, 
    razorpayOrderId, 
    key_id: process.env.RAZORPAY_KEY_ID,
    orderId
  });
 

 

    } catch (error) {
      console.log(error);
      
    }
  }




  const getOrdersPage = async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(404).send("User not found");
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;
      const orders = await Order.find({ userId: userId })
        .sort({ createdAt: -1 }) 
        .skip(skip)   
        .limit(limit) 
        .populate("cartItems.productId");
      const totalOrders = await Order.countDocuments({ userId: userId });
      const totalPages = Math.ceil(totalOrders / limit); 
      res.render("users/myorders", {
        orders,
        currentPage: page,
        totalPages: totalPages
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Something went wrong");
    }
  };
  




  const cancelOrder = async (req, res) => {
    try {
      const userId = req.session.userId;      
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({ message: "Order has already been cancelled" });
        }
        order.orderStatus = "Cancelled";
        for (let item of order.cartItems) {
            const product = await Product.findById(item.productId);

            if (product) {
                const variant = product.variants.find(v => v.variant === item.variant);
                if (variant) {
                    variant.quantity += item.quantity; 
                let color = variant.colors.find(color => color.color === item.color)
              if(color){
                color.quantity += item.quantity
              }
                    await product.save(); 
                }
            }
        }

        if (order.paymentMethod === "RazorPay" && order.paymentStatus == "Paid" || order.paymentMethod === "Wallet" && order.paymentStatus == "Paid" ) {
          const wallet = await Wallet.findOne({ userId });
        if(!wallet){
            return res.status(404).json({ message: "Wallet not found for the user." });
        }
          if (wallet) {
              if (typeof order.totalPrice !== 'number' || isNaN(order.totalPrice)) {
                  throw new Error(`Invalid totalAmount: ${order.totalPrice}`);
              }
              wallet.balance += order.totalPrice;
              wallet.transactions.push({
                  transactionId: `Refund-${order._id}`,
                  date: new Date(),
                  description: `Refund for cancelled order ${order._id}`,
                  type: "credit", 
                  amount: order.totalPrice,
              });
              order.paymentStatus = "Refunded"
              await wallet.save();
          } else {
              console.error("Wallet not found for user:", userId);
              return res.status(404).json({ message: "User wallet not found" });
          }
      }

      if(order.paymentMethod === "RazorPay" && order.paymentStatus == "Failed" || order.paymentMethod === "Wallet" && order.paymentStatus == "Failed" ){
         order.paymentStatus = "Cancelled"
      }

      if(order.paymentMethod === "COD"){
         order.paymentStatus = "Cancelled"
      }
      
       
     let ordersstatus = order.orderStatus
     let paymentstatus = order.paymentStatus

     
        await order.save();
        res.status(200).json({ message: "Order cancelled successfully", order ,ordersstatus,paymentstatus});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while canceling the order" });
    }
};


const returnrequiest = async (req,res) => {
    try {
      const {productId,orderId} = req.params;
      const userId = req.session.userId;
      const {reason,itemId} = req.body;
      if (!productId || !orderId || !userId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'something went wrong',
        });
      }
      const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const items = order.cartItems.find( (item) => item._id.toString() == itemId )
    items.reason = reason;
    items.status = "Pending"
    await order.save()
    
    const returnrequiest = new Return({
     orderId,
     productId,
     userId,
     reason
    })

 await returnrequiest.save();
 res.status(201).json({
  success: true,
  message: 'Return request submitted successfully.',
});

  } catch (error) {
     console.error('Error processing return request:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
  }
  const applyCoupens = async (req,res) => {
    try {
      const {couponCode,TotalPrice} = req.body;
      const userId = req.session.userId;
      const coupen = await Coupen.findOne({couponCode})
      if(!coupen){
        return res.status(404).json({ success: false, message: "Invalid coupon code." });
      }
      const user = coupen.userId.find((user) => user.toString() == userId)
      if(user){
        return res.status(400).json({ success: false, message: "Coupon already used by this user." })
      }
      const now = new Date();
      if (now > coupen.expiryDate) {
        return res.status(400).json({ success: false, message: "Coupon code has expired." }); 
      }
      const redeem = coupen.status == "redeemed";
      if(redeem){
        
        return res.status(400).json({ success: false, message: "Coupon code has redeemed." });
      }
      const discount = coupen.discount; 
    const originalTotal = TotalPrice; 
    const newTotal = originalTotal - (originalTotal * (discount / 100));
    const totalDiscount = originalTotal - newTotal
    const coupenId = coupen._id;
    await coupen.save();
    return res.status(200).json({ success: true, message: `Coupon applied! You saved ${discount}%.`, newTotal ,coupenId,totalDiscount});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
    }
  }
  



  const getWallet = async (req,res) => {
    try {
      const userId = req.session.userId;
      if(!userId){
        return res.status(401).json({success:false,message:"user not authenticated"})
      } 
      function generateCardNumber() {
        const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
        const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
        return cardNumber;
    } 
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
    const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;
      let wallet = await Wallet.findOne({userId})
      const user = await User.findById(userId)
      if(!wallet){
        wallet = new Wallet({
          userId: userId,
          cardNumber: generateCardNumber(), 
          balance: 0.0,   
          cardExpiry: cardExpiry,
          cardHolderName: user.username, 
          cardType: 'MasterCard', 
          transactions: []  
  
        })
      }
  
      await wallet.save();
      res.render("users/wallet",{wallet})
    } catch (error) {
      console.error("Error in getWallet:", error);
      res.status(500).json({ success: false, message: "An error occurred while fetching wallet data." });
    }
   
  }

  const repayOrder = async (req, res) => {
    try {     
        const { orderId, paymentMethod, totalPrice } = req.body;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        req.session.orderId = order.orderId;
        const orderid = order.orderId
        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(404).json({ success: false, message: "Wallet not found" });
            }
            if (wallet.balance < totalPrice) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
            }
            wallet.balance -= totalPrice;
            wallet.transactions.push({
                transactionId: `TXN-${Date.now()}`,
                amount: totalPrice,
                description: `Order Payment for ${orderId}`,
                type: 'debit',
            });
            order.paymentStatus = "Paid";
            order.paymentMethod = "Wallet";
            order.orderStatus = "Pending"
            await wallet.save();
            await order.save();

            return res.status(200).json({ success: true, message: "Payment successful", order,orderid });
        }
        if (paymentMethod === "RazorPay") {
          try {
              const razorpayOrder = await razorpay.orders.create({
                  amount: Math.round(totalPrice * 100), // Amount in paisa
                  currency: "INR",
                  receipt: orderId,
              });
              let razorpayOrderId = razorpayOrder.id;
              return res.status(200).json({
                  success: true,
                  message: "Razorpay order created successfully",
                  razorpayOrderId,
                  key_id: process.env.RAZORPAY_KEY_ID
              });
          } catch (error) {
              console.error("Error creating Razorpay order:", error);
              return res.status(500).json({
                  success: false,
                  message: "Failed to create Razorpay order. Please try again.",
              });
          }
      }
        return res.status(400).json({ success: false, message: "Invalid payment method" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};


const addMoneyWallet = async (req,res) => {
    const {amount} = req.body;
   req.session.amount = amount;
      try {
        const receiptId = `rec_${uuidv4().slice(0, 30)}`;
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Amount in paisa
            currency: "INR",
            receipt: receiptId,
        });
  
        let razorpayOrderId = razorpayOrder.id;
  
        
        return res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            razorpayOrderId,
            key_id: process.env.RAZORPAY_KEY_ID
        });
  
  
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order. Please try again.",
        });
    }
  }
  
  
  const getTransaction = async (req, res) => {
    try {
      const userId = req.session.userId;
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      const sortedTransactions = wallet.transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
      const balance = wallet.balance;
      res.status(200).json({ transactions: sortedTransactions ,balance});    
    } catch (error) {
      console.error("Error fetching transaction data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }


 module.exports = { placeOrder,
                   getOrdersPage,
                   cancelOrder,
                   returnrequiest,
                   applyCoupens,
                   getWallet,
                   addMoneyWallet,
                   getTransaction,
                   repayOrder,
                   verifyPayment,}