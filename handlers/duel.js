// handlers/duel.js - Duel socket handlers
module.exports = (socket, io, userManager, duelManager) => {
    
    socket.on('vote', (data) => {
        try {
            const { duelId, choice } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!duelId || !user) {
                socket.emit('error', { message: 'Duel ID yoki foydalanuvchi topilmadi' });
                return;
            }
            
            const duel = duelManager.getDuel(duelId);
            if (!duel || duel.ended) {
                socket.emit('error', { message: 'Duel topilmadi yoki tugagan' });
                return;
            }
            
            // Check super like limit
            if (choice === 'super_like' && user.dailySuperLikes <= 0) {
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                return;
            }
            
            // Add vote
            const result = duelManager.addVote(duelId, user.id, choice);
            
            if (result.completed) {
                // Process duel result
                processDuelResult(duelId, io, userManager, duelManager);
            } else {
                socket.emit('vote_registered');
            }
            
            console.log(`🗳️ ${user.firstName} voted: ${choice} in duel ${duelId.substr(0, 10)}...`);
            
        } catch (error) {
            console.error('❌ Vote error:', error);
            socket.emit('error', { message: 'Ovoz berish xatosi' });
        }
    });

    socket.on('chat_request', (data) => {
        try {
            const { duelId } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!duelId || !user) {
                socket.emit('error', { message: 'Duel ID yoki foydalanuvchi topilmadi' });
                return;
            }
            
            const result = duelManager.requestChat(duelId, user.id);
            
            if (result.bothRequested) {
                // Both requested chat - create chat
                const chat = require('../modules/chats').prototype.createChat(
                    duelId,
                    result.duel.player1,
                    result.duel.player2
                );
                
                // Get players
                const player1 = userManager.getUser(result.duel.player1);
                const player2 = userManager.getUser(result.duel.player2);
                
                // Notify both players
                if (player1.socketId) {
                    io.to(player1.socketId).emit('chat_started', {
                        chatId: chat.id,
                        partner: {
                            id: player2.id,
                            name: player2.firstName,
                            username: player2.username,
                            photo: player2.photoUrl,
                            gender: player2.gender,
                            bio: player2.bio || ''
                        }
                    });
                }
                
                if (player2.socketId) {
                    io.to(player2.socketId).emit('chat_started', {
                        chatId: chat.id,
                        partner: {
                            id: player1.id,
                            name: player1.firstName,
                            username: player1.username,
                            photo: player1.photoUrl,
                            gender: player1.gender,
                            bio: player1.bio || ''
                        }
                    });
                }
                
                // Remove duel
                duelManager.removeDuel(duelId);
                
                console.log(`💬 Chat created from duel ${duelId.substr(0, 10)}...`);
                
            } else {
                // Only one requested - notify opponent
                const opponentId = result.duel.player1 === user.id ? result.duel.player2 : result.duel.player1;
                const opponent = userManager.getUser(opponentId);
                
                if (opponent?.socketId) {
                    io.to(opponent.socketId).emit('chat_request_received', {
                        from: user.id,
                        name: user.firstName,
                        duelId: duelId
                    });
                }
                
                socket.emit('chat_request_sent', {
                    message: 'Chat so\'rovi yuborildi'
                });
            }
            
        } catch (error) {
            console.error('❌ Chat request error:', error);
            socket.emit('error', { message: 'Chat so\'rovi xatosi' });
        }
    });

    socket.on('skip_chat', (data) => {
        try {
            const { duelId } = data;
            const user = userManager.getUserBySocket(socket.id);
            
            if (!duelId || !user) return;
            
            const duel = duelManager.getDuel(duelId);
            if (!duel) return;
            
            // End duel and return to queue
            duelManager.endDuel(duelId);
            
            const opponentId = duel.player1 === user.id ? duel.player2 : duel.player1;
            const opponent = userManager.getUser(opponentId);
            
            // Notify opponent
            if (opponent?.socketId) {
                io.to(opponent.socketId).emit('chat_skipped', {
                    by: user.firstName,
                    duelId: duelId
                });
            }
            
            // Return both to queue
            require('./queue').prototype.returnToQueue([duel.player1, duel.player2]);
            
            console.log(`🚪 ${user.firstName} skipped chat for duel ${duelId.substr(0, 10)}...`);
            
        } catch (error) {
            console.error('❌ Skip chat error:', error);
        }
    });
};

