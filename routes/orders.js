// making all the necessary imports
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Order = require("../models/Orders.js");
const Customer = require("../models/Customer.js");
const Product = require("../models/Products.js");
const OrdersProducts = require("../models/OrdersProducts.js")
const fetchCustomer = require("../middleware/fetchCustomer.js");
const fetchAdmin = require("../middleware/fetchAdmin.js");

// creating the route for making the order
router.post("/make", fetchCustomer, async (req, res) => {

    // A variable success to define the success or failure of the operation
    let success;

    // If there is no element in the products array a message will be given to the user
    if (req.body.products.length===0){
        success = false;
        return res.json({message: "Please Select Some Items First", success});
    }

    // getting the customer making the order from the database
    const customer = await Customer.findById(req.customer.id);

    // returning error if no customer has been return
    if (!customer){
        success = false;
        return res.json({message: "Not authorized for making the order", success});
    }

    // checking if there are products in the request
    if (!req.body.products){
        success = false;
        return res.json({message: "Products Missing", success});
    }

    // checking that none of the products has a quantity of 0 and also calculating the total cost of the order;
    const len = req.body.products.length;
    let cost = 0;
    let product;

    for (let i=0; i<len; i++){

        // returning an error response if any product quantity is 0.
        if (req.body.products[i].product_quantity == 0){
            success = false;
            return res.json({message: "Product Quantity should not be zero.", success});
        }

        // fetching product from the database
        product = await Product.findById(req.body.products[i].product_id);
        if (!product){
            success = false;
            return res.json({message: "One of the ordered products is not available", success});
        }

        if (product.quantity < req.body.products[i].product_quantity){
            success = false;
            return res.json({message: "One of the product is asked in more quantity than the supply", success});
        }

        let newQuantity = product.quantity - req.body.products[i].product_quantity;
        let newOrderedQuantity = product.orderedQuantity + req.body.products[i].product_quantity;
        await Product.updateOne({_id: product._id}, {$set: {quantity: newQuantity, orderedQuantity: newOrderedQuantity, isOrdered: true}});

        // calculating cost
        cost += product.price * parseInt(req.body.products[i].product_quantity);
    }

    // creating a new order and saving it to our database
    const order = new Order({date: Date.now(), customer: req.customer.id, cost});
    order.save().then((newOrder)=>{
        for (let i=0; i<len; i++){
            const orderProduct = new OrdersProducts({order: newOrder._id, product: req.body.products[i].product_id, productQuantity: req.body.products[i].product_quantity});
            orderProduct.save();
        }
        success = true;
        res.json({message: "Your Order has been made", id: order._id, success})
    }).catch(()=>{
        success = false;
        res.json({message: "Internal Server Error", success})});

});

// route for a user to view all the orders
router.get("/get", fetchCustomer, async (req, res) => {

    // getting the customer from the database
    const customer = await Customer.findById(req.customer.id);

    // returing error if the customer is not registered or removed from the database
    if (!customer){
        return res.json({message: "Not Authorized for making the request", success:false});
    }

    // getting all the orders of the customer from the Orders collection
    const orders = await Order.find({customer: req.customer.id}).catch(()=>{return res.json({message:"Internal Server Error", success:false})});
    const ordersToSend = [];
    const len = orders.length;

    for (let i=0; i<len; i++){
        const orderProducts = await OrdersProducts.find({order: orders[i]._id})
        const order = {
            _id: orders[i]._id,
            customer: orders[i].customer,
            date: orders[i].date,
            cost: orders[i].cost,
            received: orders[i].received,
            cancelled: orders[i].cancelled,
            products: []
        };
        const productsLen = orderProducts.length;
        for (let j=0; j<productsLen; j++){
            const product = await Product.findById(orderProducts[j].product);
            const productName = product.name;
            order.products.push({
                _id : orderProducts[j]._id,
                order: orderProducts[j].order,
                product: orderProducts[j].product,
                productName,
                productQuantity: orderProducts[j].productQuantity
            });
        }
        ordersToSend.push(order)
    }
    // reversing the array so the customer sees the latest orders first
    ordersToSend.reverse();

    // returning the response
    return res.json({orders: ordersToSend, success: true});
})

// creating the route for deleting an order
router.delete("/delete/:id", fetchCustomer, async (req, res) => {
    
    // getting the customer from the database
    const customer = await Customer.findById(req.customer.id);

    // returing error if the customer is not registered or removed from the database
    if (!customer){
        return res.json({message: "Not Authorized for performing this operation", success: false})
    }

    // getting the order from the database
    const order = await Order.findById(req.params.id).catch(()=>{return res.json({message:"Internal Server Error", success:false})});
    const orderProducts = await OrdersProducts.find({order: order._id})
    // adding the items backed to database
    for (let i=0; i<orderProducts.length; i++){
        let product = await Product.findById(orderProducts[i].product).catch(()=>{return res.json({message:"Internal Server Error", success:false})});
        let newQuantity = product.quantity + orderProducts[i].productQuantity;
        await Product.updateOne({_id: orderProducts[i].product}, {$set:{quantity: newQuantity}})
    }

    // deleting the order
    await Order.findByIdAndUpdate(req.params.id, {cancelled: true}).catch(()=>{return res.json({message:"Internal Server Error", success:false})});

    return res.json({message: "Order Deleted", success: true});
})

router.post("/received", fetchAdmin, [
    body("id", {error: 'Need Order Id'})
], async (req, res) => {

    // Authenticating the admin token 
    const admin = await Customer.findOne({isAdmin: true});

    if (admin._id != req.admin.key){
        return res.json({message: "Authorization Failed", success: false});
    }

    // checking for any errors in the request body
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.json({message: "There is no user to fetch orders", success: false});
    }

    // updating the order as received
    await Order.findByIdAndUpdate(req.body.id, {received: true});
    return res.json({message: "The Order is received", success: true});
})

// exporting the roouter
module.exports = router;