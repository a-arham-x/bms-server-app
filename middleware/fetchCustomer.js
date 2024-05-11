// requiring JWT Package
const jwt = require("jsonwebtoken");

// Function that fetches the customer from the request header
const fetchCustomer = (req, res, next) => {
    const token = req.header("auth-token");

    // sending an authentication message in case of an error
    if (!token) {
        res.json({ message: "Please authenticate using a valid token", success: false});
    }

    // Verifying the customer
    try {
        const string = jwt.verify(token, process.env.JWT_SECRET);
        req.customer = string.customer;
    } catch (error) {
        return res.json({ message: "Please authenticate using a valid token", success: false });
    }
    next();
}

// Exporting the module for use in other files
module.exports = fetchCustomer;