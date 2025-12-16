// modules/chats.js - Chat management module
class ChatManager {
    constructor() {
        this.chats = new Map();
        this.userChats = new Map();
    }

    createChat(duelId, player1Id, player2Id) {
        const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const chat = {
            id: chatId,
            duelId: duelId,
            player1: player1Id,
            player2: player2Id,
            messages: [],
            startedAt: new Date(),
            lastActivity: new Date(),
            active: true
        };
        
        this.chats.set(chatId, chat);
        
        // Track user chats
        this.addUserChat(player1Id, chatId);
        this.addUserChat(player2Id, chatId);
        
        console.log(`💬 Chat created: ${chatId} (${player1Id} & ${player2Id})`);
        return chat;
    }

    addUserChat(userId, chatId) {
        if (!this.userChats.has(userId)) {
            this.userChats.set(userId, new Set());
        }
        this.userChats.get(userId).add(chatId);
    }

    removeUserChat(userId, chatId) {
        const userChats = this.userChats.get(userId);
        if (userChats) {
            userChats.delete(chatId);
            if (userChats.size === 0) {
                this.userChats.delete(userId);
            }
        }
    }

    getChat(chatId) {
        return this.chats.get(chatId);
    }

    getUserChats(userId) {
        const chatIds = this.userChats.get(userId);
        if (!chatIds) return [];
        
        return Array.from(chatIds)
            .map(chatId => this.chats.get(chatId))
            .filter(chat => chat && chat.active);
    }

    addMessage(chatId, senderId, message) {
        const chat = this.chats.get(chatId);
        if (!chat || !chat.active) return null;
        
        const messageObj = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            senderId: senderId,
            senderName: '', // Will be populated by sender
            message: message.trim(),
            timestamp: new Date()
        };
        
        chat.messages.push(messageObj);
        chat.lastActivity = new Date();
        
        console.log(`📨 Message in chat ${chatId}: ${message.substring(0, 30)}...`);
        return messageObj;
    }

    getMessages(chatId, limit = 50) {
        const chat = this.chats.get(chatId);
        if (!chat) return [];
        
        return chat.messages.slice(-limit);
    }

    endChat(chatId, reason = 'ended') {
        const chat = this.chats.get(chatId);
        if (chat && chat.active) {
            chat.active = false;
            chat.endedAt = new Date();
            chat.endReason = reason;
            
            // Remove from user chats
            this.removeUserChat(chat.player1, chatId);
            this.removeUserChat(chat.player2, chatId);
            
            console.log(`👋 Chat ended: ${chatId} (reason: ${reason})`);
            return chat;
        }
        return null;
    }

    removeChat(chatId) {
        const chat = this.chats.get(chatId);
        if (chat) {
            // Remove from user chats
            this.removeUserChat(chat.player1, chatId);
            this.removeUserChat(chat.player2, chatId);
            
            this.chats.delete(chatId);
            console.log(`🗑️ Chat removed: ${chatId}`);
            return chat;
        }
        return null;
    }

    getActiveChats() {
        return Array.from(this.chats.values()).filter(c => c.active).length;
    }

    getAllChats() {
        return Array.from(this.chats.values());
    }

    getPartnerId(chatId, userId) {
        const chat = this.chats.get(chatId);
        if (!chat) return null;
        
        return chat.player1 === userId ? chat.player2 : chat.player1;
    }

    cleanInactiveChats() {
        const now = new Date();
        let removed = 0;
        
        for (const [chatId, chat] of this.chats) {
            const inactiveTime = now - chat.lastActivity;
            if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
                this.endChat(chatId, 'inactivity');
                removed++;
            }
        }
        
        if (removed > 0) {
            console.log(`🧹 Cleaned ${removed} inactive chats`);
        }
        
        return removed;
    }
}

module.exports = ChatManager;