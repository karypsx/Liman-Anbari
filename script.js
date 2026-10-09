// Buraya Google Sheets CSV linkini yerləşdir.
const googleSheetsCSVLink = "SƏNİN_GOOGLE_SHEETS_CSV_LİNKİN_BURAYA";

let anbarData = [];
let scanner = null;
let scannerRunning = false;
let scanHandled = false;

const homeView = document.getElementById("home-view");
const scanView = document.getElementById("scan-view");
const resultView = document.getElementById("result-view");
const scanError = document.getElementById("scan-error");
const dataStatus = document.getElementById("data-status");

function showView(view) {
    homeView.hidden = view !== "home";
    scanView.hidden = view !== "scan";
    resultView.hidden = view !== "result";
    dataStatus.hidden = true;
}

// Cədvəl məlumatlarını arxa planda yüklə.
if (googleSheetsCSVLink && !googleSheetsCSVLink.includes("BURAYA") && window.Papa) {
    Papa.parse(googleSheetsCSVLink, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            anbarData = results.data || [];
            console.log("Anbar məlumatları yükləndi.");
        },
        error: function () {
            dataStatus.textContent = "Anbar məlumatlarını yükləmək mümkün olmadı. İnternet bağlantısını yoxlayın.";
            dataStatus.hidden = false;
        }
    });
}

async function stopScanner() {
    if (!scanner) return;

    try {
        if (scannerRunning) await scanner.stop();
    } catch (error) {
        console.warn("Kamera dayandırılarkən xəta:", error);
    }

    scannerRunning = false;
    try {
        scanner.clear();
    } catch (error) {
        // Skaner artıq təmizlənibsə, davam et.
    }
    scanner = null;
}

async function startScan() {
    scanHandled = false;
    scanError.hidden = true;
    scanError.textContent = "";
    showView("scan");

    // Skaner görünən olduqdan sonra kameranı başladırıq.
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
        if (!window.Html5Qrcode) throw new Error("QR skaner kitabxanası yüklənmədi.");

        scanner = new Html5Qrcode("reader", {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false
        });

        await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
            onScanSuccess,
            function () { /* Kod tapılana qədər skan etməyə davam et. */ }
        );
        scannerRunning = true;
    } catch (error) {
        scannerRunning = false;
        scanError.textContent = "Arxa kameranı açmaq mümkün olmadı. Kamera icazəsini yoxlayıb yenidən cəhd edin.";
        scanError.hidden = false;
        console.error(error);
    }
}

async function onScanSuccess(decodedText) {
    if (scanHandled) return;
    scanHandled = true;

    const ref = decodedText.trim();
    await stopScanner();
    renderResult(ref);
    showView("result");
}

function renderResult(ref) {
    document.getElementById("ref-title").textContent = "Rəf: " + ref;
    const listContainer = document.getElementById("product-list");
    listContainer.replaceChildren();

    const found = anbarData.filter(item => (item["Rəf"] || "").trim() === ref);
    if (found.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-result";
        empty.textContent = anbarData.length === 0
            ? "Cədvəl məlumatları yüklənməyib. Google Sheets CSV linkini yoxlayın."
            : "Bu rəfdə heç bir mal tapılmadı.";
        listContainer.appendChild(empty);
        return;
    }

    found.forEach(item => {
        const row = document.createElement("li");
        row.className = "product-row";

        const name = document.createElement("strong");
        name.textContent = item["Malın Adı"] || "Adsız mal";

        const count = document.createElement("span");
        count.className = "count-badge";
        count.textContent = "Say: " + (item["Say"] || "0");

        row.append(name, count);
        listContainer.appendChild(row);
    });
}

async function returnHome() {
    await stopScanner();
    scanHandled = false;
    showView("home");
}

document.getElementById("start-scan").addEventListener("click", startScan);
document.getElementById("cancel-scan").addEventListener("click", returnHome);
document.getElementById("return-home").addEventListener("click", returnHome);
