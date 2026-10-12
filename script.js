// Buraya Google Sheets-də "Anbar Qalığı" vərəqinin CSV linkini yerləşdir.
const googleSheetsCSVLink = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfCMNK83THtC25qXuflEhQlBJkBydNhc2HiO9-mMxoaUwc_L_-DOmGMBuhziArtQ/pub?gid=493222049&single=true&output=csv";
// Yalnız yayımlanmış Paylanma Jurnalı vərəqinin oxu linkidir.
const distributionPublicCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQ8IkV-no07gBJ5lYIbw6Z08grP5x6yDNEyIEHcuFcogn6adp_j-gCFdYfNjWK4sGPirROqeHIbkUN/pub?gid=1515607991&single=true&output=csv";

let anbarData = [];
let scanner = null;
let scannerRunning = false;
let scanHandled = false;

const homeView = document.getElementById("home-view");
const scanView = document.getElementById("scan-view");
const resultView = document.getElementById("result-view");
const distributionView = document.getElementById("distribution-view");
const aboutView = document.getElementById("about-view");
const distributionStatus = document.getElementById("distribution-status");
const distributionResults = document.getElementById("distribution-results");
const distributionList = document.getElementById("distribution-list");
const distributionRefreshButton = document.getElementById("refresh-distribution");
const issueGoodsButton = document.getElementById("issue-goods");
const actionToast = document.getElementById("action-toast");
let actionToastTimer;
const scanError = document.getElementById("scan-error");
const dataStatus = document.getElementById("data-status");
const menuToggle = document.getElementById("menu-toggle");
const appMenu = document.getElementById("app-menu");
const menuBackdrop = document.getElementById("menu-backdrop");
document.body.classList.add("home-screen");

// Tətbiq daxilində mətnin seçilib köçürülməsini və kontekst menyusunu bağla.
["copy", "cut", "contextmenu", "selectstart", "dragstart"].forEach(eventName => {
    document.addEventListener(eventName, event => event.preventDefault());
});

function closeMenu() {
    appMenu.hidden = true;
    menuBackdrop.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menyunu aç");
}

menuToggle.addEventListener("click", function () {
    const opening = appMenu.hidden;
    appMenu.hidden = !opening;
    menuBackdrop.hidden = !opening;
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Menyunu bağla" : "Menyunu aç");
});

menuBackdrop.addEventListener("click", closeMenu);

appMenu.addEventListener("click", function (event) {
    const button = event.target.closest("[data-menu-view]");
    if (!button) return;
    scanHandled = false;
    void stopScanner();
    const targetView = button.dataset.menuView;
    showView(targetView);
    closeMenu();
    if (targetView === "distribution") loadDistributionJournal();
});

document.addEventListener("click", function (event) {
    if (!event.target.closest(".app-menu-wrap")) closeMenu();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
});

