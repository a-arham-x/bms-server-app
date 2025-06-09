// Making all the necessary imports
const express = require("express");
const app = express();
const port = 5000;
const connectToMongo = require("./utils/db");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

// making the app able to use and upload temp files
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// BodyParser for parsing the request bodies
app.use(bodyParser.json({ limit: "10mb" }));

// Using Cors
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: false,
  })
);

// Using all the routes with the aid of the following middlewares
app.use(`/products`, require("./routes/products"));
app.use(`/customer`, require("./routes/customers"));
app.use(`/orders`, require("./routes/orders"));
app.use(`/admin`, require("./routes/admin"));
app.use(`/reviews`, require("./routes/reviews"));
app.use("/reports", require("./routes/reports"));

// Calling the connectToMongo Function to connect to our database.
connectToMongo();

app.get("/", (req, res) => {
  return res.json({ message: "Hello World", success: true });
});

// Starting the app
app.listen(port, () => {
  console.log("The App has started");
});
