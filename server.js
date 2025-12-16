// ==================== IMPORTS ====================
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

// ==================== CONFIGURATION ====================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'Like Duel',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        totalUsers: require('./modules/users').getTotalUsers(),
        activeUsers: require('./modules/users').getActiveUsers(),
        inQueue: require('./modules/queue').getQueueSize(),
        activeDuels: require('./modules/duels').getActiveDuels(),
        activeChats: require('./modules/chats').getActiveChats(),
        serverTime: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== SOCKET.IO ====================
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ==================== MODULE IMPORTS ====================
const UserManager = require('./modules/users');
const QueueManager = require('./modules/queue');
const DuelManager = require('./modules/duels');
const ChatManager = require('./modules/chats');
const Matchmaking = require('./modules/matchmaking');

// Initialize managers
const userManager = new UserManager();
const queueManager = new QueueManager();
const duelManager = new DuelManager();
const chatManager = new ChatManager();
const matchmaking = new Matchmaking(userManager, queueManager, duelManager);

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
    console.log(`✅ New connection: ${socket.id}`);
    
    // Send welcome
    socket.emit('connected', {
        message: 'Welcome to Like Duel!',
        serverTime: new Date().toISOString()
    });

    // Import socket handlers
    require('./handlers/auth')(socket, io, userManager);
    require('./handlers/queue')(socket, io, userManager, queueManager, matchmaking);
    require('./handlers/duel')(socket, io, userManager, duelManager);
    require('./handlers/chat')(socket, io, userManager, chatManager);
    require('./handlers/disconnect')(socket, io, userManager, queueManager);
});

// ==================== SERVER START ====================
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - PRODUCTION READY');
    console.log('='.repeat(70));
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log('✅ Server initialized successfully');
    console.log('='.repeat(70));
});

// ==================== CLEANUP TASKS ====================
setInterval(() => {
    userManager.cleanInactiveUsers();
    console.log(`📊 Stats: ${userManager.getTotalUsers()} users, ${queueManager.getQueueSize()} in queue`);
}, 60000);

module.exports = { app, server, io };