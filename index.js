
// Making all the necessary imports
const express = require("express");
const app = express();
const port = 5000;
const connectToMongo = require('./utils/db');
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors")

// making the app able to use and upload temp files
app.use(fileUpload({
    useTempFiles: true
}));

// BodyParser for parsing the request bodies
app.use(bodyParser.json());

// Using Cors
app.use(cors());

// Using all the routes with the aid of the following middlewares
app.use(`/${process.env.ROUTES_CODE}/products`, require("./routes/products"));
app.use(`/${process.env.ROUTES_CODE}/customer`, require("./routes/customers"));
// app.use(`/orders`, require("./routes/orders"));
app.use(`/${process.env.ROUTES_CODE}/admin`, require("./routes/admin"));

// Calling the connectToMongo Function to connect to our database.
connectToMongo();

app.get("/", (req, res)=>{
  res.send("Hello World");
})

// Starting the app
app.listen(port);