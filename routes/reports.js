const express = require("express");
const router = express.Router();
const fetchCustomer = require("../middleware/fetchCustomer");
const fetchAdmin = require("../middleware/fetchAdmin");
const Customer = require("../models/Customer");
const Reports = require("../models/Reports")
const { body, validationResult } = require("express-validator");

router.get("/reports", fetchAdmin, async (req, res)=>{

    const reports = await Reports.find();
    
    const reportsLength = reports.length;
    const reportsToSend = [];

    for (let i=0; i<reportsLength; i++){
        const customer = await Customer.findById(reports[i].customer)
        reportsToSend.push({
            _id: reports[i]._id,
            customer: customer.name,
            timestamp: reports[i].timestamp,
            text: reports[i].text
        })
    }

    reportsToSend.reverse();

    return res.json({reports: reportsToSend, success: true})
})

router.post("/report", fetchCustomer, [
    body("text", {error: "Please tell about the problem"}).isLength({min: 1})
], async (req, res)=>{

    // Checking for any errors so all the required fields are provided
    const errors = validationResult(req);

    // The user shall be informed in case of any error
    if (!errors.isEmpty()) {
        return res.json({ message: errors.errors[0].msg.error, success: false });
    }

    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
        return res.json({ message: "Not authorized for this action", success: false });
    }

    // posting the new report
    const report = await Reports({
        customer: req.customer.id,
        text: req.body.text
    })

    report.save();

    return res.json({message: "Your complain has been recorded. ThankYou!", success: true})
})

router.delete("/delete/:id", fetchAdmin, async(req, res)=>{

    await Reports.findByIdAndDelete(req.params.id);

    return res.json({message: "Customer report deleted", success: true});
})

module.exports = router;