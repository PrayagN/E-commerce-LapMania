const Admin = require("../models/adminModel");
const path = require('path')
// getting product
const Product = require("../models/productModel");
//getting category
const Category = require("../models/categoryModel");
// getting Orders
const Order = require('../models/orderModel');
//getting User
const User = require('../models/userModel');
// getting Banner
const Banner = require('../models/banner');

const Cropper = require('cropperjs')

const fs = require('fs');
const { findByIdAndUpdate } = require("../models/categoryModel");
const banner = require("../models/banner");

const category = async (req,res,next) => {
  try {
    if (req.session.admin_id) {
      var search = "";
      if (req.query.search) {
        search = req.query.search;
      }
      const categories = await Category.find({list:0 ,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } }
         
        ],

        
      });

      console.log(categories);
      res.render("category", { category: categories });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
next(error.message);
  }
}

const addCategory = async (req,res,next) => {
  try {
    if (req.session.admin_id) {
      res.render("addCategory");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message)
next(error.message);

  }
}

const saveCategory = async (req,res,next) => {
  try {
    if (req.session.admin_id) {

      const newCategory = req.body.category;
    

      const data = await Category.find({ name: newCategory.toUpperCase() });

      if (data.length === 0) {
        const category = new Category({
          name: newCategory.toUpperCase(),
          image: req.file.filename,
          list:0
        });

        const save = await category.save();
        console.log(save);
        if (save) {
          res.redirect("/admin/category");
        } else {
          console.log("save not work");
        }
      } else {
        console.log("category already exist");
        res.render("addCategory",{message:"Category already exist.."});
      }
      res.render("addCategory");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message)
next(error.message);

  }
}

const deleteCategory = async (req,res,next) => {
  try {
    if (req.session.admin_id) {
      const id = req.params.id;
      const productCheck =  await Product.find({category:id,list:1});
      if(productCheck.length === 0 || productCheck.some(p => p.list === 1)){
        await Category.findByIdAndUpdate({_id:id},{$set:{list:1}});
     
      res.json({success:true});
       }else{
        res.json({success:false});
       }
      // res.redirect("/admin/category");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message)
next(error.message);
 }
}

//edit category

const editCategory = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const id = req.query.id;
      const categories = await Category.findById({ _id:id });
      res.render('editCategory',{categories})
    }
    
  } catch (error) {
    console.log(error.message)
next(error.message);
;
  }
}

// update Category

const updateCategory = async(req,res,next)=>{
  try {
    
      if(req.session.admin_id){
        if(req.files){

          const updateCategory =await Category.findByIdAndUpdate({_id:req.body.id},{
          $set:{ image :req.body.image, name:req.body.name}
        });
        
        }else{
          const updateCategory =await Category.findByIdAndUpdate({_id:req.body.id},{
            $set:{  name:req.body.name}
          })


        }
        res.redirect('/admin/category');
      }

  } catch (error) {
    console.log(error.message)
next(error.message);
;
  }
}


// Load Products
const loadProducts = async (req, res,next) => {
  try {
    if (req.session.admin_id) {
      var search = "";
      if (req.query.search) {
        search = req.query.search;
      }
      const categoryName =await Category.find({},{_id:1})
    const  values = categoryName.map(category =>category._id)
    const ProductData = await Product.find({category:{$in:values},
    $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        
        ],
    }).populate('category');
    const categories = await Category.find({__v:0})
      res.render("products", { product :ProductData, category: categories });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
next(error.message);

  }
}

// adding Products
const newProduct = async (req,res,next) => {
  try {
    const categories = await Category.find({ __v: 0,list:0 });
    
    res.render("addProducts", { categories: categories });
  } catch (error) {
    console.log(error.message)
next(error.message);
;
  }
};

// view products
const viewProducts = async (req, res,next) => {
  try {
    const id = req.query.id;

    
    const ProductData = await Product.findById({ _id: id }).populate('category')
    if (ProductData) {
      res.render("productDetails", { product: ProductData });
    } else {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message)
next(error.message);

  }
};