function processDuelResult(duelId, io, userManager, duelManager) {
    const duel = duelManager.getDuel(duelId);
    if (!duel || !duel.result) return;
    
    const player1 = userManager.getUser(duel.player1);
    const player2 = userManager.getUser(duel.player2);
    
    if (!player1 || !player2) {
        duelManager.removeDuel(duelId);
        return;
    }
    
    const vote1 = duel.result.votes[duel.player1];
    const vote2 = duel.result.votes[duel.player2];
    
    console.log(`🏁 Duel result ${duelId.substr(0, 10)}...: ${player1.firstName}(${vote1}) vs ${player2.firstName}(${vote2})`);
    
    if (duel.result.isMatch) {
        // MATCH
        sendMatchResult(duel, player1, player2, io);
        
        // Update user stats
        updateUserStats(player1, player2, true, vote1, vote2);
        
        // Add to history
        userManager.addOpponentHistory(player1.id, player2.id, vote1, vote2);
        userManager.addOpponentHistory(player2.id, player1.id, vote2, vote1);
        
    } else if (vote1 === 'like' || vote1 === 'super_like') {
        // Only player1 liked
        sendSingleLikeResult(duel, player1, player2, vote1, vote2, io);
        updateUserStats(player1, player2, false, vote1, vote2);
        
    } else if (vote2 === 'like' || vote2 === 'super_like') {
        // Only player2 liked
        sendSingleLikeResult(duel, player2, player1, vote2, vote1, io);
        updateUserStats(player2, player1, false, vote2, vote1);
        
    } else {
        // No likes
        sendNoMatchResult(duel, player1, player2, vote1, vote2, io);
        player1.duels++;
        player2.duels++;
    }
    
    // Remove duel after delay
    setTimeout(() => {
        duelManager.removeDuel(duelId);
        
        // Return to queue if not in chat
        if (!duel.result.isMatch || (vote1 === 'skip' && vote2 === 'skip')) {
            require('./queue').prototype.returnToQueue([duel.player1, duel.player2]);
        }
    }, 3000);
}

function sendMatchResult(duel, player1, player2, io) {
    const rewards = { coins: 50, xp: 30 };
    
    if (player1.socketId) {
        io.to(player1.socketId).emit('match', {
            duelId: duel.id,
            partner: {
                id: player2.id,
                name: player2.firstName,
                username: player2.username,
                photo: player2.photoUrl,
                gender: player2.gender,
                bio: player2.bio || ''
            },
            rewards: rewards,
            newRating: player1.rating + 20,
            isRematch: false,
            mutualLike: true
        });
    }
    
    if (player2.socketId) {
        io.to(player2.socketId).emit('match', {
            duelId: duel.id,
            partner: {
                id: player1.id,
                name: player1.firstName,
                username: player1.username,
                photo: player1.photoUrl,
                gender: player1.gender,
                bio: player1.bio || ''
            },
            rewards: rewards,
            newRating: player2.rating + 20,
            isRematch: false,
            mutualLike: true
        });
    }
}

function sendSingleLikeResult(duel, voter, opponent, voterVote, opponentVote, io) {
    const rewards = { coins: 10, xp: 5 };
    
    if (voter.socketId) {
        io.to(voter.socketId).emit('liked_only', {
            opponentName: opponent.firstName,
            reward: rewards,
            yourVote: voterVote,
            opponentVote: opponentVote,
            duelId: duel.id
        });
    }
    
    if (opponent.socketId) {
        io.to(opponent.socketId).emit('no_match', {
            yourVote: opponentVote,
            opponentVote: voterVote,
            duelId: duel.id
        });
    }
}

function sendNoMatchResult(duel, player1, player2, vote1, vote2, io) {
    if (player1.socketId) {
        io.to(player1.socketId).emit('no_match', {
            yourVote: vote1,
            opponentVote: vote2,
            duelId: duel.id
        });
    }
    
    if (player2.socketId) {
        io.to(player2.socketId).emit('no_match', {
            yourVote: vote2,
            opponentVote: vote1,
            duelId: duel.id
        });
    }
}

function updateUserStats(voter, opponent, isMatch, voterVote, opponentVote) {
    voter.duels++;
    opponent.duels++;
    
    if (isMatch) {
        voter.matches++;
        opponent.matches++;
        voter.wins++;
        opponent.wins++;
        voter.coins += 50;
        opponent.coins += 50;
        voter.rating += 20;
        opponent.rating += 20;
    } else if (voterVote === 'like' || voterVote === 'super_like') {
        voter.coins += 10;
    }
    
    // Deduct super like
    if (voterVote === 'super_like') {
        voter.dailySuperLikes = Math.max(0, voter.dailySuperLikes - 1);
    }
    
    // Update last active
    voter.lastActive = new Date();
    opponent.lastActive = new Date();
}