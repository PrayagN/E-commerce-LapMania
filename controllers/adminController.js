const Admin = require("../models/adminModel");
const bcrypt = require("bcrypt");

// getting user
const User = require("../models/userModel");

// getting product
const Product = require("../models/productModel");
// getting order
const Order = require('../models/orderModel');
// getting Coupon
const Coupon = require('../models/couponModel');

const Category = require('../models/categoryModel')

const session = require("express-session");

const config = require("../config/config");
const express = require("express");

const ejs = require('ejs');
const pdf = require('html-pdf');
const fs  = require('fs');
const path = require('path');
const { findOneAndDelete } = require("../models/userModel");
const { json } = require("body-parser");

var today = new Date();
today = today.toISOString().slice(0,10);
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
};

const verifyLogin = async (req, res,next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await Admin.findOne({ email: email });

    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);

      if (passwordMatch) {
        if (adminData.is_admin === 0) {
          res.render("login", { message: "Email and password is incorrect" });
        } else {
          req.session.admin_id = adminData._id;
          res.redirect("/admin/home");
          
        }
      } else {
        res.render("login", { message: "email and password is incorrect" });
      }
    } else {
      res.render("login", { message: "email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
next(error.message);
  }
}

const logOut = async (req, res,next) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
next(error.message);
  }
};

const loadDashboard = async (req, res,next) => {
  try {

    const orderData = await Order.find({});
    const orders = await Order.find({}).populate('userId').sort({createdAt:-1}).limit(5);
    const deliveredorders = await Order.find({orderStatus:'Delivered'});
    const CancelledOrder =  await Order.find({orderStatus:'Cancelled'});
    const PlacedOrder  = await Order.find({orderStatus:"Placed"});
    
    const userData = await User.find({})
    const count = orderData.length;
    const uscount = userData.length;
    const deliveredCount =deliveredorders.length;
    const cancelledCount = CancelledOrder.length;
    const placedCount = PlacedOrder.length;
    let earnings =0;
    orderData.forEach((orderData)=>{
      if(orderData.orderStatus ==='Delivered'){
        earnings +=orderData.total;
      }
      
    })
    earnings = Math.round(earnings)
    const categorySales = await Order.aggregate([
      {
        $match: { orderStatus: "Delivered" }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: "$category"
      },
      {
        $group: {
          _id: "$category.name",
          sales: { $sum: { $multiply: ["$product.offerPrice", "$products.quantity"] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const lastWeekdata = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },paymentStatus:"Completed"
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total: { $sum: "$total" }
        }
      },
       {
        $sort: { _id: -1 }
      }
    ])
    const totalsArray = lastWeekdata.map((day) => day.total);
    const daysArray = lastWeekdata.map((day)=>new Date(day._id).toString().slice(0,3));
    const days = JSON.stringify(daysArray);
    const totals = JSON.stringify(totalsArray);
    const totalSales = categorySales.map((sales)=>sales.sales);
    const categoryNames = categorySales.map((category) => category._id);
    console.log(categoryNames);
    
    
    console.log(totalSales);
    
     
     
    res.render("home",{count,uscount, orders: orders,earnings,deliveredCount,cancelledCount,placedCount,categorySales,categoryNames,days,totals});
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
};

const loadCustomers = async (req, res) => {
  try {
    // const userData = await User.find({is_verified:1})
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const userData = await User.find({
      __v:0,

      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });
    res.render("customers", { users: userData });
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
};

// View Customer

const viewCustomer = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("customerDetails", { user: userData });
    } else {
      res.redirect("/admin/customers");
    }
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
};


const blockUser = async(req,res,next)=>{
  try {
    const id = req.query.id;
    const userData = await User.findById({_id: id});
    if(userData.is_verified === 0){
      const updatedData = await User.findByIdAndUpdate({_id:id},{$set:{ is_verified : 1 }})
      
      
      res.redirect('/admin/customers');
    }else if(userData.is_verified === 1){
      const updatedData = await User.findByIdAndUpdate({_id:id},{$set:{ is_verified: 0 }})
      
     
      res.redirect('/admin/customers');
    }else{
      console.log('Something went Wrong');
    }
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
}

const loadCoupon = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      var search = "";
      if (req.query.search) {
        search = req.query.search;
      }
      const coupons = await Coupon.find({ __v: 0 ,
        $or: [
          { code: { $regex: ".*" + search + ".*", $options: "i" } }
         
        ],

        
      });
      // const today =new Date()
      //   today.setHours(0, 0, 0, 0);
      //   for(let i=0;i<coupons.length;i++){
      //     const exp = coupons[i].expiryDate;
      //   exp.setHours(0, 0, 0, 0);
      //   }
  
      //   if(exp.getTime() <= today.getTime()) {

      //     const updatedCoupon = await Coupon.findOneAndUpdate({code:coupons},{$set:{status:'expired'}})
      //   }
     
      res.render('coupon',{coupon:coupons})
       checkExpiredCoupons();
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    console.log(error.message);
next(error.message);
  }
}

