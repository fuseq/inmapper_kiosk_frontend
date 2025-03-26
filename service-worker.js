const VERSION_URL = "http://localhost:5000/events"; // SSE endpoint'inin URL'si

self.addEventListener("install", (event) => {
    self.skipWaiting();
    console.log("Service Worker: Install event triggered.");
});

self.addEventListener("activate", (event) => {
    clients.claim();
    console.log("Service Worker: Activate event triggered. Starting to listen for version changes.");
    listenForVersionChanges(); // SSE ile versiyon dinlemeyi başlat
});

// SSE ile versiyon değişimini dinleme
function listenForVersionChanges() {
    console.log("Service Worker: Starting to listen for version changes via SSE.");
    const eventSource = new EventSource(VERSION_URL);

    eventSource.onopen = function() {
        console.log("Service Worker: SSE connection opened.");
    };

    eventSource.onmessage = function(event) {
        console.log("Service Worker: Message received from SSE:", event.data);
        const data = JSON.parse(event.data);
        console.log("Yeni versiyon bulundu:", data.version);

        // Yeni versiyon ile cache'i güncelle
        updateCacheAndNotifyClients(data.version);
    };

    eventSource.onerror = function(error) {
        console.error("Service Worker: SSE connection error!", error);
        eventSource.close(); // Bağlantı hatasında kapat
    };
}

// Cache güncelleme ve client'lara bildirim gönderme
async function updateCacheAndNotifyClients(newVersion) {
    const cache = await caches.open("kiosk-cache-v1");
    let cachedVersion = null;

    try {
        const cachedVersionResponse = await cache.match("/version");
        if (cachedVersionResponse && cachedVersionResponse.ok) {
            const cachedData = await cachedVersionResponse.json();
            cachedVersion = cachedData.version;
        }
    } catch (error) {
        console.error("Service Worker: Cache'ten versiyon bilgisi okunurken hata oluştu:", error);
    }

    if (cachedVersion !== newVersion) {
        console.log("Service Worker: Yeni versiyon tespit edildi, cache güncelleniyor...");

        // Eski cache'i temizleyin (dikkatli olun, tüm cache'i silmek yerine sadece versiyon bilgisini güncelleyebilirsiniz)
        // await caches.delete("kiosk-cache-v1");
        // console.log("Service Worker: Eski cache temizlendi.");

        // Yeni versiyon ile cache'i güncelle
        await cache.put("/version", new Response(JSON.stringify({ version: newVersion })));
        console.log("Service Worker: Cache'e yeni versiyon kaydedildi:", newVersion);

        // Tüm client'lara yeni versiyon bilgisini gönder
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                console.log("Service Worker: Yeni versiyon bilgisi client'a gönderiliyor.");
                client.postMessage({ type: 'version-update' });
            });
        });
    } else {
        console.log("Service Worker: Cache zaten güncel (", cachedVersion, "), yeni versiyon (", newVersion, ") ile aynı.");
    }
}