const mongoose = require("mongoose");

const productReviews = new mongoose.Schema({
    customer: {type: mongoose.Schema.Types.ObjectId, required: true},
    product: {type: mongoose.Schema.Types.ObjectId, required: true},
    comment: {type: String, required: true},
    timestamp: {type: Date, default: Date.now()}
})

module.exports = mongoose.model("product_reviews", productReviews);