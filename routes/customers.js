// // Making all the Necessary Imports
const express = require("express");
const router = express.Router();
const mailVerification = require("../utils/emailVerification");
const Customer = require("../models/Customer");
const Order = require("../models/Orders");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fetchCustomer = require("../middleware/fetchCustomer");
const OrdersProducts = require("../models/OrdersProducts");
const Reports = require("../models/Reports");
const ProductReviews = require("../models/ProductReviews");

let verificationCode;

// when the user enters all the data, the user gets a verification mail
// so here is the route for that mail
router.post(
  "/checkemail",
  [body("email", { error: "Email of the User not provided" }).isEmail()],
  async (req, res) => {
    // Checking for any errors so all the required fields are provided
    const errors = validationResult(req);

    // The user shall be informed in case of any error
    if (!errors.isEmpty()) {
      return res.json({ message: errors.errors[0].msg.error, success: false });
    }

    // checking if there is a customer with the entered email already
    const customer = await Customer.findOne({ email: req.body.email });
    if (customer) {
      return res.json({
        message: "A customer already registered with this email",
        success: false,
      });
    }

    return res.redirect(`/customer/getmail/${req.body.email}`);
  }
);

// route for registering of the users
router.post(
  "/register",
  [
    body("code", { error: "Enter The verifictaion Code" }),
    body("name", { error: "Name not Provided" }).isLength({ min: 5 }),
    body("dateOfBirth", { error: "Date of Birth not provided" }).isDate(),
    body("email", { error: "Email of the User not provided" }).isEmail(),
    body("password", { error: "Password Not provided" }).isLength({
      min: 8,
      max: 16,
    }),
  ],
  async (req, res) => {
    // Checking for any errors so all the required fields are provided
    const errors = validationResult(req);

    // The user shall be informed in case of any error
    if (!errors.isEmpty()) {
      return res.json({ message: errors.errors[0].msg.error, success: false });
    }

    // check if the correct code is entered
    if (req.body.code != verificationCode) {
      return res.json({ message: "Enter the correct Code", success: false });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // creating the customer object and saving it to the database
    const customer = new Customer({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      dateOfBirth: req.body.dateOfBirth,
    });

    // saving the new customer and sending the token
    await customer
      .save()
      .then(() => {
        success = true;
        const id = { customer: { id: customer._id } };
        const token = jwt.sign(id, process.env.JWT_SECRET);
        return res.json({ token: token, success });
      })
      .catch((error) => {
        success = false;
        console.log(error);
        return res.json({ message: "Internal Server Error", success });
      });
  }
);

// route for logging in the users
router.post(
  "/login",
  [
    body("email", { error: "Email is required for logging in" }).isEmail(),
    body("password", { error: "Password is required for logging in" }),
  ],
  async (req, res) => {
    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ message: errors.errors[0].msg.error, success: false });
    }

    const customer = await Customer.findOne({ email: req.body.email });

    if (!customer) {
      return res.json({
        message: "No account with this email available",
        success: false,
      });
    }

    // comparing passwords
    const passwordCorrect = await bcrypt.compare(
      req.body.password,
      customer.password
    );

    // returning message if the password is incorrect
    if (!passwordCorrect) {
      success = false;
      return res.json({ message: "Incorrect Password", success });
    }
    // checking if two step authentication is enabled
    if (customer.twoStepAuth) {
      return res.redirect(`/customer/getmail/${req.body.email}`);
    }

    // checking if it is th admin logging in
    if (customer.isAdmin) {
      const key = { admin: { key: customer._id } };
      const adminToken = jwt.sign(key, process.env.JWT_SECRET);
      return res.json({ adminToken: adminToken, success: true });
    }

    // creating a web token
    const id = { customer: { id: customer._id } };
    const token = jwt.sign(id, process.env.JWT_SECRET);
    return res.json({ token: token, success: true });
  }
);

// creating route for two step authentication
router.get("/getmail/:email", async (req, res) => {
  // getting a verification code
  verificationCode = await mailVerification(req, res, req.params.email);
  // In case no verification code is returned
  if (verificationCode === 0) {
    return res.json({
      message:
        "Either you have ot entered a valid email or some server error ocurred",
      success: false,
    });
  }

  return res.json({ success: true });
});

// verifying the provided code at login
router.post(
  "/verifylogin",
  [
    body("code", { error: "Please enter the correct code" }).isLength({
      min: 6,
      max: 6,
    }),
    body("email", { error: "Email is required for logging in" }).isEmail(),
    body("password", { error: "Password is required for logging in" }),
  ],
  async (req, res) => {
    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ message: errors.errors[0].msg.error, success: false });
    }

    const customer = await Customer.findOne({ email: req.body.email });

    if (!customer) {
      return res.json({
        message: "No account with this email available",
        success: false,
      });
    }

    // comparing passwords
    const passwordCorrect = await bcrypt.compare(
      req.body.password,
      customer.password
    );

    // returning message if the password is incorrect
    if (!passwordCorrect) {
      success = false;
      return res.json({ message: "Incorrect Password", success });
    }

    // checking if it is th admin logging in
    if (customer.isAdmin) {
      const key = { admin: { key: customer._id } };
      const adminToken = jwt.sign(key, process.env.JWT_SECRET);
      return res.json({ adminToken: adminToken, success: true });
    }

    // creating a web token
    const id = { customer: { id: customer._id } };
    const token = jwt.sign(id, process.env.JWT_SECRET);
    return res.json({ token: token, success: true });
  }
);

