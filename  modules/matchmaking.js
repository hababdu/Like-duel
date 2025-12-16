// modules/matchmaking.js - Matchmaking algorithm
class Matchmaking {
    constructor(userManager, queueManager, duelManager) {
        this.userManager = userManager;
        this.queueManager = queueManager;
        this.duelManager = duelManager;
        this.matchmakingInterval = null;
    }

    startMatchmaking(interval = 5000) {
        if (this.matchmakingInterval) {
            clearInterval(this.matchmakingInterval);
        }
        
        this.matchmakingInterval = setInterval(() => {
            this.processQueue();
        }, interval);
        
        console.log('🔍 Matchmaking started');
    }

    stopMatchmaking() {
        if (this.matchmakingInterval) {
            clearInterval(this.matchmakingInterval);
            this.matchmakingInterval = null;
            console.log('🛑 Matchmaking stopped');
        }
    }

    processQueue() {
        const queueSize = this.queueManager.getQueueSize();
        if (queueSize < 2) return 0;
        
        console.log(`🔍 Processing queue (${queueSize} users)...`);
        
        const queue = this.queueManager.getQueueList();
        const matchedPairs = [];
        const processed = new Set();
        
        for (const userId of queue) {
            if (processed.has(userId)) continue;
            
            const opponentId = this.findOpponent(userId, queue, processed);
            if (opponentId) {
                matchedPairs.push([userId, opponentId]);
                processed.add(userId);
                processed.add(opponentId);
                
                // Limit to 5 matches per cycle
                if (matchedPairs.length >= 5) break;
            }
        }
        
        // Create duels for matched pairs
        matchedPairs.forEach(([player1, player2]) => {
            this.queueManager.leaveQueue(player1);
            this.queueManager.leaveQueue(player2);
            
            const duel = this.duelManager.createDuel(player1, player2);
            console.log(`✅ Match found: ${player1} vs ${player2} (duel: ${duel.id})`);
        });
        
        if (matchedPairs.length > 0) {
            console.log(`🎯 ${matchedPairs.length} matches created`);
        }
        
        return matchedPairs.length;
    }

    findOpponent(userId, queue, processed) {
        const user = this.userManager.getUser(userId);
        if (!user || !user.gender) return null;
        
        let bestMatch = null;
        let bestScore = -Infinity;
        
        for (const opponentId of queue) {
            if (opponentId === userId || processed.has(opponentId)) continue;
            
            const opponent = this.userManager.getUser(opponentId);
            if (!opponent || !opponent.gender) continue;
            
            // Check gender compatibility
            if (!this.checkGenderCompatibility(user, opponent)) continue;
            
            // Calculate match score
            const score = this.calculateMatchScore(user, opponent);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = opponentId;
            }
        }
        
        return bestMatch;
    }

    checkGenderCompatibility(user1, user2) {
        if (!user1.gender || !user2.gender) return false;
        
        if (user1.gender === 'not_specified' || user2.gender === 'not_specified') {
            return true;
        }
        
        return user1.gender !== user2.gender;
    }

    calculateMatchScore(user1, user2) {
        let score = 0;
        
        // Rating difference (closer is better)
        const ratingDiff = Math.abs(user1.rating - user2.rating);
        score += Math.max(0, 1000 - ratingDiff);
        
        // Level difference (closer is better)
        const levelDiff = Math.abs(user1.level - user2.level);
        score += Math.max(0, 500 - (levelDiff * 10));
        
        // Previous match history
        const history = this.userManager.getOpponentHistory(user1.id, user2.id);
        if (history) {
            if (history.match) {
                score += 200; // Previous match bonus
            } else if (history.myVote === 'like' && history.opponentVote === 'skip') {
                score += 100; // User liked before
            } else if (history.myVote === 'skip' && history.opponentVote === 'like') {
                score += 50; // Opponent liked before
            }
        }
        
        // Activity score (more active users get priority)
        const user1Activity = new Date() - user1.lastActive;
        const user2Activity = new Date() - user2.lastActive;
        
        score += Math.max(0, 300 - (user1Activity / 1000));
        score += Math.max(0, 300 - (user2Activity / 1000));
        
        return score;
    }

    findQuickOpponent(userId) {
        const user = this.userManager.getUser(userId);
        if (!user || !user.gender) return null;
        
        const queue = this.queueManager.getQueueList();
        
        for (const opponentId of queue) {
            if (opponentId === userId) continue;
            
            const opponent = this.userManager.getUser(opponentId);
            if (!opponent || !opponent.gender) continue;
            
            if (this.checkGenderCompatibility(user, opponent)) {
                return opponentId;
            }
        }
        
        return null;
    }

    getQueueStats() {
        const queue = this.queueManager.getQueueList();
        const stats = {
            total: queue.length,
            byGender: {
                male: 0,
                female: 0,
                unspecified: 0
            },
            averageRating: 0,
            estimatedWaitTime: queue.length * 3 // 3 seconds per person
        };
        
        let totalRating = 0;
        
        queue.forEach(userId => {
            const user = this.userManager.getUser(userId);
            if (user) {
                totalRating += user.rating;
                
                if (user.gender === 'male') stats.byGender.male++;
                else if (user.gender === 'female') stats.byGender.female++;
                else stats.byGender.unspecified++;
            }
        });
        
        stats.averageRating = queue.length > 0 ? Math.round(totalRating / queue.length) : 0;
        
        return stats;
    }
}

module.exports = Matchmaking;