const addCoupon = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      
        res.render('addCoupon')
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
}

const saveCoupon = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const newCoupon = req.body.code;
      const data = await Coupon.find({code:newCoupon.toUpperCase()});
      let date =new Date(req.body.date);
      
      if(data.length === 0){
        const coupon = new Coupon({
          code : newCoupon.toUpperCase(),
          discount :req.body.discount,
          maxRedeemAmount:req.body.maxRedeemAmount,
          minPurchaseAmount:req.body.minPurchaseAmount,
          status:'valid',
          expiryDate:date,
        })
        const save = await coupon.save();
        if (save) {
          res.redirect("/admin/coupon");
        } else {
          console.log("save not work");
        }
      } else {
        console.log("coupon already exist");
        res.render("addCoupon",{message:"Coupon already exist.."});
      }
      res.render("addCoupon");
      }else{
        res.redirect('/admin');
      }
      
    }
   catch (error) {
    console.log(error.message);
next(error.message)
  }
}

const deleteCoupon = async(req,res,next)=>{
try {

  if(req.session.admin_id){
    const id = req.query.id;

      await Coupon.deleteOne({ _id: id });
      res.redirect('/admin/coupon')
  }else{
    res.redirect('/admin')
  }
} catch (error) {
  console.log(error.message);
  next(error.message);
}

}
var checkExpiredCoupons = async () => {
  const coupons = await Coupon.find({}); // retrieve all coupons from database

  for (const coupon of coupons) {
    if (coupon.expiryDate <= new Date()) {
      // coupon has expired, update status in database
      coupon.status = 'expired';
      await coupon.save(); // save updated coupon to database
    }
  }
};


// call the function every day using a scheduler like cron or setInterval
setInterval(checkExpiredCoupons, 24 * 60 * 60 * 1000);


const crop = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const folderPath = 'upload/';

const image_parts = req.body.image.split(';base64,');
const image_type_aux = image_parts[0].split('image/');
const image_type = image_type_aux[1];
const image_base64 = Buffer.from(image_parts[1], 'base64');
const file = folderPath + Date.now() + '.png';

require('fs').writeFile(file, image_base64, 'binary', function (err) {
  if (err) {
    console.log(err);
    return res.status(500).json({ message: 'Failed to upload image.' });
  }
  res.json({ message: 'Image uploaded successfully.' });
});
    }
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
}

const loadSales = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const orders = await Order.find({orderStatus:'Delivered'}).populate('userId').populate('products.productId').sort({createdAt:-1})
      
      
      res.render('sales',{orders})

    }
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
}
const loadSalesReport = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      console.log(req.body.start_date);
      let start_date = new Date(req.body.start_date);
      let end_date = new Date(req.body.end_date); 
      const order = await Order.find({createdAt:{$gte:start_date,$lte:end_date},orderStatus:'Delivered'}).populate('userId').populate('products.productId').sort({createdAt:-1});
      console.log(order);
      res.json({order})
    }else{
      res.redirect('/admin/login')
    }
    
  } catch (error) {
    console.log(error.message);
next(error.message)
  }
}

const exportData = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      console.log(req.query.start_Date);
      let start_date = new Date(req.query.start_Date);
      console.log(start_date);
      let end_date = new Date(req.query.end_Date); 
      const salesData = await Order.find({createdAt:{$gte:start_date,$lte:end_date},orderStatus:'Delivered'}).populate('userId').populate('products.productId').sort({createdAt:-1});
        start_date = start_date.toLocaleString().slice(0,10);
        end_date = end_date.toLocaleString().slice(0,10);
        let total = 0;
        salesData.forEach((salesData)=>{
          total+=salesData.total;
        })
      const data = {
        orderData: salesData,
        start_date,end_date,total
      };
  
      const filePathName = path.resolve(
        __dirname,
        "../views/admin/salesReport.ejs"
      );
      const htmlString = fs.readFileSync(filePathName).toString();
      let options = {
        format: "Letter",
      };
      const ejsData = ejs.render(htmlString, data);
      const pdfPromise = new Promise((resolve, reject) => {
        pdf.create(ejsData, options).toStream((err, stream) => {
          if (err) reject(err);
          else resolve(stream);
          console.log("here");
        });
      });
      const stream = await pdfPromise;
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=salesreport1.pdf",
      });
      stream.pipe(res);
    }
  } catch (error) {
    console.log(error.message);
next(error.message)
    res.status(500).send("Internal server error.");
  }
}
module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  loadCustomers,
  logOut,
  viewCustomer,
  blockUser,
  loadCoupon,
  addCoupon,
  saveCoupon,
  deleteCoupon,  
  crop,
  loadSales,
  loadSalesReport,
  exportData
  
};
