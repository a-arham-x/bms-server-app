const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Customer = require("../models/Customer.js");
const ProductReviews = require("../models/ProductReviews.js")
const fetchCustomer = require("../middleware/fetchCustomer.js");

router.get("/reviews/:id", async (req, res)=>{

    const reviews = await ProductReviews.find({product: req.params.id});
    const reviewsToSend = [];
    const reviewsLength = reviews.length;

    for ( let i=0; i<reviewsLength; i++){
        const customer = await Customer.findById(reviews[i].customer);

        reviewsToSend.push({
            _id: reviews[i]._id,
            customerId: reviews[i].customer,
            customer: customer.name,
            comment: reviews[i].comment,
            timestamp: reviews[i].timestamp
        })
    }

    reviewsToSend.reverse();

    return res.json({reviews: reviewsToSend, success: true});
})

router.post("/review/:id", [
    body("comment", {error: "Please make a comment about the product"}).isLength({min: 1})
], fetchCustomer, async (req, res)=>{

    // getting the customer from the database
    const customer = await Customer.findById(req.customer.id);

    // returing error if the customer is not registered or removed from the database
    if (!customer){
        return res.json({message: "Not Authorized for making the request", success:false});
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
        comment: req.body.comment
    })

    review.save();

    return res.json({message: "Your review has been recorded. ThankYou!", id: review._id, success: true});
})

router.delete("/review/:id", fetchCustomer, async (req, res)=>{

    // getting the customer from the database
    const customer = await Customer.findById(req.customer.id);

    // returing error if the customer is not registered or removed from the database
    if (!customer){
        return res.json({message: "Not Authorized for making the request", success:false});
    }

    //Getting the review from database to make sure the user is deleting their own review
    const review = await ProductReviews.findById(req.params.id);

    if (review.customer != req.customer.id){
        return res.json({message: "You cannot delete this review", success: false})
    }

    // If the user is authorized, the targeted review will be deleted
    await ProductReviews.findByIdAndDelete(review._id);

    return res.json({message: "Review deleted", success: true})
})

module.exports = router;