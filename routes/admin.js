// Making all the Necessary Imports
const express = require("express");
const router = express.Router();
const mailVerification = require("../utils/emailVerification");
const Customer = require("../models/Customer");
const Order = require("../models/Orders");
const Product = require("../models/Products");
const OrdersProducts = require("../models/OrdersProducts");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const fetchAdmin = require("../middleware/fetchAdmin");

let verificationCode;

// route for getting the admin
router.get("/getadmin", fetchAdmin, async (req, res) => {
  // Authenticating the admin token
  const admin = await Customer.findOne({ isAdmin: true });

  if (admin._id != req.admin.key) {
    return res.json({ message: "Authorization Failed", success: false });
  }

  // If the customer is found, we return it
  return res.json(admin);
});

// route for updating the name of the user
router.put(
  "/updatename",
  fetchAdmin,
  [
    body("name", { error: "Name must be of atleast length 5" }).isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // defining a variable success that defines if the operation succeeded or not
    let success;

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      success = false;
      return res.send({
        message: "One of the required fields is not correct",
        success,
      });
    }

    // Authenticating the admin token
    const admin = await Customer.findOne({ isAdmin: true });

    if (admin._id != req.admin.key) {
      return res.json({ message: "Authorization Failed", success: false });
    }

    // returning success true if the operation is completed
    const update = await Customer.updateOne(
      { _id: req.admin.key },
      { $set: { name: req.body.name } }
    );
    success = true;
    return res.json({
      update,
      message: "Your account name has been updated",
      success,
    });
  }
);

let newAdminMail;

// // rouet for getting admin mails
router.put(
  "/getmail",
  fetchAdmin,
  [body("email", { error: "Enter an Email First" }).isEmail()],
  async (req, res) => {
    // defining a variable success that defines if the operation succeeded or not
    let success;

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      success = false;
      return res.json({
        message: "One of the required fields is not correct",
        success,
      });
    }

    // Authenticating the admin token
    const admin = await Customer.findOne({ isAdmin: true });

    if (admin._id != req.admin.key) {
      return res.json({ message: "Authorization Failed", success: false });
    }

    // checking if there is a customer with the entered email already
    const customer1 = await Customer.findOne({ email: req.body.email });
    if (customer1) {
      success = false;
      return res.json({
        message: "A customer already registered with this email",
        success,
      });
    }

    // getting a verification code
    verificationCode = await mailVerification(req, res, req.body.email);

    // In case no verification code is returned
    if (verificationCode === 0) {
      return res.json({
        message:
          "Either you have ot entered a valid email or some server error ocurred",
        success: false,
      });
    }

    // returning the response
    success = true;
    newAdminMail = req.body.email;
    return res.json({ code: verificationCode, success });
  }
);

// // update administrator email
router.put(
  "/updateemail",
  fetchAdmin,
  [body("code", { error: "Enter Code First" })],
  async (req, res) => {
    // a variable success to define the success or failure of the request
    let success;

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      success = false;
      return res.send({
        error: "One of the required fields is not correct",
        success,
      });
    }

    // Authenticating the admin token
    const admin = await Customer.findOne({ isAdmin: true });

    if (admin._id != req.admin.key) {
      return res.json({ message: "Authorization Failed", success: false });
    }

    // returning success true if the operation is completed
    const update = await Customer.updateOne(
      { _id: req.admin.key },
      { $set: { email: newAdminMail } }
    );
    success = true;
    return res.json({
      update,
      message: "Your Email has been updated",
      success,
    });
  }
);

// // route for updating password
router.put(
  "/updatepassword",
  fetchAdmin,
  [
    body("oldPassword", { error: "Enter The correct Password" }),
    body("newPassword", { error: "Enter The new password to update" }).isLength(
      { min: 8, max: 16 }
    ),
  ],
  async (req, res) => {
    // a variable success to define the success or failure of the request
    let success;

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      success = false;
      return res.json({
        message: "One of the required Fields is not correct.",
        success,
      });
    }

    // Authenticating the admin token
    const admin = await Customer.findOne({ isAdmin: true });

    if (admin._id != req.admin.key) {
      return res.json({ message: "Authorization Failed", success: false });
    }

    // checking if the old password entered is correct or not.
    const oldPasswordCorrect = await bcrypt.compare(
      req.body.oldPassword,
      admin.password
    );
    if (!oldPasswordCorrect) {
      success = false;
      return res.json({ message: "Enter the correct old password", success });
    }

    // hashing the new password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    // updating password and sending the response
    const update = await Customer.updateOne(
      { _id: req.admin.key },
      { $set: { password: hashedPassword } }
    );
    success = true;
    return res.json({
      message: "Your password has been updated",
      update,
      success,
    });
  }
);

router.get("/getcustomers", fetchAdmin, async (req, res) => {
  // Authenticating the admin token
  const admin = await Customer.findOne({ isAdmin: true });

  if (admin._id != req.admin.key) {
    return res.json({ message: "Authorization Failed", success: false });
  }

  // Getting all the customers from the database
  const customers = await Customer.find({ isAdmin: false });

  // returning the response
  return res.json({
    message: "All Customers Fetched",
    customers,
    success: true,
  });
});

router.post(
  "/getorders",
  fetchAdmin,
  [body("id", { error: "There is no user id given" })],
  async (req, res) => {
    // Authenticating the admin token
    const admin = await Customer.findOne({ isAdmin: true });

    if (admin._id != req.admin.key) {
      return res.json({ message: "Authorization Failed", success: false });
    }

    // checking for any errors in the request body
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        message: "There is no user to fetch orders",
        success: false,
      });
    }

    // getting all the orders of the customer from the Orders collection
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({
      customer: req.body.id,
    });

    const orders = await Order.find({ customer: req.body.id })
      .sort({ date: -1 }) // newest orders first
      .skip(skip)
      .limit(limit);

    const ordersToSend = [];

    for (let order of orders) {
      const orderProducts = await OrdersProducts.find({ order: order._id });

      const products = [];
      for (let op of orderProducts) {
        const product = await Product.findById(op.product, "name price");
        products.push({
          _id: op._id,
          order: op.order,
          product: op.product,
          productName: product?.name || "Unknown Product",
          productQuantity: op.productQuantity,
        });
      }

      ordersToSend.push({
        _id: order._id,
        customer: order.customer,
        date: order.date,
        cost: order.cost,
        received: order.received,
        cancelled: order.cancelled,
        products,
      });
    }

    return res.json({
      success: true,
      orders: ordersToSend,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  }
);

module.exports = router;