const addProduct = async (req,res,next) => {
  try {

      
    console.log(req.file);
    const name = req.body.name;
    const price = req.body.price;
    const image = req.files;
    const price2 = req.body.offerPrice;
    const Brand = req.body.brand;
    const processor = req.body.processor;
    const ram = req.body.ram;
    const storage = req.body.storage;
    const os = req.body.os;
    const Categories = req.body.categories1;
    const stock = req.body.stock;
    const Description = req.body.description;
    
    console.log(image);

    let imageId = [];

    const imageUpload = await function () {
      for (let i = 0; i < image.length; i++) {
        imageId[i] = image[i].filename;
      }
    };
    imageUpload();

    console.log(imageId);

    const product = new Product({
      name: name,
      price: price,
      image: imageId,
      offerPrice: price2,
      brand: Brand,
      processor :processor,
      ram :ram,
      ssd : storage,
      operatingSystem : os,
      category: Categories,
      stocks: stock,
      description: Description,
      list:0
    });
    const productData = await product.save();

    console.log(productData.image[0]);

    if (productData) {
      res.redirect("/admin/products");
    } else {
      res.render("addProducts", { message: "something went wrong" });
    }
  } catch (error) {
    console.log(error.message)
next(error.message);
  }
};


const  deleteProduct = async(req,res,next)=>{
  try {
    const id = req.query.id;
    const productData = await Product.findById({_id: id});
    if(productData.list === 0){
      const updatedData = await Product.findByIdAndUpdate({_id:id},{$set:{ list : 1 }})
      
      
      res.redirect('/admin/products');
    }else if(productData.list === 1){
      const updatedData = await Product.findByIdAndUpdate({_id:id},{$set:{ list: 0 }})
      
     
      res.redirect('/admin/products');
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    console.log(error.message);
next(error.message);
  }
}
// edit Product
const   editProduct = async (req,res,next) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findById({ _id: id });
    const categories = await Category.find({ __v: 0 });
    if (ProductData) {
      res.render("editProducts", { product: ProductData,categories: categories  });
    } else {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message)
next(error.message);
;
  }
};

// const removeImage = async(req,res,next)=>{
//   try {
//     if(req.session.admin_id){
//       const image = req.params.image
//       const imagePath = path.join(__dirname,'../public/productImages',image);
//       fs.unlink(imagePath,(err)=>{
//         if(err) throw err;
//         console.log(`${image} deleted`);
//       })
//       const product = await Product.findOne({image:{$elemMatch:{$eq:image}}})
//       const deleteImage = await Product.updateOne({_id:product._id},{$pull:{image:image}})
//       res.json({status:true,product:product._id})
//     }
//   } catch (error) {
//     console.log(error.message)
// next(error.message);
// ;
//   }
// }

