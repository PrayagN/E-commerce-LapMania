const { ObjectId } = require("mongodb");
const mongoose= require("mongoose");


const orderSchema = mongoose.Schema({

    date : { 
        type :String, 
        default: Date.now
    },
    deliveryDate:{
        type:String,
        required:true
    
    },
    time:{
        type:String,
        required:true
    },
    userId : {
        type :ObjectId,
        required : true,
        ref:'User'
    },
    products :{
        type:Array,
        ref:'Product'
    },

    total : {
        type : Number,
        required : true
    },
    address : {

    },
    paymentMethod : {
        type : String,
        required : true
    },
    paymentStatus : {
        type : String,
        required : true
    },
    orderStatus : {
        type : String,
        required : true
    },
    
}, { timestamps: true },);


module.exports =  mongoose.model('Order',orderSchema)
