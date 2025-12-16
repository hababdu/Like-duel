// modules/users.js - User management module
class UserManager {
    constructor() {
        this.users = new Map();
        this.userSockets = new Map();
    }

    createUser(data, socketId) {
        const userId = data.userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const user = {
            id: userId,
            firstName: data.firstName || 'Foydalanuvchi',
            username: data.username || '',
            photoUrl: data.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            gender: data.gender || null,
            hasSelectedGender: data.hasSelectedGender || false,
            socketId: socketId,
            rating: data.rating || 1500,
            level: data.level || 1,
            matches: data.matches || 0,
            duels: data.duels || 0,
            wins: data.wins || 0,
            coins: data.coins || 100,
            dailySuperLikes: 3,
            bio: data.bio || '',
            joinedAt: new Date(),
            lastActive: new Date(),
            previousOpponents: new Map()
        };
        
        this.users.set(userId, user);
        this.userSockets.set(socketId, userId);
        
        console.log(`👤 User created: ${user.firstName} (${userId})`);
        return user;
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getUserBySocket(socketId) {
        const userId = this.userSockets.get(socketId);
        return userId ? this.users.get(userId) : null;
    }

    updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (user) {
            Object.assign(user, updates);
            user.lastActive = new Date();
            return user;
        }
        return null;
    }

    updateSocket(userId, socketId) {
        const user = this.users.get(userId);
        if (user) {
            // Remove old socket mapping
            if (user.socketId) {
                this.userSockets.delete(user.socketId);
            }
            
            user.socketId = socketId;
            user.lastActive = new Date();
            this.userSockets.set(socketId, userId);
            
            return user;
        }
        return null;
    }

    removeUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            if (user.socketId) {
                this.userSockets.delete(user.socketId);
            }
            this.users.delete(userId);
            console.log(`🗑️ User removed: ${user.firstName} (${userId})`);
            return user;
        }
        return null;
    }

    cleanInactiveUsers() {
        const now = new Date();
        let removed = 0;
        
        for (const [userId, user] of this.users) {
            const inactiveTime = now - user.lastActive;
            if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
                this.removeUser(userId);
                removed++;
            }
        }
        
        if (removed > 0) {
            console.log(`🧹 Cleaned ${removed} inactive users`);
        }
        
        return removed;
    }

    getTotalUsers() {
        return this.users.size;
    }

    getActiveUsers() {
        return Array.from(this.users.values()).filter(u => u.socketId).length;
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    addOpponentHistory(userId, opponentId, myVote, opponentVote) {
        const user = this.users.get(userId);
        if (user) {
            user.previousOpponents.set(opponentId, {
                myVote,
                opponentVote,
                timestamp: new Date(),
                match: (myVote === 'like' || myVote === 'super_like') && 
                       (opponentVote === 'like' || opponentVote === 'super_like')
            });
            return true;
        }
        return false;
    }

    getOpponentHistory(userId, opponentId) {
        const user = this.users.get(userId);
        return user ? user.previousOpponents.get(opponentId) : null;
    }
}

module.exports = UserManager;