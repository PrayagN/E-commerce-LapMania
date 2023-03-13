const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");



const wishlistSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    products:Array
})



module.exports = mongoose.model("Wishlist", wishlistSchema)