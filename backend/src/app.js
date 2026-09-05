const logger = require("./middleware/logger");
const express = require("express");
const cors = require("cors");

const notFound = require("./middleware/notFound");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "E-Learning Backend is Running!"
    });
});

app.use("/api/v1/test", (req, res) => {
    res.json({
        success: true,
        message: "Test API is working"
    });
});

// 404 middleware MUST come after routes
app.use(notFound);

module.exports = app;