// updated products
const updatedProduct = async (req, res,next) => {
  try {
    if(req.session.admin_id){
    let img1 = null;
    let img2 = null;
    let img3 = null;
    let img4 = null;

    const productData = {
      name: req.body.name,
      price: req.body.price,
      offerPrice: req.body.offerPrice,
      brand: req.body.brand,
      processor: req.body.processor,
      ram:req.body.ram,
      storage:req.body.storage,
      os:req.body.os,
      category: req.body.categories1,
      stocks: req.body.stock,
      description: req.body.description,
    };

    const updatedData = await Product.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: productData }
    );
    // update the product with the uploaded images at positions

    // Check if each image was uploaded and assign it to the appropriate variable

    if (
      req.files &&
      req.files.image1 &&
      req.files.image1[0].fieldname === "image1"
    ) {
      img1 = req.files.image1[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(__dirname,'../public/productImages',data.image[0])
      fs.unlinkSync(imagePath);
      data.image[0] = img1;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    if (
      req.files &&
      req.files.image2 &&
      req.files.image2[0].fieldname === "image2"
    ) {
      img2 = req.files.image2[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(
        __dirname,
        '../public/productImages',
        data.image[1]
      );
      fs.unlinkSync(imagePath);
      data.image[1] = img2;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    if (
      req.files &&
      req.files.image3 &&
      req.files.image3[0].fieldname === "image3"
    ) {
      img3 = req.files.image3[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(
        __dirname,
        '../public/productImages',
        data.image[2]
      );
     fs.unlinkSync(imagePath);
      data.image[2] = img3;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    if (
      req.files &&
      req.files.image4 &&
      req.files.image4[0].fieldname === "image4"
    ) {
      img4 = req.files.image4[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(__dirname,'../public/productImages',data.image[3])
      fs.unlinkSync(imagePath);
      data.image[3] = img4;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    res.redirect("/admin/products");
    }else{
      res.redirect('/admin/login');
    }
    
  } catch (error) {
    console.log(error.message);
    next(error.message);

  }
};

// orderPageloading

const loadOrder = async(req,res,next)=>{
    try {
      
      if (req.session.admin_id) {
        var search = "";
        if (req.query.search) {
          search = req.query.search;
        }
        const orders = await Order.find({}).populate('userId').sort({createdAt:-1});
        let completedOrders = orders.filter(order => order.paymentStatus === 'Completed').length;
        let pendingOrders = orders.filter(order => order.paymentStatus === 'Pending').length;
        let cancelledOrders = orders.filter(order => order.paymentStatus === 'Cancelled').length;
        
        
        res.render("orders",{ orders: orders,completedOrders,pendingOrders,cancelledOrders });
      
      } else {
        res.redirect("/admin");
      }
  } catch (error) {
    console.log(error.message)
next(error.message);

  }
}
const orderDetails = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const id = req.query.id;
       const orderData = await Order.findById({_id:id}).populate('userId').populate('products.productId')
      const add=orderData.address
      const address =Object.values(add);
      
      
      res.render('orderDetails',{orderData,address});
    }else{
      res.redirect('/admin')
    }

  } catch (error) {
    console.log(error.message)
next(error.message);
;
  } 
}


const updateStatus = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      const orderData = await Order.findById({_id:req.body.id})
      const updateData = await Order.findByIdAndUpdate({_id:req.body.id},{$set:{paymentStatus:req.body.order === "Delivered"? "Completed"
          : orderData.paymentStatus,orderStatus:req.body.order}})
      res.redirect('/admin/orders')
    }else{
      res.redirect('/admin');
    
    }
  } catch (error) {
    console.log(error.message)
next(error.message);

  }
}


const loadBanner = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      var search = "";
      if (req.query.search) {
        search = req.query.search;
      }
      const banners = await Banner.find({ __v: 0 ,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } }
         
        ],

        
      });
      console.log(banners,"kiti");
      res.render('banner',{banner:banners})
    }else{
      res.redirect('/admin')
    }
   
  } catch (error) {
    console.log(error.message)
next(error.message);
  }
}

const addBanner = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      res.render('addBanner')
    }
  } catch (error) {
    console.log(error.message)
next(error.message);
;
  }
}

const saveBanner = async(req,res,next)=>{
  try {
    if(req.session.admin_id){
      console.log(req.body);
      const newBanner = req.body.banner;
      const data = await Banner.find({name:newBanner.toUpperCase()});
      if(data.length === 0){
        const banner = new Banner({
          name :newBanner.toUpperCase(),
          image:req.file.filename,
          description:req.body.description
        });
        const save = await banner.save();
        if(save){
          res.redirect('/admin/banner');
        }else{
          console.log("save not work");
        }
      }else{
        console.log("Banner already exist");
        res.render('addBanner',{message:"Banner already exists"});
      }
      res.render('addBanner');
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    console.log(error.message)
next(error.message);
  }
}


module.exports = {
  category,
  addCategory,
  saveCategory,
  deleteCategory,
  editCategory,
  updateCategory,
  loadProducts,
  newProduct,
  addProduct,
  viewProducts,
  deleteProduct,
  editProduct,
  // removeImage,
  updatedProduct,
  loadOrder,
  orderDetails,
  updateStatus,
  loadBanner,
  addBanner,
  saveBanner,
};
