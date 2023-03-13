const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");


const productsSchema = new mongoose.Schema({
    productId: {
        type: ObjectId,
        required: true,
        ref:"Product"
    },
    quantity: {
        type: Number,
        required: false
    },
    price: {
        type: Number,
        required: true
    }
})


const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    total:{
        type:Number,
        required:false,
    },
    products:[productsSchema],

})



module.exports = mongoose.model("Cart", cartSchema)