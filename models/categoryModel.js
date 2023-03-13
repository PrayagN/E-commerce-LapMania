const mongoose= require("mongoose");

const categorySchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true,
    
    },
    list:{
        type:Number,
        required:false
    }

})
module.exports =  mongoose.model('category',categorySchema)