function showView(view) {
    document.body.classList.toggle("home-screen", view === "home");
    homeView.hidden = view !== "home";
    scanView.hidden = view !== "scan";
    resultView.hidden = view !== "result";
    distributionView.hidden = view !== "distribution";
    aboutView.hidden = view !== "about";
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
document.getElementById("about-home").addEventListener("click", returnHome);
function showDistributionError(message) {
    distributionStatus.textContent = message;
    distributionStatus.classList.add("journal-status-error");
}

async function loadDistributionJournal() {
    const csvUrl = distributionPublicCsvUrl;
    distributionStatus.classList.remove("journal-status-error");
    distributionStatus.textContent = "Paylama jurnalı yüklənir…";
    distributionResults.hidden = true;
    if (!csvUrl || !window.Papa) {
        showDistributionError("Paylama jurnalı bağlantısı qurulmayıb.");
        return;
    }
    try {
        const response = await fetch(csvUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Jurnal linkindən məlumat almaq olmadı.");
        const csvText = await response.text();
        const parsed = Papa.parse(csvText, { header: false, skipEmptyLines: false });
        if (parsed.errors?.length && !parsed.data?.length) throw new Error("Jurnal məlumatları oxuna bilmədi.");
        renderDistributionRows(parsed.data || []);
        distributionResults.hidden = false;
        distributionStatus.textContent = "Jurnal yeniləndi · " + new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
        showDistributionError(error.message || "Jurnalı yükləmək olmadı. İnternet bağlantısını yoxlayın.");
        console.error("Paylama jurnalı yüklənmədi:", error);
    }
}

distributionRefreshButton.addEventListener("click", loadDistributionJournal);
issueGoodsButton.addEventListener("click", function () {
    actionToast.textContent = "Mal vermək funksiyası hələ aktiv deyil.";
    actionToast.hidden = false;
    clearTimeout(actionToastTimer);
    actionToastTimer = setTimeout(() => {
        actionToast.hidden = true;
    }, 2600);
});

function normalizeJournalHeader(value) {
    return String(value || "").trim().toLocaleLowerCase("az-AZ").replace(/\s+/g, " ");
}

function renderDistributionRows(rows) {
    distributionList.replaceChildren();
    const headerIndex = rows.findIndex(row => {
        const headers = row.map(normalizeJournalHeader);
        return headers.some(value => value.includes("tarix"))
            && headers.some(value => value.includes("malın adı"))
            && headers.some(value => value.includes("verilən miqdar"));
    });

    if (headerIndex < 0) {
        appendJournalMessage("Paylanma Jurnalı vərəqində uyğun başlıq sətri tapılmadı.");
        return;
    }

    const headers = rows[headerIndex].map(normalizeJournalHeader);
    const column = (...needles) => headers.findIndex(value => needles.some(needle => value.includes(needle)));
    const indexes = {
        date: column("tarix"),
        code: column("malın kodu"),
        name: column("malın adı"),
        quantity: column("verilən miqdar"),
        unit: column("ölçü vahidi"),
        department: column("hansı şöbəyə verildi"),
        recipient: column("malı götürən işçi", "mal götürən işçi", "işçi (ad, soyad)")
    };
    const records = rows.slice(headerIndex + 1).filter(row =>
        String(row[indexes.name] || "").trim() || String(row[indexes.code] || "").trim()
    );

    if (records.length === 0) {
        appendJournalMessage("Paylama jurnalında hələ qeyd yoxdur.");
        return;
    }

    records.reverse().forEach(row => {
        const entry = document.createElement("li");
        entry.className = "distribution-entry";
        const top = document.createElement("div");
        top.className = "distribution-entry-top";
        const item = document.createElement("div");
        item.className = "distribution-item";
        const name = document.createElement("strong");
        name.textContent = row[indexes.name] || "Adsız mal";
        item.appendChild(name);
        if (row[indexes.code]) {
            const code = document.createElement("span");
            code.className = "distribution-code";
            code.textContent = row[indexes.code];
            item.appendChild(code);
        }
        const quantity = document.createElement("span");
        quantity.className = "count-badge";
        quantity.textContent = (row[indexes.quantity] || "0") + (row[indexes.unit] ? " " + row[indexes.unit] : "");
        top.append(item, quantity);

        const details = document.createElement("div");
        details.className = "distribution-details";
        [
            ["Tarix", row[indexes.date]],
            ["Şöbə", row[indexes.department]],
            ["Götürən işçi", row[indexes.recipient]]
        ].filter(([, value]) => value && String(value).trim())
            .forEach(([label, value]) => {
                const detail = document.createElement("span");
                detail.className = "distribution-detail";
                const detailLabel = document.createElement("span");
                detailLabel.className = "distribution-detail-label";
                detailLabel.textContent = label + ":";
                const detailValue = document.createElement("span");
                detailValue.textContent = value;
                detail.append(detailLabel, detailValue);
                details.appendChild(detail);
            });
        entry.append(top, details);
        distributionList.appendChild(entry);
    });
}

function appendJournalMessage(message) {
    const item = document.createElement("li");
    item.className = "empty-result";
    item.textContent = message;
    distributionList.appendChild(item);
}

// Boş sahəyə toxunanda yüngül, dekorativ qabarcıq effekti.
document.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.matches("body, .container, .app-header, .view, .app-footer")) return;
    if (target.closest("button, a, input, textarea, select, nav, .intro-card, .result-card, .section-heading, #reader, .menu-backdrop")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (let i = 0; i < 5; i++) {
        const bubble = document.createElement("span");
        const size = 5 + Math.random() * 8;
        bubble.className = "tap-bubble";
        bubble.setAttribute("aria-hidden", "true");
        bubble.style.setProperty("--bubble-x", `${event.clientX + (Math.random() - .5) * 34}px`);
        bubble.style.setProperty("--bubble-y", `${event.clientY + (Math.random() - .5) * 14}px`);
        bubble.style.setProperty("--bubble-size", `${size}px`);
        bubble.style.setProperty("--bubble-drift", `${(Math.random() - .5) * 54}px`);
        bubble.style.setProperty("--bubble-duration", `${650 + Math.random() * 450}ms`);
        document.body.appendChild(bubble);
        bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    }
});

const splashScreen = document.getElementById("splash-screen");
if (splashScreen) {
    splashScreen.addEventListener("animationend", function (event) {
        if (event.animationName === "splashExit") splashScreen.remove();
    });
}
