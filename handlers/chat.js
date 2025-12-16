// handlers/chat.js - Chat socket handlers
module.exports = (socket, io, userManager, chatManager) => {
    
    socket.on('send_chat_message', (data) => {
        try {
            const { chatId, message } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!chatId || !user || !message?.trim()) {
                socket.emit('error', { message: 'Chat ID, foydalanuvchi yoki xabar yo\'q' });
                return;
            }
            
            const chat = chatManager.getChat(chatId);
            if (!chat || !chat.active) {
                socket.emit('error', { message: 'Chat topilmadi yoki faol emas' });
                return;
            }
            
            // Add message
            const messageObj = chatManager.addMessage(chatId, user.id, message);
            if (!messageObj) return;
            
            // Add sender name
            messageObj.senderName = user.firstName;
            
            // Send to sender
            socket.emit('chat_message_sent', {
                chatId: chatId,
                message: messageObj
            });
            
            // Send to receiver
            const opponentId = chat.player1 === user.id ? chat.player2 : chat.player1;
            const opponent = userManager.getUser(opponentId);
            
            if (opponent?.socketId) {
                io.to(opponent.socketId).emit('chat_message_received', {
                    chatId: chatId,
                    message: messageObj
                });
            }
            
            console.log(`📨 ${user.firstName} -> ${message.substring(0, 30)}...`);
            
        } catch (error) {
            console.error('❌ Send chat message error:', error);
            socket.emit('error', { message: 'Xabar yuborish xatosi' });
        }
    });

    socket.on('leave_chat', (data) => {
        try {
            const { chatId } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!chatId || !user) return;
            
            const chat = chatManager.getChat(chatId);
            if (!chat) return;
            
            // End chat
            const endedChat = chatManager.endChat(chatId, 'left');
            if (!endedChat) return;
            
            // Notify opponent
            const opponentId = chat.player1 === user.id ? chat.player2 : chat.player1;
            const opponent = userManager.getUser(opponentId);
            
            if (opponent?.socketId) {
                io.to(opponent.socketId).emit('chat_ended', {
                    by: user.firstName,
                    reason: 'left',
                    chatId: chatId
                });
            }
            
            // Return to queue
            require('./queue').prototype.returnToQueue([chat.player1, chat.player2]);
            
            console.log(`👋 ${user.firstName} left chat ${chatId.substr(0, 10)}...`);
            
        } catch (error) {
            console.error('❌ Leave chat error:', error);
        }
    });

    socket.on('get_chat_messages', (data) => {
        try {
            const { chatId } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!chatId || !user) {
                socket.emit('error', { message: 'Chat ID yoki foydalanuvchi yo\'q' });
                return;
            }
            
            const chat = chatManager.getChat(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat topilmadi' });
                return;
            }
            
            // Check if user is in this chat
            if (chat.player1 !== user.id && chat.player2 !== user.id) {
                socket.emit('error', { message: 'Siz bu chatda emassiz' });
                return;
            }
            
            const messages = chatManager.getMessages(chatId, 50);
            
            socket.emit('chat_messages', {
                chatId: chatId,
                messages: messages,
                partnerId: chat.player1 === user.id ? chat.player2 : chat.player1
            });
            
        } catch (error) {
            console.error('❌ Get chat messages error:', error);
            socket.emit('error', { message: 'Chat xabarlarini olish xatosi' });
        }
    });

    socket.on('get_active_chats', () => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) return;
            
            const chats = chatManager.getUserChats(user.id);
            
            socket.emit('active_chats', {
                chats: chats.map(chat => ({
                    id: chat.id,
                    partnerId: chat.player1 === user.id ? chat.player2 : chat.player1,
                    startedAt: chat.startedAt,
                    lastActivity: chat.lastActivity,
                    messageCount: chat.messages.length
                }))
            });
            
        } catch (error) {
            console.error('❌ Get active chats error:', error);
        }
    });
};