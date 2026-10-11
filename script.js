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
const aboutView = document.getElementById("about-view");
const distributionStatus = document.getElementById("distribution-status");
const distributionResults = document.getElementById("distribution-results");
const distributionList = document.getElementById("distribution-list");
const distributionConnectButton = document.getElementById("connect-distribution");
let distributionTokenClient = null;
let distributionAccessToken = null;
let distributionSpreadsheetId = null;
let distributionFileMimeType = null;
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
distributionConnectButton.addEventListener("click", connectDistributionJournal);

function connectDistributionJournal() {
    const config = window.APP_CONFIG || {};
    if (!config.googleOAuthClientId || !config.googlePickerApiKey || !config.googleCloudProjectNumber) {
        distributionStatus.textContent = "Məxfi girişi aktiv etmək üçün app-config.js faylında Google OAuth Client ID, API Key və layihə nömrəsi yazılmalıdır.";
        distributionStatus.classList.add("journal-status-error");
        return;
    }
    if (!window.google?.accounts?.oauth2) {
        distributionStatus.textContent = "Google giriş xidməti yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.";
        distributionStatus.classList.add("journal-status-error");
        return;
    }

    if (distributionAccessToken) {
        if (distributionSpreadsheetId) loadDistributionRows(distributionAccessToken);
        else openDistributionPicker();
        return;
    }

    distributionTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.googleOAuthClientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: function (response) {
            if (response.error || !response.access_token) {
                distributionStatus.textContent = "Google hesabına giriş alınmadı. Yenidən cəhd edin.";
                distributionStatus.classList.add("journal-status-error");
                return;
            }
            distributionAccessToken = response.access_token;
            openDistributionPicker();
        }
    });
    distributionTokenClient.requestAccessToken({ prompt: "select_account" });
}

function openDistributionPicker() {
    const config = window.APP_CONFIG || {};
    distributionStatus.classList.remove("journal-status-error");
    distributionStatus.textContent = "Google Drive-dan paylama cədvəlini seçin…";
    if (!window.gapi?.load) {
        distributionStatus.textContent = "Google fayl seçicisi yüklənmədi. İnternet bağlantısını yoxlayın.";
        distributionStatus.classList.add("journal-status-error");
        return;
    }

    window.gapi.load("picker", {
        callback: function () {
            const spreadsheetMimeTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/vnd.google-apps.spreadsheet"
            ].join(",");
            const driveView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                .setIncludeFolders(false)
                .setSelectFolderEnabled(false)
                .setMimeTypes(spreadsheetMimeTypes);
            const picker = new window.google.picker.PickerBuilder()
                .addView(driveView)
                .setOAuthToken(distributionAccessToken)
                .setDeveloperKey(config.googlePickerApiKey)
                .setAppId(config.googleCloudProjectNumber)
                .setLocale("az")
                .setTitle("Paylanma Jurnalı cədvəlini seçin")
                .setCallback(function (data) {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const pickedFile = data.docs && data.docs[0];
                        if (!pickedFile?.id) return;
                        distributionSpreadsheetId = pickedFile.id;
                        distributionFileMimeType = pickedFile.mimeType || "";
                        loadDistributionRows(distributionAccessToken);
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        distributionStatus.textContent = "Cədvəl seçilmədi. Jurnalı görmək üçün Google cədvəlini seçin.";
                    }
                })
                .build();
            picker.setVisible(true);
        },
        onerror: function () {
            distributionStatus.textContent = "Google fayl seçicisi açıla bilmədi. Google Cloud API sazlamalarını yoxlayın.";
            distributionStatus.classList.add("journal-status-error");
        }
    });
}

async function loadDistributionRows(accessToken) {
    distributionStatus.classList.remove("journal-status-error");
    distributionStatus.textContent = "Paylama jurnalı yüklənir…";
    distributionResults.hidden = true;
    try {
        let rows;
        if (distributionFileMimeType === "application/vnd.google-apps.spreadsheet") {
            const range = "'Paylanma Jurnalı'!A1:H";
            const endpoint = "https://sheets.googleapis.com/v4/spreadsheets/"
                + encodeURIComponent(distributionSpreadsheetId)
                + "/values/" + encodeURIComponent(range)
                + "?valueRenderOption=FORMATTED_VALUE";
            const response = await fetch(endpoint, {
                headers: { Authorization: "Bearer " + accessToken }
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 401) distributionAccessToken = null;
                throw new Error(result.error?.message || "Google cədvəli oxuya bilmədi.");
            }
            rows = result.values || [];
        } else {
            if (!window.XLSX) throw new Error("Excel faylını oxuma xidməti yüklənmədi. İnternet bağlantısını yoxlayın.");
            const endpoint = "https://www.googleapis.com/drive/v3/files/"
                + encodeURIComponent(distributionSpreadsheetId) + "?alt=media";
            const response = await fetch(endpoint, {
                headers: { Authorization: "Bearer " + accessToken }
            });
            if (!response.ok) {
                if (response.status === 401) distributionAccessToken = null;
                throw new Error("Drive-dakı Excel faylı oxuna bilmədi (" + response.status + ").");
            }
            const workbook = window.XLSX.read(await response.arrayBuffer(), { type: "array", cellDates: true });
            const sheetName = workbook.SheetNames.find(name => normalizeJournalHeader(name).includes("paylanma jurnalı"));
            if (!sheetName) throw new Error("Excel faylında “Paylanma Jurnalı” vərəqi tapılmadı.");
            rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1, raw: false, defval: "", blankrows: false
            });
        }
        renderDistributionRows(rows);
        distributionResults.hidden = false;
        distributionStatus.textContent = "Jurnal yeniləndi · " + new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
        distributionStatus.textContent = error.message || "Jurnalı yükləmək olmadı. Giriş icazəsini və seçilmiş faylı yoxlayın.";
        distributionStatus.classList.add("journal-status-error");
        console.error("Paylama jurnalı yüklənmədi:", error);
    }
}

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
    const column = needle => headers.findIndex(value => value.includes(needle));
    const indexes = {
        date: column("tarix"),
        code: column("malın kodu"),
        name: column("malın adı"),
        quantity: column("verilən miqdar"),
        unit: column("ölçü vahidi"),
        department: column("hansı şöbəyə verildi"),
        recipient: column("mal götürən işçi")
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
        [row[indexes.date], row[indexes.department], row[indexes.recipient]]
            .filter(value => value && String(value).trim())
            .forEach(value => {
                const detail = document.createElement("span");
                detail.textContent = value;
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
