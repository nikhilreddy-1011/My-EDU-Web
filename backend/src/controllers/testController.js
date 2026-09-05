const testAPI = (req, res) => {
    res.json({
        success: true,
        message: "Test API is working"
    });
};

module.exports = {
    testAPI
};