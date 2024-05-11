// requiring JWT Package
const jwt = require("jsonwebtoken");

// Function that fetches the admin from the request header
const fetchAdmin = (req, res, next) => {
    const adminToken = req.header("admin-token");

    // sending an authentication message in case of an error
    if (!adminToken) {
        return res.json({ message: "Please authenticate using a valid token", success: false });
    }

    // Verifying the admin
    try {
        const string = jwt.verify(adminToken, process.env.JWT_SECRET);
        req.admin = string.admin;
    } catch (error) {
        return res.status(401).send({ message: "Please authenticate using a valid token", success: false });
    }
    next();
}

// Exporting the function for use in other files
module.exports = fetchAdmin;