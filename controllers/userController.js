const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const session = require("express-session");

const config = require("../config/config");

const {
  SecondaryAuthTokenPage,
} = require("twilio/lib/rest/accounts/v1/secondaryAuthToken");
const { default: mongoose } = require("mongoose");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
const authSid = process.env.TWILIO_AUTH_SID;
const client = require("twilio")(accountSid, authToken);

const randomString1 = require("randomstring");

const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const { category } = require("./categoryController");
const { ObjectId } = require("mongodb");
const Order = require("../models/orderModel");
const { findById, exists } = require("../models/userModel");
const Banner = require("../models/banner");
const Coupon = require("../models/couponModel");
const Razorpay = require("razorpay");
const Crypto = require("crypto");
const { response } = require("../routes/userRoute");
const { log } = require("console");

var instance = new Razorpay({
  key_id:key_id,
  key_secret: key_secret,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

// for reset password sendMail

const sendResetPasswordMail = async (name, email, token) => {
  try {
    console.log(name);
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "for Reset Password",
      html:
        "<p>Hi " +
        name +
        ', please click here to <a href="http://127.0.0.1:3000/forget-password?token=' +
        token +
        '">  Reset </a> your password.</p> ',
    };
    console.log(token);
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been send", info.response);
      }
    });
  } catch {
    console.log(error.message);
    next(error.message);
  }
};

const loadSignup = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    console.log(authSid, "sdfssd");
    const mobile = req.body.mob;

    let checkExist = await User.find({ email: req.body.em });
    let mobileExist = await User.find({ mobile: mobile });
    if (!checkExist.length && !mobileExist.length) {
      req.session.userData = req.body;
      console.log(req.session.userData, "2");
      console.log(req.body.usr);
      if (req.session.userData) {
        if (req.session.userData.mob) {
          const mobile = req.session.userData.mob;
          client.verify.v2
            .services(authSid)

            .verifications.create({ to: "+91" + mobile, channel: "sms" })
            .then((verification) => console.log(verification.status));
          res.render("otpVerify");
        } else {
          res.render("signup", { message: "number is invalid" });
        }
      } else {
        res.render("signup", { message: "your registration has been failed." });
      }
    } else {
      res.render("signup", { message: "email or number already exist." });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};
