// All The Required Exports
const express = require("express");
const router = express.Router();
const Product = require("../models/Products");
const Orders = require("../models/Orders");
const OrdersProducts = require("../models/OrdersProducts");
const fetchAdmin = require("../middleware/fetchAdmin");
const { body, validationResult } = require("express-validator");
const Customer = require("../models/Customer");
const fs = require("fs");

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
        const allowedExtensions = ["png", "jpeg", "jpg"];

        const file = req.files;
        if (file) {
            const fileExtension = req.files.image.name.split(".").pop().toLowerCase();
            if (!allowedExtensions.includes(fileExtension)){
                return res.json({message: "File Type Provided is not acceptable", success: false});
            }
            if (file.image) {
                const imageBuffer = fs.readFileSync(file.image.tempFilePath);
                const image = imageBuffer;
                fs.rm(
                    "./tmp",
                    {
                      recursive: true
                    },
                    err => {
                      if (err) {
                        console.log("There was an error");
                      }
                    }
                  );
                // In case of no errors the product is stored and a response in delivered.
            const product = new Product({ name: req.body.name, quantity: req.body.quantity, price: req.body.price, image});
            await product.save();
            return res.json({message: "New Producted Added", success: true})
            } 
        }
        const product = new Product({ name: req.body.name, quantity: req.body.quantity, price: req.body.price});
        await product.save();
        return res.json({message: "New Product Added", id: product._id,      success: true});
        
    });



// get method for getting the details of a product
router.get("/details/:id", async (req, res) => {

    // Getting the product from the database
    const product = await Product.findById(req.params.id);
    if (product) {
        // Sending the product if it is found
        const base64Data = product.image?.toString("base64");
        const imageUrl = `data:${product.image?.contentType};base64,${base64Data}`;
        const productToSend = {
            _id: product._id,   
            name: product.name,
            quantity: product.quantity,  
            price: product.price,
            imageUrl, 
            success: true
        };
        return res.json(productToSend);
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
        return res.json({ message: "No Product Currently available", success: false });
    }

    const productsToSend = [];

    for (let i=0; i<products.length; i++){
        const base64Data = products[i].image?.toString("base64");
        const imageUrl = `data:${products[i].image?.contentType};base64,${base64Data}`;
        const productToSend = {
            _id: products[i]._id,
            name: products[i].name, 
            quantity: products[i].quantity,
            price: products[i].price,
            imageUrl
        };
        productsToSend.push(productToSend)
    }

    // returning the products
    return res.json({products: productsToSend, success: true});
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

    let newProduct;
    let image
    const file = req.files;
        if (file) {
            if (file.image) {
                const fileExtension = req.files.image.name.split(".").pop().toLowerCase();
                if (!allowedExtensions.includes(fileExtension)){
                    return res.json({message: "File Type Provided is not acceptable", success: false});
                }
                const imageBuffer = fs.readFileSync(file.image.tempFilePath);
                image = imageBuffer;
                fs.rm(
                    "./tmp",
                    {
                      recursive: true
                    },
                    err => {
                      if (err) {
                        console.log("There was an error");
                      }
                    }
                  );
            } 
        }

    // creating a new product and replacing the original one with it
    newProduct = { name: req.body.name, quantity: req.body.quantity, price: req.body.price, image};

    // setting the unmentioned fields in the new product as those in the original product
    if (!newProduct.name) { newProduct.name = product.name; }
    if (!newProduct.quantity) { newProduct.quantity = product.quantity; }
    if (!newProduct.price) { newProduct.price = product.price; }
    if (!newProduct.image) {
        newProduct.image = product.image;
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
    const ordersProducts = await OrdersProducts.find({product: req.params.id})
    if (ordersProducts.length>0){
        for (let i=0; i<ordersProducts.length; i++){
            const order = await Orders.findById(ordersProducts[i].order);
            if (!order.received && !order.cancelled){
                return res.json({ message: "Cannot delete the product as there are orders of it made.", success: false });
            }
        }
    }

    // the product is searched and deleted
    await Product.findByIdAndDelete(product._id).then(() => { return res.json({ message: "Product Deleted", success: true }) }).catch(() => { return res.json({ message: "Internal Server Error", success: false }) });

})


// exproting the router
module.exports = router;