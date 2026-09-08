const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect to MongoDB first
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
        console.log(`\n🚀 LearnSphere API & Socket Server`);
        console.log(`   ➜  Local:   http://localhost:${PORT}`);
        console.log(`   ➜  Mode:    ${process.env.NODE_ENV || 'development'}\n`);
    });
};

startServer();