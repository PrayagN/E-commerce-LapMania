const mongoose= require("mongoose");




const addressSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },      
    house :{
        type:String,
        required:true,
    },
    street:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true
    },
    district:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true,
    },
    country:{
        type:String,
        required:true
    },
    pinCode:{
        type:Number,
        required:true
    }
})


const userSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String, //due to two passwords
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    Date:{
        type:String,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    address:[addressSchema]
});


module.exports =  mongoose.model('User',userSchema)