const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render("login", { message: "sorry, you are blocked by admin" });
        } else {
          req.session.user_id = userData._id;

          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email and password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadHome = async (req, res, next) => {
  try {
    let productData = await Product.find({ list: 0 }).populate("category");
    const categoryData = await Category.find({ list: 0 });
    const banner = await Banner.find({});
    if (req.session.user_id) {
      const userData = await User.findById({ _id: req.session.user_id });
      const cartData = await Cart.findOne({ userId: userData.id });
      const wishlistData = await Wishlist.findOne({ userId: userData.id });

      const couponUpdate = await Coupon.findOneAndUpdate(
        { used: 2 },
        { $set: { status: "Inactive" } }
      );

      let cartCount = 0;
      let wishlistCount = 0;
      if (cartData && wishlistData) {
        wishlistCount = wishlistData.products.length;
        cartCount = cartData.products.length;
        res.render("home", {
          userData,
          categoryData,
          productData,
          cartCount,
          cartData,
          wishlistData,
          wishlistCount,
          banner,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;
        res.render("home", {
          userData,
          categoryData,
          productData,
          cartCount,
          cartData,
          wishlistData,
          wishlistCount,
          banner,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;
        res.render("home", {
          userData,
          categoryData,
          productData,
          cartCount,
          cartData,
          wishlistData,
          wishlistCount,
          banner,
        });
      } else {
        res.render("home", {
          userData,
          categoryData,
          productData,
          cartCount,
          cartData,
          wishlistData,
          wishlistCount,
          banner,
        });
      }
    } else {
      res.render("home", { categoryData, productData, banner });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const forgetLoad = async (req, res, next) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const forgetVerify = async (req, res, next) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("forget", { message: "Please Verify your email." });
      } else {
        const randomString = randomString1.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Please check your mail to reset your password",
        });
      }
    } else {
      res.render("forget", { message: "user email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const forgetPasswordLoad = async (req, res, next) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    console.log(tokenData);
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const ResetPassword = async (req, res, next) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securePassword(password);

    const updatedData1 = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const otpPageLoad = async (req, res, next) => {
  try {
    res.render("otp");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const checkNumber = async (req, res, next) => {
  try {
    const number = req.body.number;
    const userData = await User.findOne({ mobile: number });
    if (userData) {
      console.log(userData.mobile);
      const mobileMatch = (await userData.mobile) === number;
      console.log(mobileMatch);
      if (mobileMatch) {
        function sendTextMessage() {
          client.verify.v2
            .services(authSid)
            .verifications.create({ to: "+91" + number, channel: "sms" })
            .then((verification) => console.log(verification.status));
        }

        sendTextMessage();
        req.session.mobile = number;

        res.redirect("/otpVerify");
      }
    } else {
      res.render("otp", { message: "Number is not registered" });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};
const check = async (req, res, next) => {
  try {
    const otp = `${req.body.otp1}${req.body.otp2}${req.body.otp3}${req.body.otp4}${req.body.otp5}${req.body.otp6}`;
    if (req.session.userData) {
      const number = req.session.userData.mob;

      const userData = await User.findOne({ mobile: number });
      client.verify.v2
        .services(authSid)
        .verificationChecks.create({ to: "+91" + number, code: otp })
        .then((verification_check) => {
          if (verification_check.status === "approved") {
            if (req.session.userData) {
              (async function update() {
                // const updatedData =await User.updateOne({mobile:number},{$set:{ is_verified:1}})
                const spassword = await securePassword(
                  req.session.userData.psw
                );
                const user = new User({
                  name: req.session.userData.usrn,
                  email: req.session.userData.em,
                  password: spassword,
                  mobile: req.session.userData.mob,
                  is_verified: 1,
                  Date: Date().slice(0, 16),
                });
                const userData = await user.save();

                req.session.user_id = userData._id;
                res.redirect("/home");
              })();
            } // res.status(200).json('approved')
          } else {
            res.render("otpVerify", { message: "invalide otp " });
            // res.status(400).json('invalid otp')
          }
        });
    } else if (req.session.mobile) {
      const userData = await User.findOne({ mobile: req.session.mobile });
      const number = req.session.mobile;
      client.verify.v2
        .services(authSid)
        .verificationChecks.create({ to: "+91" + number, code: otp })
        .then((verification_check) => {
          if (verification_check.status === "approved") {
            req.session.user_id = userData._id;
            res.redirect("/home");
          } else {
            res.render("otpVerify", { message: "Verification Failed" });
          }
        });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtpVerify = async (req, res, next) => {
  try {
    res.render("otpVerify");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadShop = async (req, res, next) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    let productData = await Product.find({ list: 0 })
      .populate("category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let brand = await Product.find().distinct("brand");

    const count = await Product.find({ list: 0 })
      .populate("category")
      .countDocuments();
    const categoryData = await Category.find({ list: 0 });

    if (req.session.user_id) {
      const userData = await User.findById({ _id: req.session.user_id });
      const cartData = await Cart.findOne({ userId: userData.id });
      const wishlistData = await Wishlist.findOne({ userId: userData.id });
      let wishlistCount = 0;
      let cartCount = 0;
      if (req.query.id) {
        id = req.query.id;
        const category = await Category.findById({ _id: id, list: 0 });
        const productData = await Product.find({ category: category, list: 0 })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
        const count = await Product.find({
          category: category,
          list: 0,
        }).countDocuments();

        const categoryData = await Category.find({ list: 0 });
        if (cartData && wishlistData) {
          wishlistCount = wishlistData.products.length;
          cartCount = cartData.products.length;

          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else if (cartData) {
          cartCount = cartData.products.length;
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else if (wishlistData) {
          wishlistCount = wishlistData.products.length;
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else {
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        }
      } else {
        if (cartData && wishlistData) {
          wishlistCount = wishlistData.products.length;
          cartCount = cartData.products.length;

          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else if (cartData) {
          cartCount = cartData.products.length;
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else if (wishlistData) {
          wishlistCount = wishlistData.products.length;
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        } else {
          res.render("shop", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistData,
            wishlistCount,
            brand,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          });
        }
      }
    } else {
      if (req.query.id) {
        id = req.query.id;
        const category = await Category.findById({ _id: id });
        const productData = await Product.find({ category: category, list: 0 })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
        const count = await Product.find({
          category: category,
          list: 0,
        }).countDocuments();
        const categoryData = await Category.find({ list: 0 });
        res.render("shop", {
          categoryData,
          productData,
          brand,
          wishlistData: 0,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      } else {
        res.render("shop", {
          categoryData,
          productData,
          brand,
          wishlistData: 0,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadDetails = async (req, res, next) => {
  try {
    const productData = await Product.findById({ _id: req.query.id }).populate(
      "category"
    );
    const categoryData = await Category.find({ __v: 0 });

    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      const userData = await User.findById({ _id: req.session.user_id });

      const cartDatas = await Cart.findOne({ userId: userData.id });
      const wishlistData = await Wishlist.findOne({ userId: userData.id });
      if (cartDatas && wishlistData) {
        const data = cartDatas.products;
        const productId = data.map((values) => values.productId);
        cartData = await Product.find({ _id: { $in: productId } });
        wishlistCount = wishlistData.products.length;
        cartCount = cartDatas.products.length;

        res.render("detail", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
        });
      } else if (cartDatas) {
        cartCount = cartDatas.products.length;

        res.render("detail", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;
        res.render("detail", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
        });
      } else {
        res.render("detail", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
        });
      }
    } else {
      res.render("detail", { categoryData, productData });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const addtoWishlist = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const id = req.params.productId;
      const userData = await User.findById({ _id: req.session.user_id });
      const productData = await Product.findById({ _id: id });
      const wishlistData = await Wishlist.findOne({ userId: userData.id });

      if (wishlistData) {
        let wishlistExists = await Wishlist.findOne({
          userId: userData.id,
          products: { $elemMatch: { $in: id } },
        });
        if (wishlistExists === null) {
          const updateWishlist = await Wishlist.findOneAndUpdate(
            { userId: userData },
            { $push: { products: id } }
          );
          res.json({ exists: true });
          res.redirect("/wishlist");
        } else {
          res.json({ exists: false });
          res.redirect("/shop");
        }
      } else {
        const newWishlist = new Wishlist({
          userId: userData._id,
          products: id,
        });

        const wishlistData = await newWishlist.save();
        res.json({ exists: true });
        res.redirect("/shop");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadWishlist = async (req, res, next) => {
  try {
    
    const productData = await Product.find({ list: 0 }).populate("category");
    const categoryData = await Category.find({ list: 0 });

    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const wishlist = await Wishlist.findOne({ userId: userData.id });
      const cartDatas = await Cart.findOne({ userId: userData.id });

      if (wishlist && cartDatas) {
        console.log("yes");
        const data = wishlist.products;
        const data1 = cartDatas.products;
        wishlistData = await Product.find({ _id: { $in: data } });
        wishlistCount = wishlist.products.length;
        const productId1 = data1.map((values) => values.productId);
        cartData = await Product.find({ _id: { $in: productId1 } });
        cartCount = cartDatas.products.length;
        res.render("wishlist", {
          userData,
          categoryData,
          productData,
          wishlistData,
          wishlistCount,
          cartData,
          cartCount,
        });
      } else if (wishlist) {
        const data = wishlist.products;
        wishlistData = await Product.find({ _id: { $in: data } });
        wishlistCount = wishlist.products.length;
        res.render("wishlist", {
          userData,
          categoryData,
          productData,
          wishlistData,
          wishlistCount,
          cartData,
          cartCount,
        });
      } else if (cartDatas) {
        cartCount = cartDatas.products.length;
        res.render("wishlist", {
          userData,
          categoryData,
          productData,
          wishlistData,
          wishlistCount,
          cartData,
          cartCount,
        });
      } else {
        res.render("wishlist", {
          userData,
          categoryData,
          productData,
          wishlistData,
          wishlistCount,
          cartData,
          cartCount,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadContact = async (req, res, next) => {
  try {
    // const categoryData1 = await Category.find({},{_id:1});
    //   const values = categoryData1.map(category=>category._id);
    const productData = await Product.find({ list: 0 }).populate("category");
    const categoryData = await Category.find({ list: 0 });

    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });
      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;
        res.render("contact", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;
        res.render("contact", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;
        res.render("contact", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else {
        res.render("contact", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      }
    } else {
      res.render("contact", { categoryData, productData });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const addtoCart = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const categoryData = await Category.find({ list: 0 });

      //putting products to database
      const id = req.query.id;

      const userData = await User.findById({ _id: req.session.user_id });
      const productData = await Product.findById({ _id: id });
      const cartData = await Cart.find({ userId: userData });

      if (cartData.length > 0) {
        let duplicateData = await Cart.findOne({
          userId: userData.id,
          products: { $elemMatch: { productId: id } },
        });
        if (duplicateData === null) {
          const productData1 = {
            productId: productData._id,
            quantity: 1,
            price: productData.offerPrice,
          };

          const updateCartData = await Cart.findOneAndUpdate(
            { userId: userData },
            { $push: { products: { ...productData1 } } }
          );
          res.redirect("/cart");
        } else {
          const dup = await Cart.findOneAndUpdate(
            { userId: req.session.user_id, "products.productId": id },
            { $inc: { "products.$.quantity": 1 } }
          );

          let data = await Cart.findOne({
            userId: req.session.user_id,
            "products.productId": id,
          });
          let quantity = data.products.find(
            (pro) => pro.productId == id
          ).quantity;
          const price = quantity * productData.offerPrice;
          const updateCart = await Cart.findOneAndUpdate(
            { userId: req.session.user_id, "products:productId": id },
            { $set: { "products.$.price": price } }
          );
          res.redirect("/cart");
        }
      } else {
        const newCart = new Cart({
          userId: userData._id,
          products: [
            {
              productId: productData._id,
              quantity: 1,
              price: productData.offerPrice,
            },
          ],
        });

        const cartData = await newCart.save();
      }
      req.session.justAdded = true;
      res.redirect("/shop");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const increment = async (req, res, next) => {
  try {
    let id = req.params.productId;
    let stocks = req.query.stocks;
    const productData = await Product.findById({ _id: id });
    //  let quantity = await Cart.products.find((p)=>p.productId === id.quantity)
    let updatedData = await Cart.findOneAndUpdate(
      { userId: req.session.user_id, "products.productId": id },
      {
        $inc: {
          "products.$.quantity": 1,
          "products.$.price": productData.offerPrice,
        },
      }
    );

    let cartData = await Cart.findOne({
      userId: req.session.user_id,
      "products.productId": id,
    });

    let updatedPrice = cartData.products.find((n) => n.productId == id).price;

    let products = cartData.products;
    let totalprice = products.map((products) => products.price);

    let total = totalprice.reduce((acc, curr) => acc + curr);

    res.json({ updatedPrice, total });
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const decrement = async (req, res, next) => {
  try {
    let id = req.params.productId;
    let cartData = await Cart.findOne({
      userId: req.session.user_id,
      "products.productId": id,
    });
    let quantity = cartData.products.find((n) => n.productId == id).quantity;

    if (quantity > 1) {
      let productData = await Product.findById({ _id: id });
      let updateData = await Cart.findOneAndUpdate(
        { userId: req.session.user_id, "products.productId": id },
        {
          $inc: {
            "products.$.quantity": -1,
            "products.$.price": -productData.offerPrice,
          },
        }
      );

      cartData = await Cart.findOne({
        userId: req.session.user_id,
        "products.productId": id,
      });

      let updatedPrice = cartData.products.find((n) => n.productId == id).price;

      let products = cartData.products;
      let totalprice = products.map((products) => products.price);
      let total = totalprice.reduce((acc, curr) => acc + curr);

      res.json({ updatedPrice, total });
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadCart = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let wishlistCount = 0;
      let data = 0;
      let cartCount = 0;
      let cartData = 0;
      let cartDatas = 0;
      let wishlistData = 0;
      const categoryData = await Category.find({ list: 0 });
      // const categoryData1 = await Category.find({},{_id:1});
      // const values = categoryData1.map(category=>category._id);
      const productData = await Product.find({ list: 0 }).populate("category");
      const userData = await User.findById({ _id: req.session.user_id });

      cartData = await Cart.findOne({ userId: userData.id }).populate(
        "products.productId"
      );
      wishlistData = await Wishlist.findOne({ userId: userData.id });

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;
        res.render("cart", {
          data,
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
        });
      } else if (wishlistData) {
        console.log("2work");

        wishlistCount = wishlistData.products.length;
        res.render("cart", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
          data,
        });
      } else if (cartData) {
        console.log("3work");

        cartCount = cartData.products.length;

        res.render("cart", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
          data,
        });
      } else {
        console.log("4work");

        res.render("cart", {
          userData,
          productData,
          cartData,
          categoryData,
          cartCount,
          wishlistCount,
          data,
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const removeCart = async (req, res, next) => {
  try {
    const id = req.query.id;
    const deleteData = await Cart.updateOne(
      { userId: req.session.user_id },
      { $pull: { products: { productId: id } } }
    );
    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const removeWishlist = async (req, res, next) => {
  try {
    if (req.query.productId) {
      const id = req.query.productId;
      const deleteData = await Wishlist.updateOne(
        { userId: req.session.user_id },
        { $pull: { products: id } }
      );
      res.redirect("/wishlist");
      res.json(response);
    } else if (req.query.id) {
      const id = req.query.id;
      const deleteData = await Wishlist.updateOne(
        { userId: req.session.user_id },
        { $pull: { products: id } }
      );
      res.redirect("/wishlist");
      res.json(response);
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      // const categoryData1 = await Category.find({},{_id:1});
      // const values = categoryData1.map(category=>category._id);
      const productData = await Product.find({ list: 0 }).populate("category");
      const categoryData = await Category.find({ list: 0 });
      const couponData = await Coupon.find({});

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });
      if (!cartData.products.length == 0) {
        if (cartData && wishlistData) {
          cartCount = cartData.products.length;
          wishlistCount = wishlistData.products.length;
          const data = cartData.products;

          const productId = data.map((n) => n.productId);
          const cartProducts = await Product.find({ _id: { $in: productId } });
          res.render("checkout", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistCount,
            cartProducts,
            data,
            cartData,
            couponData,
          });
        } else if (cartData) {
          cartCount = cartData.products.length;
          const data = cartData.products;

          const productId = data.map((n) => n.productId);
          const cartProducts = await Product.find({ _id: { $in: productId } });
          res.render("checkout", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistCount,
            cartProducts,
            data,
            cartData,
            couponData,
          });
        } else {
          res.render("checkout", {
            userData,
            categoryData,
            productData,
            cartCount,
            wishlistCount,
            cartProducts,
            data,
            cartData,
            couponData,
          });
        }
      } else {
        res.redirect("/shop");
      }
    } else {
      res.redirect("/shop");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadOrderPage = async (req, res, next) => {
  try {
    req.session.coupon = req.body.coupon;
    if (req.session.user_id) {
      if (req.body.payment === "COD") {
        const userData = await User.findById({ _id: req.session.user_id });
        const cartData = await Cart.findOne({ userId: userData.id });
        const data = cartData.products;
        const productId = data.map((values) => values.productId);
        const productData = await Product.find({ _id: { $in: productId } });
        const couponData = await Coupon.findOne({ code: req.session.coupon });

        var address = {
          name: req.body.name,
          mobile: req.body.mobile,
          house: req.body.house,
          street: req.body.street,
          district: req.body.district,
          city: req.body.city,
          country: req.body.country,
          state: req.body.state,
          pinCode: req.body.pinCode,
        };
        const addressExist = await User.find({
          address: {
            $elemMatch: {
              name: req.body.name,
              mobile: req.body.mobile,
              city: req.body.city,
              state: req.body.state,
              house: req.body.house,
              pinCode: req.body.pinCode,
              district: req.body.district,
              country: req.body.country,
              street: req.body.street,
            },
          },
        });

        if (addressExist.length === 0) {
          var address = {
            name: req.body.name,
            mobile: req.body.mobile,
            house: req.body.house,
            street: req.body.street,
            city: req.body.city,
            pinCode: req.body.pinCode,
            district: req.body.district,
            state: req.body.state,
            country: req.body.country,
          };

          const pushAddress = await User.findByIdAndUpdate(
            { _id: req.session.user_id },
            { $push: { address: { ...address } } }
          );
        }
        let total = parseInt(req.body.total);
        let totals;
        if (couponData) {
          totals = total - total * (couponData.discount / 100);
          if (
            total * (couponData.discount / 100) >=
            couponData.maxRedeemAmount
          ) {
            totals = total - couponData.maxRedeemAmount;
          } else {
            totals = total - total * (couponData.discount / 100);
          }
        } else {
          totals = total;
        }
        const time = Date().slice(16, 24);
        const date = Date().slice(0, 15);
        const orderedDate = new Date();
        const deliveryDate = new Date(orderedDate);
        deliveryDate.setDate(orderedDate.getDate() + 5);
        const deliveryDate1 = deliveryDate.toString().slice(0, 15);
        const order = new Order({
          date: date,
          deliveryDate: deliveryDate1,
          time: time,
          userId: userData.id,
          products: data,
          total: totals,
          address: address,
          paymentMethod: req.body.payment,
          paymentStatus: "Pending",
          orderStatus: "Placed",
        });
        const orderData = await order.save();
        req.session.orderId = order._id;
        const addressArray = Object.values(address);
        console.log("hwydfas");
        res.json({ codSuccess: true });
      } else {
        const userData = await User.findById({ _id: req.session.user_id });
        const cartData = await Cart.findOne({ userId: userData.id });
        const data = cartData.products;
        const productId = data.map((values) => values.productId);
        const productData = await Product.find({ _id: { $in: productId } });
        const couponData = await Coupon.findOne({ code: req.session.coupon });

        var address = {
          name: req.body.name,
          mobile: req.body.mobile,
          house: req.body.house,
          street: req.body.street,
          city: req.body.city,
          district: req.body.district,
          country: req.body.country,
          state: req.body.state,
          pinCode: req.body.pinCode,
        };
        const addressExist = await User.find({
          address: {
            $elemMatch: {
              name: req.body.name,
              mobile: req.body.mobile,
              city: req.body.city,
              state: req.body.state,
              house: req.body.house,
              pinCode: req.body.pinCode,
              district: req.body.district,
              country: req.body.country,
              street: req.body.street,
            },
          },
        });

        if (addressExist.length === 0) {
          var address = {
            name: req.body.name,
            mobile: req.body.mobile,
            house: req.body.house,
            street: req.body.street,
            city: req.body.city,
            pinCode: req.body.pinCode,
            district: req.body.district,
            state: req.body.state,
            country: req.body.country,
          };

          const pushAddress = await User.findByIdAndUpdate(
            { _id: req.session.user_id },
            { $push: { address: { ...address } } }
          );
        }

        let total = parseInt(req.body.total);
        let totals;
        if (couponData) {
          totals = total - total * (couponData.discount / 100);
          if (
            total * (couponData.discount / 100) >=
            couponData.maxRedeemAmount
          ) {
            totals = total - couponData.maxRedeemAmount;
          } else {
            totals = total - total * (couponData.discount / 100);
          }
        } else {
          totals = total;
        }

        console.log(total);
        const time = Date().slice(16, 24);
        const date = Date().slice(0, 15);
        const orderedDate = new Date();
        const deliveryDate = new Date(orderedDate);
        deliveryDate.setDate(orderedDate.getDate() + 5);
        const deliveryDate1 = deliveryDate.toString().slice(0, 15);

        const order = new Order({
          date: date,
          deliveryDate: deliveryDate1,
          time: time,
          userId: userData.id,
          products: data,
          total: totals,
          address: address,
          paymentMethod: req.body.payment,
          paymentStatus: "onlinePending",
          orderStatus: "Placed",
        });
        const orderData = await order.save();
        req.session.orderId = order._id;
        const addressArray = Object.values(address);

        const orderRecipt = await Order.findOne({ userId: req.session.user_id })
          .sort({ createdAt: -1 })
          .limit(1);
        console.log(orderRecipt, "kooi");

        var options = {
          amount: totals * 100,
          currency: "INR",
          receipt: "" + orderData._id,
        };
        instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err);
          } else {
            console.log(order);
            res.json({ order });
          }
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const razorpayP = req.body.razorpayP;
    const razorpayO = req.body.razorpayO;
    const razorpayS = req.body.razorpayS;
    const orderId = req.body.order_id;
    const secret = "escyUMJRz3v1JO8aW8iJlNJf";
    const hmac_sha256 = (data, secret) => {
      return Crypto.createHmac("sha256", secret).update(data).digest("hex");
    };
    generated_signature = hmac_sha256(orderId + "|" + razorpayP, secret);

    if (generated_signature == razorpayS) {
      res.json({ message: "your payment Successfull" });
      const orderData = await Order.findOne({})
        .sort({ createdAt: -1 })
        .limit(1);

      const updateData = await Order.findByIdAndUpdate(
        { _id: orderData._id },
        { $set: { paymentStatus: "Completed" } }
      );
    } else {
      const updateorder = await Order.deleteOne({
        _id: ObjectId(orderData._id),
      });

      res.json({ message: "Sorry, your payment failed!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderPageView = async (req, res) => {
  try {
    if (req.session.user_id && req.session.orderId) {
      delete req.session.orderId;
      const userData = await User.findById({ _id: req.session.user_id });
      const cartData = await Cart.findOne({ userId: userData._id });
      const orderData = await Order.findOne({ userId: userData._id })
        .sort({ createdAt: -1 })
        .populate("products.productId");
      const data = orderData.products;

      for (const products of orderData.products) {
        const product = await Product.findOne({ _id: products.productId });
        const updatedStock = Number(product.stocks) - products.quantity;
        const update = await Product.updateOne(
          { _id: products.productId },
          { $set: { stocks: updatedStock } }
        );
      }

      const add = orderData.address;
      const addressArray = Object.values(add);
      console.log(addressArray);
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { code: req.session.coupon },
        {
          $inc: { used: 1 },
          $push: { claimedBy: req.session.user_id },
        },
        { new: true }
      );

      res.render("orderPage", { userData, orderData, data, addressArray });

      const deleteData = await Cart.updateOne(
        { userId: orderData.userId },
        { $unset: { products: "" } }
      );
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAccount = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const productData = await Product.find({ list: 0 }).populate("category");
      const categoryData = await Category.find({ list: 0 });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("profile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("profile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("profile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else {
        res.render("profile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      }
    } else {
      
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadEditProfile = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("editProfile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("editProfile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("editProfile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      } else {
        res.render("editProfile", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const name = req.body.name;
      const email = req.body.email;
      const mobile = req.body.mobile;
      await User.findByIdAndUpdate(
        { _id: req.session.user_id },
        { $set: { name: name, email: email, mobile: mobile } }
      );
      res.redirect("/profile");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const number = req.session.userData.mob;
    client.verify.v2.services(authSid);
    function sendTextMessage() {
      client.verify.v2
        .services(authSid)
        .verifications.create({ to: "+91" + number, channel: "sms" })
        .then((verification) => console.log(verification.status));
    }

    sendTextMessage();
    res.redirect("/otpVerify");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadEditAddress = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });
      const id = req.query.id;

      const addressData = await userData.address.find((a) => a._id == id);

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("editAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          addressData,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("editAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          addressData,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("editAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          addressData,
        });
      } else {
        res.render("editAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          addressData,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const id = req.query.id;

      const deleteAddress = await User.findOneAndUpdate(
        { _id: ObjectId(req.session.user_id) },
        { $pull: { address: { _id: id } } }
      );

      res.redirect("/manageAddress");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadAddAddress = async (req, res, next) => {
  const userData = await User.findById({ _id: req.session.user_id });
  const categoryData1 = await Category.find({}, { _id: 1 });
  const values = categoryData1.map((category) => category._id);
  const productData = await Product.find({
    category: { $in: values },
  }).populate("category");
  const categoryData = await Category.find({ __v: 0 });
  res.render("addAddress", { userData, productData, categoryData });
};

const pushAddress = async (req, res, next) => {
  try {
    const addressData = {
      name: req.body.name,
      mobile: req.body.mobile,
      house: req.body.house,
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      pinCode: req.body.pincode,
    };
    const updateAddress = await User.findByIdAndUpdate(
      { _id: req.session.user_id },
      { $push: { address: { ...addressData } } }
    );

    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const id = req.query.id;
      const addressData = {
        name: req.body.name,
        mobile: req.body.mobile,
        house: req.body.house,
        street: req.body.street,
        city: req.body.city,
        district: req.body.district,
        state: req.body.state,
        country: req.body.country,
        pinCode: req.body.pincode,
      };
      const updateAddress = await User.findByIdAndUpdate(
        { _id: req.session.user_id, "address._id": id },
        { $set: { "address.$": addressData } }
      );

      res.redirect("/profile");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const loadManageAddress = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });

      const orderData = await Order.find({
        userId: req.session.user_id,
      }).populate("products.productId");

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("manageAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("manageAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("manageAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else {
        res.render("manageAddress", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const orderlist = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });

      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });

      const orderData = await Order.find({ userId: req.session.user_id })
        .populate("products.productId")
        .sort({ createdAt: -1 });

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("orderlist", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("orderlist", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("orderlist", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      } else {
        res.render("orderlist", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
        });
      }
    } else {
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });

      res.render("orderlist", { categoryData, productData });
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};
const orderView = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      let cartCount = 0;
      let cartData = 0;
      let wishlistCount = 0;
      let wishlistData = 0;
      const userData = await User.findById({ _id: req.session.user_id });
      const categoryData1 = await Category.find({}, { _id: 1 });
      const values = categoryData1.map((category) => category._id);
      const productData = await Product.find({
        category: { $in: values },
      }).populate("category");
      const categoryData = await Category.find({ __v: 0 });
      cartData = await Cart.findOne({ userId: userData.id });
      wishlistData = await Wishlist.findOne({ userId: userData.id });
      const id = req.query.id;
      const orderData = await Order.findById({ _id: id })
        .populate("products.productId")
        .populate("address.address");
      const add = orderData.address;
      const address = Object.values(add);

      if (cartData && wishlistData) {
        cartCount = cartData.products.length;
        wishlistCount = wishlistData.products.length;

        res.render("orderView", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          address,
        });
      } else if (cartData) {
        cartCount = cartData.products.length;

        res.render("orderView", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          address,
        });
      } else if (wishlistData) {
        wishlistCount = wishlistData.products.length;

        res.render("orderView", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          address,
        });
      } else {
        res.render("orderView", {
          userData,
          categoryData,
          productData,
          cartCount,
          wishlistCount,
          orderData,
          address,
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

const orderCancel = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const id = req.query.id;
      const orderData = await Order.findOne({ _id: id }).populate(
        "products.productId"
      );

      for (const products of orderData.products) {
        const product = await Product.findOne({ _id: products.productId });
        const updatedStock = Number(product.stocks) + products.quantity;
        const update = await Product.updateOne(
          { _id: products.productId },
          { $set: { stocks: updatedStock } }
        );
      }
      if (orderData.paymentMethod == "COD") {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: req.query.id },
          { $set: { orderStatus: "Cancelled", paymentStatus: "Cancelled" } }
        );
      } else {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: req.query.id },
          { $set: { orderStatus: "Cancelled", paymentStatus: "Refunded" } }
        );
      }
      res.redirect("/orderlist");
    }
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};
const couponApply = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findById(req.session.user_id);
      const coupon = req.params.coupon;
      const existCoupon = await Coupon.findOne({ code: coupon });
      if (existCoupon) {
        const cartData = await Cart.findOne({ userId: req.session.user_id });
        const userCheck = await Coupon.findOne({
          code: coupon,
          claimedBy: req.session.user_id,
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = existCoupon.expiryDate;
        exp.setHours(0, 0, 0, 0);
        if (userCheck) {
          res.json({ message: "already used" });
        } else if (exp.getTime() <= today.getTime()) {
          res.json({ message: "coupon expired" });
          const updatedCoupon = await Coupon.findOneAndUpdate(
            { code: coupon },
            { $set: { status: "expired" } }
          );
        } else {
          let products = cartData.products;
          let prices = products.map((product) => product.price);
          let sum = prices.reduce((total, price) => total + price, 0);
          sum = parseFloat(sum);

          if (existCoupon.minPurchaseAmount <= sum) {
            const percentage = existCoupon.discount;
            const amount = sum;

            const discountAmount = (percentage / 100) * amount;
            console.log(discountAmount);
            if (discountAmount <= existCoupon.maxRedeemAmount) {
              const discountedPrice = Math.round(amount - discountAmount);
              const updateTotal = await Cart.findOneAndUpdate(
                { userId: req.session.user_id },
                { $set: { total: discountedPrice } }
              );

              res.json({ success: true, discountedPrice, discountAmount });
            } else {
              const discountedPrice = Math.round(
                amount - existCoupon.maxRedeemAmount
              );
              console.log(discountedPrice);
              const updateTotal = await Cart.findOneAndUpdate(
                { userId: req.session.user_id },
                { $set: { total: discountedPrice } }
              );

              res.json({
                success: true,
                discountedPrice,
                discountAmount: existCoupon.maxRedeemAmount,
              });
            }
          } else {
            res.json({ message: "Coupon is not applicable for this order" });
          }
        }
      } else {
        res.json({ message: "Coupon is not valid" });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const searchProduct = async (req, res) => {
  try {
    let search = "";
    let page = 1;
    const limit = 5;
    let checkedValues = req.body.brand;
    let sortOption = req.body.sort;
  
    if (req.body.page) {
      page = req.body.page;
    }
  
    let productQuery = { list: 0 };
  
    if (req.body.search) {
      search = req.body.search;
      productQuery.$or = [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { brand: { $regex: ".*" + search + ".*", $options: "i" } },
      ];
    }
  
    if (checkedValues && checkedValues.length > 0) {
      productQuery.brand = { $in: checkedValues };
    }
  
    let productData = await Product.find(productQuery)
      .populate("category")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
  
    if (sortOption) {
      switch (sortOption) {
        case "Low to High":
          productData.sort((a, b) => a.offerPrice - b.offerPrice);
          break;
        case "High to Low":
          productData.sort((a, b) => b.offerPrice - a.offerPrice);
          break;
        default:
          // do nothing
      }
    }
  
    res.json({ product: productData });
  } catch (error) {
    console.log(error.message);
  }
}  

const sortPrice = async (req, res) => {
  try {
    var page = 1;
    if (req.body.page) {
      page = req.body.page;
    }

    const sortOption = req.body.option;
    const limit = 5;

    let productData = await Product.find({ list: 0 })
      .populate("category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    switch (sortOption) {
      case "Low to High":
        productData.sort((a, b) => a.offerPrice - b.offerPrice);
        break;
      case "High to Low":
        productData.sort((a, b) => b.offerPrice - a.offerPrice);
        break;
      default:
      // do nothing
    }

    const totalProducts = await Product.countDocuments({ list: 0 });
    const totalPages = Math.ceil(totalProducts / limit);

    let product = productData;

    res.json({ product });
  } catch (error) {
    console.log(error.message);
  }
};

const filterBrand = async (req, res, next) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    let selectedBrands = [];
    if (req.query.checkedValues) {
      selectedBrands = req.query.checkedValues;
    }
    console.log(selectedBrands, "sdf");

    let productData = await Product.find({
      brand: { $in: selectedBrands },
      list: 0,
    })
      .populate("category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    let product = productData;
    res.json({ product: productData1 });
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};
module.exports = {
  loadLogin,
  logout,
  loadAccount,
  loadEditProfile,
  updateProfile,
  loadAddAddress,
  loadEditAddress,
  deleteAddress,

  pushAddress,
  updateAddress,
  loadManageAddress,

  loadSignup,
  insertUser,
  verifyLogin,
  loadHome,
  forgetLoad,
  forgetVerify,
  sendResetPasswordMail,
  forgetPasswordLoad,
  ResetPassword,
  otpPageLoad,
  checkNumber,
  check,
  loadOtpVerify,
  resendOtp,

  loadShop,
  loadDetails,
  addtoWishlist,
  loadWishlist,
  loadContact,
  addtoCart,
  increment,
  decrement,
  loadCart,
  removeCart,
  removeWishlist,

  loadCheckout,
  loadOrderPage,
  orderlist,
  orderView,
  orderCancel,
  couponApply,
  orderPageView,
  verifyPayment,
  searchProduct,
  sortPrice,
  filterBrand,
};
