const {Admin, Coupen,Product,Category} = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const {User,Order,Return,Wallet,Offer} = require("../model/user/usermodel")
const cron = require('node-cron');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose')


const orderManagment = async (req,res) => {
    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit)||10;
    try {
      const skip = (page - 1) * limit
      const totalOrders = await Order.countDocuments();
      const order = await Order.find().sort({createdAt:-1}).skip(skip).limit(limit);
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
      try {
          const order = await Order.findById(orderId); 
          if (!order) {
              return res.status(404).json({ message: 'Order not found' });
          }
          if(status == "Cancelled" && order.paymentMethod === "RazorPay" && order.paymentStatus == "Paid" ||status == "Cancelled" && order.paymentMethod === "Wallet" && order.paymentStatus == "Paid"){
            const userId = order.userId;
            let wallet = await Wallet.findOne({ userId }); 

            if(!wallet){
              const expiryDate = new Date();
              expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
              const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;

              function generateCardNumber() {
                const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
                const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
                return cardNumber;
              }

              const user = await User.findById(userId)

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
           
        }
         
        if(status == "Cancelled" && order.paymentMethod === "COD"){
          order.paymentStatus = "Cancelled"
        }else if(status == "Delivered" && order.paymentMethod === "COD"){
          order.paymentStatus = "Paid"
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
        const { orderId, itemId ,userId} = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
          return res.status(404).json({ success: false, message: "Order not found." });
        }
        const item = order.cartItems.find((item) => item._id.toString() === itemId);
        if (!item) {
          return res.status(404).json({ success: false, message: "Item not found in the order." });
        }
  
  
        let walletbalance;
          let wallet = await Wallet.findOne({ userId });
        if(!wallet){
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 5);  // Set expiry to 5 years from now
          const cardExpiry = `${("0" + (expiryDate.getMonth() + 1)).slice(-2)}/${expiryDate.getFullYear().toString().slice(-2)}`;

          function generateCardNumber() {
            const prefix = Math.floor(Math.random() * 5) + 51;  // Generates a number between 51 and 55
            const cardNumber = `${prefix}${Math.floor(Math.random() * 1000000000000000)}`.slice(0, 16);
            return cardNumber;
          }

          const user = await User.findById(userId)

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
          if (wallet) {
              if (typeof item.total !== 'number' || isNaN(item.total)) {
                  throw new Error(`Invalid totalAmount: ${item.total}`);
              }
              if(order.coupenId != null){
                const coupenId = order.coupenId;
                const coupen = await Coupen.findById(coupenId)
                const discountAmountt = coupen.discount;
                const discountAmount = (item.total * discountAmountt) / 100; 
                walletbalance = item.total - discountAmount; 
              }else{
                walletbalance = item.total
              }
          
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
        order.income -= walletbalance;

        let count = 0;
        for(let item of order.cartItems){
           if(item.status == "Accepted"){
             count++;
           }
        }
        
        if( count == order.cartItems.length){
            order.orderStatus = "Returned"
        }
        
        
         
        
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
  
      const coupens = await Coupen.find().sort({createdAt:-1}).skip(skip).limit(limit);
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
      const existingCoupen = await Coupen.findOne({ couponCode });
      if(existingCoupen){
        const coupens = await Coupen.find({});
        return res.status(400).json({ success:false,message: "Coupon code already exists." })  
        };
      const newCoupen = new Coupen({
        couponCode,
        discount,
        expiryDate,
        description
      })
      await newCoupen.save()
      const coupens = await Coupen.find({});
      res.status(201).json({
        success:true,message: "Coupon created successfully!",
      })
  
      } catch (error) {
       console.error("Error creating coupon:", error);
      res.status(500).json({
        message: "Error creating coupon. Please try again.",
      });
  
    }
  }
  
  
  
  cron.schedule('0 0 * * *', async () => {
    try {
      const expiredCoupons = await Coupen.updateMany(
        { expiryDate: { $lt: moment().tz('Asia/Kolkata').toDate() }, status: 'active' },
        { status: 'inactive' }
      );
    } catch (error) {
      console.error('Error updating expired coupons:', error);
    }
  });
  
  
  const deleteCoupen = async (req, res) => {
    try {
      
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
        return res.status(400).json({ 
          success: false, 
          message: 'Offer already exists with the same name.' 
        });
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
        return res.status(404).json({ 
          success: false, 
          message: 'Offer not found.' 
        });
      }
      const offer = await Offer.findById(id)
      res.status(200).json({ 
        success: true, 
        message: 'Offer updated successfully.', 
        offer: updatedOffer 
      });
  
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error.', 
        error: error.message 
      });
    }
  };
  
  
  const createOffer = async (req,res) => {
    try {
      
      const { offerName,offerType, discountType, discountValue, minimumOrderValue, expiryDate,StartingDate, isActive } = req.body;
      
      const exist = await Offer.findOne({offerName})
      if( exist){
        return res.status(400).json({ success: false, message: "Offer already exists." });
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
      res.status(201).json({ success: true, message: "Offer created successfully." });
      } catch (error) {
        console.error("Error creating offer:", error);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    }
  }
  
  const deleteOfferPost = async (req,res) => {
    try {
      const {offerId} = req.params;
      await Offer.findByIdAndDelete(offerId)
      res.status(200).json({ success: true, message: "deleted successfully" });
      
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
            totalSales: { $sum: "$income" },
          },
        },
      ]);
  
      const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;
  
  
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
  
  
      const totalSales = orders.reduce((sum, order) => sum + order.income, 0);
      const totalOffers = orders.reduce((sum, order) => sum + (order.CartTotalOffer || 0) + (order.coupenDiscountAmount || 0), 0);
  
      res.json({ orders, totalSales, totalOffers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error generating report', error });
    }
  };
  
  const downloadExcel = async (req, res) => {
    
    const { rowData } = req.body;
    
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
      ];
  
      // Add data rows
      rowData.forEach(order => {
        worksheet.addRow({
          date: order.date,
          orderId: order.orderId,
          totalPrice: `₹${order.totalAmount}`,
          CartTotalOffer: `₹${order.discount || 0}`,
          coupenDiscountAmount: `₹${order.Coupen || 0}`,
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
    downloadPDF,}