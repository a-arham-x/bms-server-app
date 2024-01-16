// requiring mongoose
const mongoose = require("mongoose");

// creating the customer schema
const customerSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    dateOfBirth:{
        type: Date,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
    twoStepAuth:{
        type: Boolean,
        default: false
    }
});

// exporting the model created
module.exports = mongoose.model("customers", customerSchema);