// requiring the cloudinary package
const cloudinary = require("cloudinary").v2;

// configuring all the credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// exporting cloudinary
module.exports = cloudinary;