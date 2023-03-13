
const { ObjectId } = require("mongodb");
const mongoose= require("mongoose");


const productSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        
    },
    price:{
        type:Number, //due to two passwords
        required:true
    },
    offerPrice:{
        type:Number, //due to two passwords
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:ObjectId,
        required:true,
        ref:'category'
    },
    processor:{
        type:String,
        required:false
    },
    ram:{
        type:String,
        required:false
    },
    ssd:{
        type:String,
        required:false
    },
    operatingSystem:{
        type:String,
        required:false
    },
    
    stocks:{
        type:Number,
        required: true
    },
    description:{
        type:String,
        required:true
    },
    list:{
        type:Number,
        required:false
    }
});


module.exports =  mongoose.model('Product',productSchema)
