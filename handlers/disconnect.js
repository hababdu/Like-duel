// handlers/disconnect.js - Disconnect socket handlers
module.exports = (socket, io, userManager, queueManager) => {
    
    socket.on('disconnect', () => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) {
                console.log(`❌ Disconnected (no auth): ${socket.id}`);
                return;
            }
            
            // Update user
            userManager.updateUser(user.id, {
                socketId: null,
                lastActive: new Date()
            });
            
            // Remove from queue
            if (queueManager.isInQueue(user.id)) {
                queueManager.leaveQueue(user.id);
                console.log(`🚪 ${user.firstName} disconnected from queue`);
            }
            
            console.log(`🔌 User disconnected: ${user.firstName} (${user.id})`);
            
        } catch (error) {
            console.error('❌ Disconnect error:', error);
        }
    });

    socket.on('reconnect', (data) => {
        try {
            const user = userManager.getUser(data.userId);
            if (user) {
                // Update socket ID
                userManager.updateSocket(user.id, socket.id);
                
                console.log(`🔄 User reconnected: ${user.firstName} (${user.id})`);
                
                socket.emit('reconnected', {
                    message: 'Qayta ulandingiz!',
                    user: user
                });
            }
            
        } catch (error) {
            console.error('❌ Reconnect error:', error);
        }
    });
};