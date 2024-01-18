const mongoose = require("mongoose");

const reportsSchema = new mongoose.Schema({
    customer: {type: mongoose.Schema.Types.ObjectId, required: true},
    timestamp: {type: Date, default: Date.now()},
    text: {type: String, default: Date.now()},
    isSeen: {type: Boolean, default: false}
})

module.exports = mongoose.model("reports", reportsSchema); 