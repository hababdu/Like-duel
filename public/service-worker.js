self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const { title = 'Yangi bildirishnoma', body = 'Yangilanish mavjud', icon, sound, url } = data;

  // Bildirishnoma ko‘rsatish
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: url || '/', sound: sound || '/notification.mp3' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('notification', (event) => {
  const sound = event.notification.data.sound;
  if (sound) {
    const audio = new Audio(sound);
    audio.play().catch((error) => console.error('Ovoz o‘ynatishda xato:', error));
  }
});