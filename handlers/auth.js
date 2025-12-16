// handlers/auth.js - Authentication socket handlers
module.exports = (socket, io, userManager) => {
    
    socket.on('auth', (data) => {
        try {
            console.log(`🔐 Auth request from: ${data.firstName || 'Unknown'}`);
            
            // Create or update user
            const user = userManager.createUser(data, socket.id);
            
            // Send auth response
            socket.emit('auth_ok', {
                ...user,
                message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
                serverTime: new Date().toISOString()
            });
            
            // Ask for gender if not selected
            if (!user.hasSelectedGender) {
                setTimeout(() => {
                    socket.emit('show_gender_selection', {
                        mandatory: true,
                        message: 'O\'yinni boshlash uchun jins tanlashingiz kerak'
                    });
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Auth error:', error);
            socket.emit('error', { message: 'Autentifikatsiya xatosi' });
        }
    });

    socket.on('select_gender', (data) => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            const updatedUser = userManager.updateUser(user.id, {
                gender: data.gender,
                hasSelectedGender: true
            });
            
            console.log(`🎯 Gender selected: ${updatedUser.firstName} -> ${data.gender}`);
            
            socket.emit('gender_selected', {
                gender: data.gender,
                hasSelectedGender: true,
                message: `Jins tanlandi! ${
                    data.gender === 'male' ? 'Faqat ayollar bilan duel' :
                    data.gender === 'female' ? 'Faqat erkaklar bilan duel' :
                    'Hamma bilan duel'
                }`
            });
            
        } catch (error) {
            console.error('❌ Gender selection error:', error);
            socket.emit('error', { message: 'Gender tanlash xatosi' });
        }
    });

    socket.on('update_profile', (data) => {
        try {
            const user = userManager.getUserBySocket(socket.id);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            const updates = {};
            if (data.firstName) updates.firstName = data.firstName;
            if (data.username) updates.username = data.username;
            if (data.bio !== undefined) updates.bio = data.bio;
            if (data.photoUrl) updates.photoUrl = data.photoUrl;
            
            const updatedUser = userManager.updateUser(user.id, updates);
            
            socket.emit('profile_updated', {
                user: updatedUser,
                message: 'Profil muvaffaqiyatli yangilandi!'
            });
            
            console.log(`📝 Profile updated: ${updatedUser.firstName}`);
            
        } catch (error) {
            console.error('❌ Update profile error:', error);
            socket.emit('error', { message: 'Profil yangilash xatosi' });
        }
    });
};
