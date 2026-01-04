// chat.js faylini yarating
class EnhancedChatSystem {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.localStream = null;
        this.remoteStream = null;
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };
    }

    async startVoiceChat(partnerId) {
        try {
            // Notification yuborish
            window.socketManager?.sendVoiceChatInvite?.(partnerId);
            
            // Notification ko'rsatish
            window.showNotification?.("🎤 Ovozli chat taklifi", 
                "Raqibingizga ovozli chat taklifi yuborildi");
            
            // Kutish modalini ko'rsatish
            this.showVoiceChatWaitingModal();
            
        } catch (error) {
            console.error('Voice chat error:', error);
            window.showNotification?.("Xato", "Ovozli chatni boshlab bo'lmadi");
        }
    }

    async initVoiceChat(initiator = false) {
        try {
            // Local stream olish
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            
            // Peer connection yaratish
            this.peerConnection = new RTCPeerConnection(this.iceServers);
            
            // Local stream qo'shish
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            
            // Remote stream
            this.remoteStream = new MediaStream();
            
            this.peerConnection.ontrack = (event) => {
                event.streams[0].getTracks().forEach(track => {
                    this.remoteStream.addTrack(track);
                });
                
                // Audio element yaratish
                this.createAudioElement();
            };
            
            // Data channel yaratish (text chat uchun)
            if (initiator) {
                this.dataChannel = this.peerConnection.createDataChannel('chat');
                this.setupDataChannel();
            } else {
                this.peerConnection.ondatachannel = (event) => {
                    this.dataChannel = event.channel;
                    this.setupDataChannel();
                };
            }
            
            // ICE candidate
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    window.socketManager?.sendICECandidate?.(event.candidate);
                }
            };
            
            return this.peerConnection;
            
        } catch (error) {
            console.error('Voice init error:', error);
            return null;
        }
    }

    createAudioElement() {
        const audio = document.createElement('audio');
        audio.id = 'remoteAudio';
        audio.autoplay = true;
        audio.controls = true;
        audio.srcObject = this.remoteStream;
        audio.style.cssText = `
            width: 100%;
            margin: 10px 0;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
        `;
        
        const container = document.querySelector('.voice-chat-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(audio);
        }
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel ochildi');
            window.showNotification?.("✅ Ulanish", "Ovozli chatga ulandingiz");
        };
        
        this.dataChannel.onmessage = (event) => {
            console.log('Message:', event.data);
            // Chat messages
        };
    }

    showVoiceChatWaitingModal() {
        const modalHTML = `
            <div class="modal active" id="voiceChatWaitingModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="color: #fff;">🎤 Ovozli chat taklifi</h3>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 3rem; margin-bottom: 15px;">🔊</div>
                            <p style="color: #ccc;">Raqibingiz ovozli chatni qabul qilishni kutmoqda...</p>
                        </div>
                        
                        <div class="voice-chat-timer">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #ccc;">Kutish vaqti:</span>
                                <span style="color: #fff; font-weight: bold;" id="voiceTimer">30</span>
                            </div>
                            <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                <div id="voiceTimerBar" style="height: 100%; width: 100%; background: linear-gradient(90deg, #3498db, #2980b9); border-radius: 3px;"></div>
                            </div>
                        </div>
                        
                        <div class="voice-chat-controls" style="margin-top: 20px;">
                            <button class="modal-btn" onclick="enhancedChatSystem.cancelVoiceChat()" 
                                    style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                                <i class="fas fa-times"></i> Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.showModal?.(modalHTML);
        this.startVoiceChatTimer();
    }

    startVoiceChatTimer() {
        let timeLeft = 30;
        const timerBar = document.getElementById('voiceTimerBar');
        const timerText = document.getElementById('voiceTimer');
        
        if (!timerBar || !timerText) return;
        
        const timer = setInterval(() => {
            timeLeft--;
            
            timerText.textContent = timeLeft;
            timerBar.style.width = (timeLeft / 30 * 100) + '%';
            
            if (timeLeft <= 10) {
                timerBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.cancelVoiceChat();
            }
        }, 1000);
    }

    cancelVoiceChat() {
        // Close all connections
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Hide modal
        const modal = document.getElementById('voiceChatWaitingModal');
        if (modal) modal.remove();
        
        window.showNotification?.("❌ Bekor qilindi", "Ovozli chat taklifi bekor qilindi");
    }

    sendMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(message);
            return true;
        }
        return false;
    }

    showVoiceChatModal() {
        const modalHTML = `
            <div class="modal active" id="voiceChatModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="color: #fff;">🎤 Ovozli chat</h3>
                    </div>
                    <div class="modal-body">
                        <div class="voice-chat-container" style="margin-bottom: 20px;">
                            <!-- Audio will be inserted here -->
                        </div>
                        
                        <div class="voice-controls" style="display: flex; gap: 10px; justify-content: center;">
                            <button id="muteBtn" class="voice-btn" 
                                    style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button id="endCallBtn" class="voice-btn" 
                                    style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                                <i class="fas fa-phone-slash"></i>
                            </button>
                        </div>
                        
                        <div class="voice-chat-info" style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
                                <i class="fas fa-info-circle"></i> 
                                Ovozli chat vaqtida internet trafik ishlatiladi
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.showModal?.(modalHTML);
        
        // Event listeners
        document.getElementById('muteBtn')?.addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.getElementById('endCallBtn')?.addEventListener('click', () => {
            this.endVoiceChat();
        });
    }

    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                
                const btn = document.getElementById('muteBtn');
                if (btn) {
                    btn.innerHTML = audioTrack.enabled ? 
                        '<i class="fas fa-microphone"></i>' : 
                        '<i class="fas fa-microphone-slash"></i>';
                    btn.style.background = audioTrack.enabled ? 
                        'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' : 
                        'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
                }
            }
        }
    }

    endVoiceChat() {
        this.cancelVoiceChat();
        const modal = document.getElementById('voiceChatModal');
        if (modal) modal.remove();
    }
}

window.enhancedChatSystem = new EnhancedChatSystem();