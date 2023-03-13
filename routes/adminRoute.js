const express = require('express');
const admin_route = express();

const session = require("express-session");
const config = require('../config/config')
admin_route.use(session({secret:config.sessionSecret}));

const Product = require('../models/productModel');
const Order =require('../models/orderModel');

const bodyParser = require("body-parser")

admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

// get photos
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/productImages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const filefilter = (req,file,cb)=>{
    if(file.mimetype === 'image/png'|| file.mimetype === 'image/jpg'|| file.mimetype === 'image/jpeg'){
        cb(null, true);
    }else{
        // cb(null,false);
        // return cb(new Error("only upload jpg,png,jpeg formats.."))
    }
}
const upload = multer({storage:storage,fileFilter:filefilter})
 



admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const auth = require('../middleware/adminAuth')
const adminController = require("../controllers/adminController")

const categoryController = require('../controllers/categoryController');


admin_route.get('/',auth.isLogout,adminController.loadLogin)




admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);



admin_route.get('/logout',auth.isLogin,adminController.logOut);

admin_route.get('/customers',auth.isLogin ,adminController.loadCustomers);

admin_route.get('/viewCustomers',auth.isLogin,adminController.viewCustomer);

admin_route.get("/blockUser",adminController.blockUser);


admin_route.get('/category',categoryController.category);
admin_route.get('/addCategory',categoryController.addCategory);
admin_route.post('/addCategory',upload.single('image'),categoryController.saveCategory);
admin_route.get('/deleteCategory/:id',categoryController.deleteCategory);

admin_route.get('/products',upload.array('image',4),auth.isLogin,categoryController.loadProducts)

admin_route.get('/addProducts',upload.array('image',4) ,auth.isLogin,categoryController.newProduct)

admin_route.post('/addProducts',upload.array('image',4),auth.isLogin,categoryController.addProduct)

admin_route.get('/productDetails',upload.array('image',4) ,auth.isLogin,categoryController.viewProducts)

admin_route.get('/deleteProduct',auth.isLogin,categoryController.deleteProduct)

admin_route.get('/editProduct',upload.array('image',4),auth.isLogin,categoryController.editProduct)

admin_route.post('/editProduct',upload.fields([{ name: "image1" }, { name: "image2" }, { name: "image3" },{ name: "image4" }]),auth.isLogin,categoryController.updatedProduct)

// admin_route.get('/removeimg/:image',auth.isLogin,categoryController.removeImage)

admin_route.get('/orders',auth.isLogin,categoryController.loadOrder)

admin_route.get('/orderDetails',auth.isLogin,categoryController.orderDetails);

admin_route.post('/updateStatus',auth.isLogin,categoryController.updateStatus)

admin_route.get('/banner',auth.isLogin,categoryController.loadBanner)

admin_route.get('/addBanner',auth.isLogin,categoryController.addBanner)

admin_route.post('/addBanner',upload.single('image'),auth.isLogin,categoryController.saveBanner)

admin_route.get('/coupon',auth.isLogin,adminController.loadCoupon);

admin_route.get('/addCoupon',auth.isLogin,adminController.addCoupon);

admin_route.post('/addCoupon',auth.isLogin,adminController.saveCoupon);

admin_route.get('/deleteCoupon',auth.isLogin,adminController.deleteCoupon);



admin_route.get('/sales',auth.isLogin,adminController.loadSales)

admin_route.post('/salesReport',auth.isLogin,adminController.loadSalesReport)

admin_route.get('/exportPDF',auth.isLogin,adminController.exportData)

admin_route.get('*',function(req,res){
    res.render('404')
})

module.exports = admin_route;