// route for getting the customer
router.get("/getcustomer", fetchCustomer, async (req, res) => {
  // Getting the user to whose information is needed
  const customer = await Customer.findById(req.customer.id);

  // In case there is no customer for the given id
  if (!customer) {
    return res.json({ message: "No Such Customer Found" });
  }

  // If the customer is found, we return it
  return res.json(customer);
});

// route for updating the name of the user
router.put(
  "/updatename",
  fetchCustomer,
  [
    body("name", { error: "Name must be of atleast length 5" }).isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // defining a variable success that defines if the operation succeeded or not
    let success;
    console.log("We are changing name");

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      success = false;
      return res.send({
        message: "One of the required fields is not correct",
        success,
      });
    }

    // Getting the user to be updated
    const customer = await Customer.findById(req.customer.id);
    // In case there is no customer for the given id
    if (!customer) {
      success = false;
      return res.json({ message: "No Such Customer Found", success });
    }

    // returning success true if the operation is completed
    const update = await Customer.updateOne(
      { _id: req.customer.id },
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

let newMail;

router.put(
  "/getmail",
  fetchCustomer,
  [body("email", { error: "Enter an Email First" }).isEmail()],
  async (req, res) => {
    console.log("Route Accessed");
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

    // Getting the user to be updated
    const customer = await Customer.findById(req.customer.id);

    // In case there is no customer for the given id
    if (!customer) {
      success = false;
      return res.json({ message: "No Such Customer Found", success });
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
          "Either you have not entered a valid email or some server error ocurred",
        success: false,
      });
    }

    // returning the response
    success = true;
    newMail = req.body.email;
    return res.json({ code: verificationCode, success });
  }
);

// update email
router.put(
  "/updateemail",
  fetchCustomer,
  [body("code", { error: "Enter Code First" })],
  async (req, res) => {
    // a variable success to define the success or failure of the request
    let success;

    // Checking for any errors in the request fields
    const errors = validationResult(req);

    console.log("Updating Email");

    if (!errors.isEmpty()) {
      success = false;
      return res.send({
        error: "One of the required fields is not correct",
        success,
      });
    }

    // Getting the user to be updated
    const customer = await Customer.findById(req.customer.id);

    // In case there is no customer for the given id
    if (!customer) {
      success = false;
      return res.json({ message: "No Such Customer Found", success });
    }

    // returning success true if the operation is completed
    const update = await Customer.updateOne(
      { _id: req.customer.id },
      { $set: { email: newMail } }
    );
    success = true;
    return res.json({
      update,
      message: "Your Email has been updated",
      success,
    });
  }
);

// route for updating password
router.put(
  "/updatepassword",
  fetchCustomer,
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

    // Getting the user to be updated
    const customer = await Customer.findById(req.customer.id);

    // In case there is no customer for the given id
    if (!customer) {
      success = false;
      return res.json({ message: "No Such Customer Found", success });
    }

    // checking if the old password entered is correct or not.
    const oldPasswordCorrect = await bcrypt.compare(
      req.body.oldPassword,
      customer.password
    );
    if (!oldPasswordCorrect) {
      success = false;
      return res.json({ message: "Enter the correct old password", success });
    }

    // hashing the new password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    // updating password and sending the response
    const update = await Customer.updateOne(
      { _id: req.customer.id },
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

//route for the user to enable two step authentication
router.post("/enabletwostepauth", fetchCustomer, async (req, res) => {
  // Getting the user whose two step authentication is to be enabled
  const customer = await Customer.findById(req.customer.id);

  // In case there is no customer for the given id
  if (!customer) {
    return res.json({ message: "Autrhentication failed", success: false });
  }

  // checking if two step authentication is already enabled
  if (customer.twoStepAuth) {
    return res.json({
      message: "Two Step Authentication is already enabled for your account",
      success: false,
    });
  }

  await Customer.updateOne(
    { _id: req.customer.id },
    { $set: { twoStepAuth: true } }
  );

  return res.json({
    message: "Two Step Authentication Enabled for your account",
    success: true,
  });
});

// route for deleting a customer account
router.delete(
  "/delete",
  fetchCustomer,
  [
    body("email", "Enter The Correct Email").isEmail(),
    body("password", "Enter The Correct Password"),
  ],
  async (req, res) => {
    // success variable for storing the success or failure of the operation
    let success;

    // Checking for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      success = false;
      return res.json({
        message: "One of the required fields is not correct",
        success,
      });
    }

    // Getting the user to be deleted
    const customer = await Customer.findById(req.customer.id);
    // In case there is no customer for the given id
    if (!customer) {
      success = false;
      return res.json({ message: "No Such Customer Found", success });
    }

    // Making sure id the correct credentials are entered
    const passwordCorrect = await bcrypt.compare(
      req.body.password,
      customer.password
    );

    if (customer.email != req.body.email) {
      success = false;
      return res.json({ message: "Invalid Credentials", success });
    }

    if (!passwordCorrect) {
      success = false;
      return res.json({ message: "Invalid Credentials", success });
    }

    // first we delete all the orders made by the customer from our database and then the customer
    const orders = await Order.find({ customer: req.customer.id });

    const ordersLength = orders.length;
    for (let i = 0; i < ordersLength; i++) {
      await OrdersProducts.deleteMany({ order: orders[i]._id });
    }

    await Order.deleteMany({ customer: req.customer.id });

    // deleting the reviews and reports made by the customer
    await Reports.deleteMany({ customer: req.customer.id });
    await ProductReviews.deleteMany({ customer: req.customer.id });

    await Customer.findByIdAndDelete(customer.id)
      .then(() => {
        return res.json({ message: "Account Deleted", success });
      })
      .catch(() => {
        success = false;
        return res.json({ message: "Internal Server Error", success });
      });
  }
);

module.exports = router;
