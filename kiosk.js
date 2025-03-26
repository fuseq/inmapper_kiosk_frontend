
async function getDeviceIP() {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        console.log(data.ip);
        return data.ip;  
    } catch (error) {
        console.error("IP adresi alınamadı:", error);
        return null;
    }
}


async function loadKioskContent() {
    const ipAddress = await getDeviceIP();
    if (ipAddress) {
        try {
            const response = await fetch(`http://localhost:5000/kiosk?ip=${ipAddress}`);
            const data = await response.json();
            document.getElementById("kioskFrame").src = data.page;
        } catch (error) {
            console.error("Kiosk içeriği yüklenemedi:", error);
        }
    } else {
        console.error("IP adresi alınamadı. Kiosk içeriği yüklenemedi.");
    }
}


function hideLoadingMessage() {
    document.getElementById("loadingMessage").style.display = "none"; // Yüklenme mesajını gizle
}


loadKioskContent();
