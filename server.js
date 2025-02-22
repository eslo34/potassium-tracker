require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000; // The server will run on http://localhost:3000

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple test route
app.get("/", (req, res) => {
    res.send("Nutrition Tracker API is running!");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
