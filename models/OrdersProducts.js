const mongoose = require("mongoose");

const OrdersProducts = mongoose.Schema({
    order: {type: mongoose.Schema.Types.ObjectId, required: true},
    product: {type: mongoose.Schema.Types.ObjectId, required: true},
    productQuantity : {type: Number, required: true}
})

module.exports = mongoose.model("orders_products", OrdersProducts);