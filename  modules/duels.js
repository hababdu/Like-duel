// modules/duels.js - Duel management module
class DuelManager {
    constructor() {
        this.duels = new Map();
        this.duelTimeouts = new Map();
    }

    createDuel(player1Id, player2Id) {
        const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const duel = {
            id: duelId,
            player1: player1Id,
            player2: player2Id,
            votes: {
                [player1Id]: null,
                [player2Id]: null
            },
            startedAt: new Date(),
            ended: false,
            result: null,
            chatRequests: {
                [player1Id]: false,
                [player2Id]: false
            }
        };
        
        this.duels.set(duelId, duel);
        
        // Set timeout (20 seconds)
        const timeout = setTimeout(() => {
            this.handleTimeout(duelId);
        }, 20000);
        
        this.duelTimeouts.set(duelId, timeout);
        
        console.log(`⚔️ Duel created: ${duelId} (${player1Id} vs ${player2Id})`);
        return duel;
    }

    getDuel(duelId) {
        return this.duels.get(duelId);
    }

    getDuelByPlayer(playerId) {
        for (const [duelId, duel] of this.duels) {
            if (duel.player1 === playerId || duel.player2 === playerId) {
                return duel;
            }
        }
        return null;
    }

    addVote(duelId, playerId, vote) {
        const duel = this.duels.get(duelId);
        if (!duel || duel.ended) return false;
        
        duel.votes[playerId] = vote;
        console.log(`🗳️ Vote in duel ${duelId}: ${playerId} -> ${vote}`);
        
        // Check if both voted
        const opponentId = duel.player1 === playerId ? duel.player2 : duel.player1;
        const opponentVote = duel.votes[opponentId];
        
        if (opponentVote !== null) {
            duel.ended = true;
            clearTimeout(this.duelTimeouts.get(duelId));
            this.duelTimeouts.delete(duelId);
            
            // Determine result
            const isMatch = (vote === 'like' || vote === 'super_like') && 
                           (opponentVote === 'like' || opponentVote === 'super_like');
            
            duel.result = {
                isMatch,
                votes: {
                    [playerId]: vote,
                    [opponentId]: opponentVote
                },
                determinedAt: new Date()
            };
            
            return { completed: true, result: duel.result };
        }
        
        return { completed: false };
    }

    handleTimeout(duelId) {
        const duel = this.duels.get(duelId);
        if (!duel || duel.ended) return;
        
        duel.ended = true;
        duel.result = {
            isMatch: false,
            timeout: true,
            votes: duel.votes,
            determinedAt: new Date()
        };
        
        this.duelTimeouts.delete(duelId);
        console.log(`⏰ Duel timeout: ${duelId}`);
        
        return duel;
    }

    endDuel(duelId) {
        const duel = this.duels.get(duelId);
        if (duel && !duel.ended) {
            duel.ended = true;
            clearTimeout(this.duelTimeouts.get(duelId));
            this.duelTimeouts.delete(duelId);
            return duel;
        }
        return null;
    }

    removeDuel(duelId) {
        const duel = this.duels.get(duelId);
        if (duel) {
            clearTimeout(this.duelTimeouts.get(duelId));
            this.duelTimeouts.delete(duelId);
            this.duels.delete(duelId);
            console.log(`🗑️ Duel removed: ${duelId}`);
            return duel;
        }
        return null;
    }

    getActiveDuels() {
        return Array.from(this.duels.values()).filter(d => !d.ended).length;
    }

    getAllDuels() {
        return Array.from(this.duels.values());
    }

    getPlayerDuels(playerId) {
        return Array.from(this.duels.values()).filter(d => 
            d.player1 === playerId || d.player2 === playerId
        );
    }

    requestChat(duelId, playerId) {
        const duel = this.duels.get(duelId);
        if (!duel || duel.ended) return false;
        
        duel.chatRequests[playerId] = true;
        
        // Check if both requested chat
        const opponentId = duel.player1 === playerId ? duel.player2 : duel.player1;
        if (duel.chatRequests[playerId] && duel.chatRequests[opponentId]) {
            return { bothRequested: true, duel };
        }
        
        return { bothRequested: false, duel };
    }
}

module.exports = DuelManager;
