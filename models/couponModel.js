const { ObjectId } = require("mongodb");
const mongoose= require("mongoose");
const couponSchema = new mongoose.Schema({
    
   
    code: {
        type: String,
        required: true
    },
    discount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        default:'valid'
    },
    maxRedeemAmount:{
        type:Number,
        required:true,
    },
    minPurchaseAmount:{
        type:Number,
        required:true,
    },
    used:{
        type:Number,
        default:0
        
    },
    expiryDate:{
        type:Date,
        required:true,
    },
    claimedBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
      },

})

module.exports = mongoose.model("Coupon", couponSchema)