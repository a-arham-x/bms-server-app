const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const mongoUri = process.env.MONGO_URI;

const connectToMongo = async () => {
    console.log(mongoUri);
    mongoose.connect(mongoUri);
}

module.exports = connectToMongo;