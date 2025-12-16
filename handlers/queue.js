// handlers/queue.js - Queue socket handlers
module.exports = (socket, io, userManager, queueManager, matchmaking) => {
    
    socket.on('enter_queue', () => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }
            
            if (!user.hasSelectedGender) {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Navbatga kirish uchun jins tanlashingiz kerak'
                });
                return;
            }
            
            if (queueManager.isInQueue(user.id)) {
                const position = queueManager.getQueuePosition(user.id);
                socket.emit('queue_joined', {
                    position: position,
                    total: queueManager.getQueueSize(),
                    message: 'Allaqachon navbatdasiz'
                });
                return;
            }
            
            // Join queue
            queueManager.joinQueue(user.id);
            const position = queueManager.getQueuePosition(user.id);
            
            socket.emit('queue_joined', {
                position: position,
                total: queueManager.getQueueSize(),
                estimatedTime: position * 3,
                message: 'Navbatga muvaffaqiyatli kirdingiz!'
            });
            
            console.log(`🚀 ${user.firstName} joined queue (position: ${position})`);
            
            // Send queue updates
            sendQueueUpdate(socket, user.id);
            
            // Try quick match
            setTimeout(() => {
                tryQuickMatch(user.id, socket, io, userManager, queueManager, matchmaking);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Enter queue error:', error);
            socket.emit('error', { message: 'Navbatga kirish xatosi' });
        }
    });

    socket.on('leave_queue', () => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) return;
            
            if (queueManager.leaveQueue(user.id)) {
                socket.emit('left_queue', {
                    message: 'Navbatdan chiqdingiz'
                });
                console.log(`🚪 ${user.firstName} left queue`);
            }
            
        } catch (error) {
            console.error('❌ Leave queue error:', error);
        }
    });

    socket.on('get_queue_status', () => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) return;
            
            if (queueManager.isInQueue(user.id)) {
                const position = queueManager.getQueuePosition(user.id);
                const total = queueManager.getQueueSize();
                
                socket.emit('queue_status', {
                    inQueue: true,
                    position: position,
                    total: total,
                    estimatedTime: position * 3
                });
            } else {
                socket.emit('queue_status', {
                    inQueue: false,
                    message: 'Siz navbatda emassiz'
                });
            }
            
        } catch (error) {
            console.error('❌ Get queue status error:', error);
        }
    });
};

function sendQueueUpdate(socket, userId) {
    if (!socket.connected) return;
    
    const interval = setInterval(() => {
        if (!socket.connected || !queueManager.isInQueue(userId)) {
            clearInterval(interval);
            return;
        }
        
        const position = queueManager.getQueuePosition(userId);
        const total = queueManager.getQueueSize();
        
        socket.emit('waiting_count', {
            count: total,
            position: position,
            estimatedTime: Math.max(5, position * 3)
        });
        
    }, 3000);
}

function tryQuickMatch(userId, socket, io, userManager, queueManager, matchmaking) {
    const opponentId = matchmaking.findQuickOpponent(userId);
    if (opponentId && queueManager.isInQueue(opponentId)) {
        // Remove both from queue
        queueManager.leaveQueue(userId);
        queueManager.leaveQueue(opponentId);
        
        // Create duel
        const duel = require('../modules/duels').prototype.createDuel(userId, opponentId);
        
        // Get users
        const user1 = userManager.getUser(userId);
        const user2 = userManager.getUser(opponentId);
        
        // Send duel started to both players
        if (user1.socketId) {
            io.to(user1.socketId).emit('duel_started', {
                duelId: duel.id,
                opponent: {
                    id: user2.id,
                    name: user2.firstName,
                    username: user2.username,
                    photo: user2.photoUrl,
                    rating: user2.rating,
                    matches: user2.matches,
                    level: user2.level,
                    gender: user2.gender,
                    bio: user2.bio || ''
                },
                timeLeft: 20
            });
        }
        
        if (user2.socketId) {
            io.to(user2.socketId).emit('duel_started', {
                duelId: duel.id,
                opponent: {
                    id: user1.id,
                    name: user1.firstName,
                    username: user1.username,
                    photo: user1.photoUrl,
                    rating: user1.rating,
                    matches: user1.matches,
                    level: user1.level,
                    gender: user1.gender,
                    bio: user1.bio || ''
                },
                timeLeft: 20
            });
        }
        
        console.log(`⚔️ Quick match created: ${user1.firstName} vs ${user2.firstName}`);
    }
}