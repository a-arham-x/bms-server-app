// requiring mongoose
const mongoose = require("mongoose");

// creating the orders schema
const ordersSchema = mongoose.Schema({
    date: {type: Date, default: Date.now()},
    customer: {type: mongoose.Schema.Types.ObjectId, required: true},
    cost: {type: Number, required: true},
    received: {type: Boolean, default: false},
    cancelled: {type: Boolean, default: false}
})

// expporting the model created
module.exports = mongoose.model("orders", ordersSchema);