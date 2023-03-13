const bodyParser = require('body-parser');
const express =require('express');
const { SecondaryAuthTokenPage } = require('twilio/lib/rest/accounts/v1/secondaryAuthToken');
const mongoose =  require("mongoose");
const user_route =express();

const session = require("express-session")

const config = require("../config/config")
user_route.use(session({secret:config.sessionSecret}))

const auth = require('../middleware/auth');

user_route.set('view engine','ejs');
user_route.set('views','./views/users');


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')('ACa03249aa51e63ec83df0e4a59ebf6d3f', '62f77a1c58e2466866e9ae79d62cd98c');


const userController =require("../controllers/userController");
const { isLogin } = require('../middleware/adminAuth');

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));


user_route.get('/login',auth.isLogout,userController.loadLogin);

user_route.post('/login',userController.verifyLogin);

user_route.get('/logout',auth.isLogin,userController.logout)

user_route.get('/signup',auth.isLogout,userController.loadSignup);

user_route.post('/signup',userController.insertUser);


user_route.get('/',userController.loadHome)

user_route.get('/home',auth.isLogin,userController.loadHome)

user_route.get('/shop',userController.loadShop)

user_route.post('/search',userController.searchProduct)

user_route.post('/sortPrice',userController.sortPrice)

user_route.get('/filter',userController.filterBrand)

user_route.get('/productdetail',userController.loadDetails)

user_route.get('/addtowishlist/:productId',userController.addtoWishlist)

user_route.get('/wishlist',auth.isLogin,userController.loadWishlist)

user_route.get('/removewishlist',auth.isLogin,userController.removeWishlist);

user_route.get('/contact',userController.loadContact)

user_route.get('/addtocart',userController.addtoCart)

user_route.get('/cart',auth.isLogin,userController.loadCart)

user_route.get('/removeCart',auth.isLogin,userController.removeCart)

user_route.get('/cart/:productId',auth.isLogin,userController.increment);

user_route.post('/cart/:productId',auth.isLogin,userController.decrement);

user_route.get('/checkout',auth.isLogin,userController.loadCheckout)

user_route.post('/checkout',auth.isLogin,userController.loadOrderPage)

user_route.get('/orderpage',auth.isLogin,userController.orderPageView)

user_route.post('/verify-payment',auth.isLogin,userController.verifyPayment)

user_route.post('/couponapply/:coupon',auth.isLogin,userController.couponApply)

user_route.get('/orderlist',auth.isLogin ,userController.orderlist);

user_route.get('/orderView',auth.isLogin,userController.orderView)

user_route.get('/orderCancel',auth.isLogin,userController.orderCancel);

user_route.get('/profile',auth.isLogin,userController.loadAccount);

user_route.get('/editProfile',auth.isLogin,userController.loadEditProfile)

user_route.post('/editProfile',auth.isLogin,userController.updateProfile)

user_route.get('/addAddress',auth.isLogin,userController.loadAddAddress)

user_route.post('/addAddress',auth.isLogin,userController.pushAddress)

user_route.get('/manageAddress',auth.isLogin,userController.loadManageAddress)

user_route.get('/editAddress',auth.isLogin,userController.loadEditAddress)

user_route.post('/editAddress',auth.isLogin,userController.updateAddress)

user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress);


user_route.get('/forget',userController.forgetLoad)

user_route.post('/forget',userController.forgetVerify)

user_route.get('/forget-password',userController.forgetPasswordLoad);

user_route.post('/forget-password',userController.ResetPassword);

user_route.get('/otp',userController.otpPageLoad);

user_route.post('/otp',userController.checkNumber)

// user_route.post('/otpVerify',userController.checkNumber)

user_route.get('/otpverify',userController.loadOtpVerify)


user_route.get('/resendOtp',userController.resendOtp)


user_route.post('/check',userController.check)







module.exports = user_route;