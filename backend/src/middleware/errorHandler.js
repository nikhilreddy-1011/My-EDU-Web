const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Mongoose: bad ObjectId
    if (err.name === 'CastError') {
        error = { statusCode: 404, message: 'Resource not found' };
    }

    // Mongoose: duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = { statusCode: 400, message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` };
    }

    // Mongoose: validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        error = { statusCode: 400, message: messages.join(', ') };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = { statusCode: 401, message: 'Invalid token' };
    }
    if (err.name === 'TokenExpiredError') {
        error = { statusCode: 401, message: 'Token expired' };
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${statusCode}: ${message}`, err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
