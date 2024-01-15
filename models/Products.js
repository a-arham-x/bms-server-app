// requiring mongoose
const mongoose = require("mongoose");

// creating the product schema
const productSchema = new mongoose.Schema({
    name: {type: String, required: true, unique:true},
    quantity: {type: Number, default:0},
    price: {type: Number, required: true},
    image: {type: Buffer}
})

// expporting the model created
module.exports = mongoose.model("products", productSchema);