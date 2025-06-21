import { Outlet, NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserIcon,
  BellIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import useSound from 'use-sound';
import notificationSound from '../assets/notification.mp3'; // Add your sound file

function Layout() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [playNotificationSound] = useSound(notificationSound);
  const [isMuted, setIsMuted] = useState(false);

  // Simulate receiving notifications
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        message: `New order #${Math.floor(Math.random() * 1000)}`,
        read: false,
        timestamp: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play sound if not muted
      if (!isMuted) {
        playNotificationSound();
      }
    }, 30000); // Every 30 seconds for demo

    return () => clearInterval(notificationInterval);
  }, [isMuted, playNotificationSound]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Notification Bell (Desktop) */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => document.getElementById('notification-dropdown').classList.toggle('hidden')}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          >
            <BellIcon className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          <div
            id="notification-dropdown"
            className="hidden absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50"
          >
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                >
                  <SpeakerWaveIcon className={`h-5 w-5 ${isMuted ? 'text-gray-400' : 'text-blue-500'}`} />
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm">{notification.message}</p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full self-center" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200">
        <nav className="flex justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-4 text-xs relative ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <HomeIcon className="h-6 w-6" />
            <span className="mt-1">Home</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-4 text-xs relative ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="mt-1">Orders</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </NavLink>

        </nav>
      </div>

      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200 mt-8 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Food Delivery App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;