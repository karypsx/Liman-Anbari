// Buraya Google Sheets-də "Anbar Qalığı" vərəqinin CSV linkini yerləşdir.
const googleSheetsCSVLink = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRQEdxU0-ynOkMOnAxPNIzDgjmlkt1bGtsOpciw6FVMbqpAmZji7Uy9scU5buOSA/pub?gid=2100305226&single=true&output=csv";

let anbarData = [];
let scanner = null;
let scannerRunning = false;
let scanHandled = false;

const homeView = document.getElementById("home-view");
const scanView = document.getElementById("scan-view");
const resultView = document.getElementById("result-view");
const distributionView = document.getElementById("distribution-view");
const scanError = document.getElementById("scan-error");
const dataStatus = document.getElementById("data-status");
const menuToggle = document.getElementById("menu-toggle");
const appMenu = document.getElementById("app-menu");

function closeMenu() {
    appMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menyunu aç");
}

menuToggle.addEventListener("click", function () {
    const opening = appMenu.hidden;
    appMenu.hidden = !opening;
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Menyunu bağla" : "Menyunu aç");
});

appMenu.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-menu-view]");
    if (!button) return;
    await stopScanner();
    scanHandled = false;
    showView(button.dataset.menuView);
    closeMenu();
});

document.addEventListener("click", function (event) {
    if (!event.target.closest(".app-menu-wrap")) closeMenu();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
});

function showView(view) {
    homeView.hidden = view !== "home";
    scanView.hidden = view !== "scan";
    resultView.hidden = view !== "result";
    distributionView.hidden = view !== "distribution";
    dataStatus.hidden = true;
}

function normalizeCell(value) {
    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("az-AZ");
}

function getInventoryRows(rows) {
    // Anbar Qalığı vərəqində başlıq cədvəlin əvvəlində deyil; onu adı ilə tapırıq.
    const headerIndex = rows.findIndex(row => {
        if (!Array.isArray(row)) return false;
        const cells = row.map(normalizeCell);
        return cells.some(value => value === "malın adı və təsviri" || value === "malın adı")
            && cells.some(value => value === "cari qalıq" || value === "say")
            && cells.some(value => value === "rəflər" || value === "rəf");
    });

    if (headerIndex < 0) {
        return { data: [], error: "CSV-də Malın Adı və Təsviri, Cari Qalıq və Rəflər başlıqları tapılmadı." };
    }

    const headers = rows[headerIndex].map(normalizeCell);
    const nameIndex = headers.findIndex(value => value === "malın adı və təsviri" || value === "malın adı");
    const quantityIndex = headers.findIndex(value => value === "cari qalıq" || value === "say");
    const shelfIndex = headers.findIndex(value => value === "rəflər" || value === "rəf");

    const data = rows.slice(headerIndex + 1)
        .filter(Array.isArray)
        .map(row => ({
            "Rəf": String(row[shelfIndex] ?? "").trim(),
            "Malın Adı": String(row[nameIndex] ?? "").trim(),
            "Say": String(row[quantityIndex] ?? "").trim()
        }))
        .filter(item => item["Malın Adı"] !== "");

    return { data, error: "" };
}

// Cədvəl məlumatlarını arxa planda yüklə.
if (googleSheetsCSVLink && !googleSheetsCSVLink.includes("BURAYA") && window.Papa) {
    Papa.parse(googleSheetsCSVLink, {
        download: true,
        header: false,
        skipEmptyLines: false,
        complete: function (results) {
            const parsed = getInventoryRows(results.data || []);
            anbarData = parsed.data;
            if (parsed.error) {
                dataStatus.textContent = parsed.error;
                dataStatus.hidden = false;
                return;
            }
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
document.getElementById("distribution-home").addEventListener("click", returnHome);

const splashScreen = document.getElementById("splash-screen");
if (splashScreen) {
    splashScreen.addEventListener("animationend", function (event) {
        if (event.animationName === "splashExit") splashScreen.remove();
    });
}
