// modules/queue.js - Queue management module
class QueueManager {
    constructor() {
        this.queue = new Set();
        this.queueTimers = new Map();
    }

    joinQueue(userId) {
        if (!this.queue.has(userId)) {
            this.queue.add(userId);
            console.log(`🚀 User joined queue: ${userId}`);
            
            // Set timeout for queue (10 minutes)
            const timer = setTimeout(() => {
                if (this.queue.has(userId)) {
                    this.leaveQueue(userId);
                    console.log(`⏰ Queue timeout for user: ${userId}`);
                }
            }, 10 * 60 * 1000);
            
            this.queueTimers.set(userId, timer);
            return true;
        }
        return false;
    }

    leaveQueue(userId) {
        if (this.queue.has(userId)) {
            this.queue.delete(userId);
            
            // Clear timer
            const timer = this.queueTimers.get(userId);
            if (timer) {
                clearTimeout(timer);
                this.queueTimers.delete(userId);
            }
            
            console.log(`🚪 User left queue: ${userId}`);
            return true;
        }
        return false;
    }

    isInQueue(userId) {
        return this.queue.has(userId);
    }

    getQueueSize() {
        return this.queue.size;
    }

    getQueuePosition(userId) {
        if (!this.queue.has(userId)) return -1;
        return Array.from(this.queue).indexOf(userId) + 1;
    }

    getQueueList() {
        return Array.from(this.queue);
    }

    clearQueue() {
        const size = this.queue.size;
        
        // Clear all timers
        for (const timer of this.queueTimers.values()) {
            clearTimeout(timer);
        }
        
        this.queue.clear();
        this.queueTimers.clear();
        
        console.log(`🧹 Queue cleared (${size} users removed)`);
        return size;
    }

    getQueueStats() {
        return {
            size: this.queue.size,
            users: Array.from(this.queue),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = QueueManager;