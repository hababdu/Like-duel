self.addEventListener('push', (event) => {
  const data = event.data.json();
  const { title, body, icon, sound } = data;

  const options = {
    body,
    icon: icon || '/path/to/icon.png',
    data: { sound: sound || '/path/to/notification-sound.mp3' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Bildirishnoma bosilganda sayt ochiladi
  );
});

self.addEventListener('notification show', (event) => {
  const sound = event.notification.data.sound;
  if (sound) {
    const audio = new Audio(sound);
    audio.play();
  }
});