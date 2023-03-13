const mongoose= require("mongoose");

const adminSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type :Number,
        default:0
    }
})
module.exports =  mongoose.model('Admin',adminSchema)