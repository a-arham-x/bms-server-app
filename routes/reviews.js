const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Customer = require("../models/Customer.js");
const Product = require("../models/Products.js");
const ProductReviews = require("../models/ProductReviews.js");
const fetchCustomer = require("../middleware/fetchCustomer.js");

router.get("/reviews/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const product = await Product.findById(req.params.id, "name");
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    const totalReviews = await ProductReviews.countDocuments({
      product: req.params.id,
    });

    const reviews = await ProductReviews.find({ product: req.params.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const reviewsToSend = [];

    // const base64Data = product.image?.toString("base64");
    // const imageUrl = `data:${product.image?.contentType};base64,${base64Data}`;

    for (let review of reviews) {
      const customer = await Customer.findById(review.customer);
      if (!customer) continue;

      reviewsToSend.push({
        _id: review._id,
        customer: customer.name,
        customerId: customer._id,
        comment: review.comment,
        timestamp: review.timestamp,
        // imageUrl,
        productName: product.name,
        productId: product._id,
      });
    }

    return res.json({
      reviews: reviewsToSend,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      success: true,
    });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
});

router.post(
  "/review/:id",
  [
    body("comment", {
      error: "Please make a comment about the product",
    }).isLength({ min: 1 }),
  ],
  fetchCustomer,
  async (req, res) => {
    // getting the customer from the database
    const customer = await Customer.findById(req.customer.id);

    // returing error if the customer is not registered or removed from the database
    if (!customer) {
      return res.json({
        message: "Not Authorized for making the request",
        success: false,
      });
    }

    // Checking for any errors so all the required fields are provided
    const errors = validationResult(req);

    // The user shall be informed in case of any error
    if (!errors.isEmpty()) {
      return res.json({ message: errors.errors[0].msg.error, success: false });
    }

    const review = new ProductReviews({
      customer: req.customer.id,
      product: req.params.id,
      comment: req.body.comment,
    });

    review.save();

    return res.json({
      message: "Your review has been recorded. ThankYou!",
      id: review._id,
      success: true,
    });
  }
);

router.get("/myreviews", fetchCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    if (!customer) {
      return res
        .status(403)
        .json({ message: "Not authorized", success: false });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalReviews = await ProductReviews.countDocuments({
      customer: req.customer.id,
    });

    const reviews = await ProductReviews.find({
      customer: req.customer.id,
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const reviewsToSend = [];

    for (let review of reviews) {
      const product = await Product.findById(review.product, "name");
      if (!product) continue;

      // const base64Data = product.image?.toString("base64");
      // const imageUrl = `data:${product.image?.contentType};base64,${base64Data}`;

      reviewsToSend.push({
        _id: review._id,
        customer: customer.name,
        customerId: customer._id,
        comment: review.comment,
        timestamp: review.timestamp,
        // imageUrl,
        productName: product.name,
        productId: product._id,
      });
    }

    return res.json({
      reviews: reviewsToSend,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      success: true,
    });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
});

router.delete("/review/:id", fetchCustomer, async (req, res) => {
  // getting the customer from the database
  const customer = await Customer.findById(req.customer.id);

  // returing error if the customer is not registered or removed from the database
  if (!customer) {
    return res.json({
      message: "Not Authorized for making the request",
      success: false,
    });
  }

  //Getting the review from database to make sure the user is deleting their own review
  const review = await ProductReviews.findById(req.params.id);

  if (review.customer != req.customer.id) {
    return res.json({
      message: "You cannot delete this review",
      success: false,
    });
  }

  // If the user is authorized, the targeted review will be deleted
  await ProductReviews.findByIdAndDelete(review._id);

  return res.json({ message: "Review deleted", success: true });
});

module.exports = router;
