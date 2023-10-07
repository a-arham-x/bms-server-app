// All The Required Exports
const express = require("express");
const router = express.Router();
const Product = require("../models/Products");
const fetchAdmin = require("../middleware/fetchAdmin");
const { body, validationResult } = require("express-validator");
const cloudinary = require("../utils/cloudinary.js");
const Customer = require("../models/Customer");

// post method for adding products to database
router.post("/add", fetchAdmin,
    // All the required validation checks
    [
        body("name", { error: "Name of the Product is Required" }).isLength({ min: 5 }),
        body("price", { error: "Price of the Product is Required" }).isNumeric({ min: 1 })
    ], async (req, res) => {

        // First Check if only the admin is making the change
        const key = req.admin.key;
        const customer = await Customer.findOne({isAdmin: true});
        if (key != customer._id) return res.json({ message: "Not authorized for making the change" });

        // Array of errors
        const errors = validationResult(req);

        // If there are some errors the errors are send in a json with 400 status code
        if (!errors.isEmpty()) {
            return res.json({ message: "One of the required fields is not correct", error: errors })
        }

        // creating a function that shall upload the product image to cloudinary
        const file = req.files;
        let result;
        if (file) {
            if (file.image) {
                result = await cloudinary.uploader.upload(file.image.tempFilePath).catch(() => { return res.json({ message: "Internal Server Error" }) });
            } else {
                result = { secure_url: "none" };
            }
        } else {
            result = { secure_url: "none" };
        }

        // In case of no errors the product is stored and a response in delivered.
        const product = new Product({ name: req.body.name, quantity: req.body.quantity, price: req.body.price, imageUrl: result.secure_url });
        await product.save().then(() => { res.json({ message: 'Product Inserted', success: true }) }).catch((error) => { res.json({ message: "Internal Server Error", success: false }) });
    });



// get method for getting the details of a product
router.get("/details/:id", async (req, res) => {

    // Getting the product from the database
    const product = await Product.findById(req.params.id);

    // Sending the product if it is found
    if (product) {
        return res.json(product);
    }

    // if the product is not found sending product not found error
    return res.json({ "Not Found": "The Product you searched for is currently unavailable" });

});


// route to get all products
router.get("/all", async (req, res) => {

    // getting all the products from the database
    const products = await Product.find();

    // Sending a message if no product is available
    if (products.length == 0) {
        return res.json({ message: "No Product Currently available" });
    }

    const send_products = [];

    for (let i=0; i<products.length; i++){
        send_products.push({_id: products[i]._id, name: products[i].name, quantity: products[i].quantity, price: products[i].price, imageUrl: products[i].imageUrl})
    }

    // returning the products
    return res.json({products: send_products});
})



// route for updating product information
router.put("/update/:id", fetchAdmin, async (req, res) => {

    // First Check if only the admin is making the change
    const key = req.admin.key;
    const customer = await Customer.findOne({isAdmin: true});
    if (key != customer._id) return res.json({ message: "Not authorized for making the change", success: FontFaceSetLoadEvent });

    // Getting the Product to be updated
    const product = await Product.findById(req.params.id);

    // In case there is no product for the given id
    if (!product) {
        return res.json({ message: "No Such Product Found", success: false });
    }

    // creating a new product and replacing the original one with it
    const newProduct = { name: req.body.name, quantity: req.body.quantity, price: req.body.price, imageUrl: req.body.image };

    // setting the unmentioned fields in the new product as those in the original product
    if (!newProduct.name) { newProduct.name = product.name; }
    if (!newProduct.quantity) { newProduct.quantity = product.quantity; }
    if (!newProduct.price) { newProduct.price = product.price; }
    if (newProduct.imageUrl=="none") {
        newProduct.imageUrl = product.imageUrl;;
    } else {
        // creating a function that shall upload the new product image to cloudinary
        const file = req.files;
        let result;
        result = await cloudinary.uploader.upload(file.image.tempFilePath).catch(() => { return res.json({ message: "Internal PP Server Error", success: false }) });
        newProduct.imageUrl = result.secure_url;
    }

    update = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true });
    return res.json({message: "Product Information Updated", success: true});
})



// deleting a product from the database
router.delete("/delete/:id", fetchAdmin, async (req, res) => {

    // First Check if only the admin is making the change
    const key = req.admin.key;
    const customer = await Customer.findOne({isAdmin: true});
    if (key != customer._id) return res.json({ message: "Not authorized for making the change" });

    // Getting the product from the database
    const product = await Product.findById(req.params.id);

    // Sending ta message if the product is not found
    if (!product) {
        return res.json({ message: "The Product with the given id was not found", success: false });
    }

    // Stopping the process if there are orders of the product made
    if (product.isOrdered) {
        return res.json({ message: "Cannot delete the product as there are orders of it made.", success: false });
    }

    // the product is searched and deleted
    await Product.findByIdAndDelete(product._id).then(() => { return res.json({ message: "Product Deleted", success: true }) }).catch(() => { return res.json({ message: "Internal Server Error", success: false }) });
})


// exproting the router
module.exports = router;