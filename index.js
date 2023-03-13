require('dotenv').config();
const mongoose =  require("mongoose");
mongoose.set('strictQuery',false)
const tippy = require('tippy.js');

mongoose.connect('mongodb://127.0.0.1:27017/Lap_store').then(() => {
  console.log('database connected');
}).catch((err) => {
  console.log(err);
})
const path =require('path');

const express = require('express');
const app= express();
const nocache = require('nocache');
app.use(nocache());
app.set('view engine','ejs');
app.set('views','views');

//for user route
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)
app.use(express.static('public'));  
app.use(express.static('assets1'))

// for admin route

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)
app.use(express.static('public'));

//404
app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }
  });
// app.use((error, req, res, next) => {
//     res.status(500).render('error', { message: error.message });
//   });

app.listen(3000,function(){
    console.log("Started.....");
}); 