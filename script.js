// Buraya Google Sheets-də "Anbar Qalığı" vərəqinin CSV linkini yerləşdir.
const googleSheetsCSVLink = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAhFgg-Ct0Vvq3wty9ybPtUc7qVzgIXR-Fm8Nxi0fy2bOuIZyVI_Nd4j4r_n_r19tGc4xn0m-vD9NT/pub?gid=1441912411&single=true&output=csv";
// Yalnız yayımlanmış Paylanma Jurnalı vərəqinin oxu linkidir.
const distributionPublicCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAhFgg-Ct0Vvq3wty9ybPtUc7qVzgIXR-Fm8Nxi0fy2bOuIZyVI_Nd4j4r_n_r19tGc4xn0m-vD9NT/pub?gid=1178170056&single=true&output=csv";
// Yalnız yayımlanmış Mal Girişi vərəqinin oxu linkidir.
const purchasePublicCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAhFgg-Ct0Vvq3wty9ybPtUc7qVzgIXR-Fm8Nxi0fy2bOuIZyVI_Nd4j4r_n_r19tGc4xn0m-vD9NT/pub?gid=657890178&single=true&output=csv";
const LIMAN_ADMIN_UID = "WvDIKF4R5SNNEGBpMy6oZdcA1Ub2";

let anbarData = [];
let issueStockRecords = [];
let selectedIssueStockItem = null;
let issueReturnView = "home";
let issueGoodsSaving = false;
let issueGoodsApiReady = false;
let distributionRecords = [];
let monthlyPurchaseRecords = [];
let monthlyPurchaseReady = false;
let distributionColumnIndexes = {};
let distributionLoading = false;
let distributionRefreshQueued = false;
let dashboardDayKey = "";
let areaMeasurementRecords = [];
let areaMeasurementsLoading = true;
let areaMeasurementsCloudLoaded = false;
let scanner = null;
let scannerRunning = false;
let scanHandled = false;
const areaMeasurementStorageKey = "liman-area-measurements-v1";
const areaCloudMigrationKey = `${areaMeasurementStorageKey}-cloud-migrated-v1`;
const areaCloudPendingKey = `${areaMeasurementStorageKey}-cloud-pending-v1`;
const areaMeasurementsApiUrl = window.APP_CONFIG?.areaMeasurementsApiUrl || "";
let areaCloudQueue = Promise.resolve();
const marayWaterStorageKey = "liman-maray-water-records-v1";
const marayWaterPendingKey = "liman-maray-water-pending-v1";
const marayWaterApiUrl = window.APP_CONFIG?.marayWaterApiUrl || "";
let marayWaterRecords = [];
const reminderStorageKey = "liman-reminders-v1";
let reminders = [];
let firebaseAuth = null;
let firebaseDb = null;
let firebaseMessaging = null;
let currentAuthUser = null;
let reminderSubscription = null;
let pushTokenRegistered = false;
let pushTokenSyncing = false;
let pushTokenError = "";
let authStateVersion = 0;
let accountRegistrationInProgress = false;
let accountDialogMode = "login";
let currentProfileAvatar = "box";
const profileAvatars = Object.freeze({
    box: { label: "Girl1", src: "avatar/avatar1.jpg", fallback: "A" },
    ship: { label: "Girl2", src: "avatar/avatar2.jpg", fallback: "G" },
    anchor: { label: "Boy1", src: "avatar/avatar3.jpg", fallback: "L" },
    vest: { label: "Boy2", src: "avatar/avatar4.png", fallback: "İ" },
    crane: { label: "Gemi", src: "avatar/avatar5.png", fallback: "S" },
    clipboard: { label: "Gemi-sukani", src: "avatar/avatar6.png", fallback: "Q" }
});

const homeView = document.getElementById("home-view");
const scanView = document.getElementById("scan-view");
const resultView = document.getElementById("result-view");
const distributionView = document.getElementById("distribution-view");
const issueGoodsView = document.getElementById("issue-goods-view");
const areaMeasurementView = document.getElementById("area-measurement-view");
const marayWaterView = document.getElementById("maray-water-view");
const areaCountView = document.getElementById("area-count-view");
const aboutView = document.getElementById("about-view");
const remindersView = document.getElementById("reminders-view");
const approvalView = document.getElementById("approval-view");
const accountView = document.getElementById("account-view");
const englishPracticeView = document.getElementById("english-practice-view");
const accountBackButton = document.getElementById("account-back");
const accountAvatarField = document.getElementById("account-avatar-field");
const accountAvatarOptions = document.getElementById("account-avatar-options");
const accountAvatarInput = document.getElementById("account-avatar");
const accountAvatarPickerToggle = document.getElementById("account-avatar-picker-toggle");
const accountAvatarPickerPreview = document.getElementById("account-avatar-picker-preview");
const accountAvatarPickerLabel = document.getElementById("account-avatar-picker-label");
const approvalMenuLink = document.getElementById("approval-menu-link");
const approvalList = document.getElementById("approval-list");
const approvalCount = document.getElementById("approval-count");
const approvalStatus = document.getElementById("approval-status");
const approvalRefreshButton = document.getElementById("approval-refresh");
const reminderForm = document.getElementById("reminder-form");
const reminderTitleInput = document.getElementById("reminder-title");
const reminderDateTimeInput = document.getElementById("reminder-datetime");
const reminderList = document.getElementById("reminder-list");
const reminderCount = document.getElementById("reminder-count");
const reminderPermissionButton = document.getElementById("reminder-notification-enable");
const reminderPermissionTitle = document.getElementById("reminder-permission-title");
const reminderPermissionNote = document.getElementById("reminder-permission-note");
const areaMeasurementForm = document.getElementById("area-measurement-form");
const areaPageDescription = document.getElementById("area-page-description");
const areaCompanyInput = document.getElementById("area-company");
const areaVesselInput = document.getElementById("area-vessel");
const areaMeasurementList = document.getElementById("area-measurement-list");
const addAreaMeasurementButton = document.getElementById("add-area-measurement");
const areaDateInput = document.getElementById("area-date");
const areaNoteInput = document.getElementById("area-note");
const areaCalculatedValue = document.getElementById("area-calculated-value");
const areaRecordCount = document.getElementById("area-record-count");
const areaTotalValue = document.getElementById("area-total-value");
const areaRecordList = document.getElementById("area-record-list");
const areaRecordDialog = document.getElementById("area-record-dialog");
const areaRecordDialogContent = document.getElementById("area-record-dialog-content");
const areaDialogCloseButton = document.getElementById("area-dialog-close");
const areaDialogKicker = document.getElementById("area-dialog-kicker");
const marayWaterForm = document.getElementById("maray-water-form");
const marayWaterDateInput = document.getElementById("maray-water-date");
const marayWaterAllocationRows = document.getElementById("maray-water-allocation-rows");
const marayWaterAddAllocationButton = document.getElementById("maray-water-add-allocation");
const marayWaterRecipientInput = document.getElementById("maray-water-recipient");
const marayWaterNoteInput = document.getElementById("maray-water-note");
const marayWaterRecordList = document.getElementById("maray-water-record-list");
const marayWaterCount = document.getElementById("maray-water-count");
const marayWaterTotal = document.getElementById("maray-water-total");
const marayWaterSyncNote = document.getElementById("maray-water-sync-note");
const marayWaterSaveButton = document.getElementById("maray-water-save");
const marayWaterCancelEditButton = document.getElementById("maray-water-cancel-edit");
const areaCountForm = document.getElementById("area-count-form");
const areaCountDateInput = document.getElementById("area-count-date");
const areaCountRows = document.getElementById("area-count-rows");
const areaCountAddRowButton = document.getElementById("area-count-add-row");
const areaCountNoteInput = document.getElementById("area-count-note");
const areaCountActions = document.getElementById("area-count-actions");
const areaCountSaveButton = document.getElementById("area-count-save");
const areaCountExportButton = document.getElementById("area-count-export");
const areaCountStatus = document.getElementById("area-count-status");
const areaCountSearchInput = document.getElementById("area-count-search");
const areaCountSavedList = document.getElementById("area-count-saved-list");
const areaCountSavedCount = document.getElementById("area-count-saved-count");
const areaCountReportsStorageKey = "liman-area-count-reports-v1";
let areaCountReports = readAreaCountReports();
let editingAreaCountReportId = null;
let editingMarayWaterId = null;
let marayWaterSaving = false;
let activeAreaRecordId = null;
let pendingAreaDelete = null;
let pendingReminderDelete = null;
let pendingMarayWaterDelete = null;
const distributionStatus = document.getElementById("distribution-status");
const distributionResults = document.getElementById("distribution-results");
const distributionList = document.getElementById("distribution-list");
const distributionRefreshButton = document.getElementById("refresh-distribution");
const distributionSearchForm = document.getElementById("distribution-search-form");
const distributionSearchInput = document.getElementById("distribution-search-input");
const distributionSearchClear = document.getElementById("distribution-search-clear");
const journalMatchCount = document.getElementById("journal-match-count");
const recentDistributionList = document.getElementById("recent-distribution-list");
const dashboardDate = document.getElementById("dashboard-date");
const dashboardClockHour = document.getElementById("dashboard-clock-hour");
const dashboardClockMinute = document.getElementById("dashboard-clock-minute");
const dashboardClockSecond = document.getElementById("dashboard-clock-second");
const dashboardOldestList = document.getElementById("dashboard-oldest-list");
const portMapDialog = document.getElementById("port-map-dialog");
const portMapOpenButton = document.getElementById("port-map-open");
const portMapOpenMobileButton = document.getElementById("port-map-open-mobile");
const portMapCloseButton = document.getElementById("port-map-close");
const dashboardRecordCount = document.getElementById("dashboard-record-count");
const dashboardQuantityTotal = document.getElementById("dashboard-quantity-total");
const dashboardExpenseLabel = document.getElementById("dashboard-expense-label");
const dashboardMonthlyExpense = document.getElementById("dashboard-monthly-expense");
const issueGoodsButton = document.getElementById("issue-goods");
const issueGoodsBackButton = document.getElementById("issue-goods-back");
const issueGoodsSearchInput = document.getElementById("issue-goods-search-input");
const issueGoodsRefreshButton = document.getElementById("issue-goods-refresh");
const issueGoodsStatus = document.getElementById("issue-goods-status");
const issueGoodsList = document.getElementById("issue-goods-list");
const issueGoodsDialog = document.getElementById("issue-goods-dialog");
const issueGoodsForm = document.getElementById("issue-goods-form");
const issueGoodsSelected = document.getElementById("issue-goods-selected");
const issueGoodsQuantityInput = document.getElementById("issue-goods-quantity");
const issueGoodsDepartmentInput = document.getElementById("issue-goods-department");
const issueGoodsRecipientInput = document.getElementById("issue-goods-recipient");
const issueGoodsDateInput = document.getElementById("issue-goods-date");
const issueGoodsFormStatus = document.getElementById("issue-goods-form-status");
const issueGoodsSubmitButton = document.getElementById("issue-goods-submit");
const issueGoodsApiUrl = window.APP_CONFIG?.marayWaterApiUrl || "";
const issueGoodsDialogCloseButton = document.getElementById("issue-goods-dialog-close");
const issueGoodsCancelButton = document.getElementById("issue-goods-cancel");
const actionToast = document.getElementById("action-toast");
let actionToastTimer;
const scanError = document.getElementById("scan-error");
const scanCameraStatus = document.getElementById("scan-camera-status");
const dataStatus = document.getElementById("data-status");
const menuToggle = document.getElementById("menu-toggle");
const loginPlaceholder = document.getElementById("login-placeholder");
const accountControl = document.getElementById("account-control");
const accountLogoutMenu = document.getElementById("account-logout-menu");
const accountLogoutButton = document.getElementById("account-logout-button");
const appMenu = document.getElementById("app-menu");
const menuBackdrop = document.getElementById("menu-backdrop");
const accountLoginForm = document.getElementById("account-login-form");
const accountNameField = document.getElementById("account-name-field");
const accountNameInput = document.getElementById("account-name");
const accountEmailInput = document.getElementById("account-email");
const accountPasswordInput = document.getElementById("account-password");
const accountDialogTitle = document.getElementById("account-dialog-title");
const accountDialogDescription = document.getElementById("account-dialog-description");
const accountLoginFootnote = document.getElementById("account-login-footnote");
const accountModeToggle = document.getElementById("account-mode-toggle");
const accountLoginError = document.getElementById("account-login-error");
const currentAvatarElement = document.getElementById("account-current-avatar");
const loginPlaceholderLabel = document.getElementById("login-placeholder-label");
const homeRotatingCards = Array.from(document.querySelectorAll(".home-lists-grid > section"));
let homeCardRotationIndex = 0;
let homeCardRotationTimer = null;

function activateHomeCard(index) {
    homeCardRotationIndex = index;
    homeRotatingCards.forEach((card, cardIndex) => {
        const active = cardIndex === index;
        card.classList.toggle("home-card-active", active);
        card.setAttribute("aria-hidden", String(!active));
        card.inert = !active;
    });
}

function stopHomeCardRotation() {
    if (homeCardRotationTimer !== null) {
        clearInterval(homeCardRotationTimer);
        homeCardRotationTimer = null;
    }
}

function startHomeCardRotation() {
    stopHomeCardRotation();
    if (!homeRotatingCards.length) return;
    activateHomeCard(0);
    if (homeRotatingCards.length < 2) return;

    homeCardRotationTimer = window.setInterval(() => {
        if (!document.body.classList.contains("home-screen") || document.hidden) return;
        activateHomeCard((homeCardRotationIndex + 1) % homeRotatingCards.length);
    }, 5000);
}

document.body.classList.add("home-screen");
startHomeCardRotation();

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

function showActionToast(message) {
    actionToast.textContent = message;
    actionToast.hidden = false;
    clearTimeout(actionToastTimer);
    actionToastTimer = setTimeout(() => {
        actionToast.hidden = true;
    }, 2600);
}

function updateAccountButton(user = null, avatar = "box", profileName = "") {
    const accountName = user
        ? String(profileName || user.displayName || user.email?.split("@")[0] || "Hesabım").trim()
        : "Daxil ol";
    loginPlaceholderLabel.textContent = accountName;
    loginPlaceholder.classList.toggle("is-signed-in", Boolean(user));
    renderProfileAvatar(currentAvatarElement, avatar);
    currentAvatarElement.hidden = !user;
    closeAccountLogoutMenu();
}

function closeAccountLogoutMenu() {
    accountLogoutMenu.hidden = true;
    loginPlaceholder.setAttribute("aria-expanded", "false");
}

function renderProfileAvatar(container, avatar) {
    if (!container) return;
    const details = profileAvatars[avatar] || profileAvatars.box;
    const fallback = document.createElement("span");
    fallback.className = "profile-avatar-fallback";
    fallback.textContent = details.fallback;
    const image = document.createElement("img");
    image.src = details.src;
    image.alt = "";
    image.addEventListener("load", () => { fallback.hidden = true; }, { once: true });
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
    container.replaceChildren(fallback, image);
}

accountAvatarOptions.querySelectorAll("[data-account-avatar]").forEach(button => {
    renderProfileAvatar(button.querySelector(".account-avatar-image"), button.dataset.accountAvatar);
});
renderProfileAvatar(accountAvatarPickerPreview, "box");

function openAccountPage(mode = "login") {
    scanHandled = false;
    void stopScanner();
    closeMenu();
    setAccountDialogMode(mode);
    accountLoginError.hidden = true;
    showView("account");
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
    const inactiveButton = event.target.closest("[data-menu-inactive]");
    if (inactiveButton) {
        closeMenu();
        showActionToast(`${inactiveButton.dataset.menuInactive} bölməsi hələ aktiv deyil.`);
        return;
    }

    const button = event.target.closest("[data-menu-view]");
    if (!button) return;
    scanHandled = false;
    void stopScanner();
    const targetView = button.dataset.menuView;
    if (targetView === "reminders" && !currentAuthUser) {
        closeMenu();
        openAccountPage("login");
        showActionToast("Xatırlatmalar üçün hesabınıza daxil olun.");
        return;
    }
    if (targetView === "approvals" && currentAuthUser?.uid !== LIMAN_ADMIN_UID) {
        closeMenu();
        showActionToast("Bu bölmə yalnız administrator üçündür.");
        return;
    }
    showView(targetView);
    closeMenu();
    if (targetView === "distribution") loadDistributionJournal();
    if (targetView === "area-measurement") renderAreaMeasurements();
    if (targetView === "reminders") renderReminders();
    if (targetView === "approvals") void loadRegistrationRequests();
});

document.addEventListener("click", function (event) {
    if (!event.target.closest(".app-menu-wrap")) closeMenu();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
});

function showView(view) {
    document.title = view === "english-practice" ? "Word Shuffle" : "Liman Anbarı";
    if (view === "approvals" && currentAuthUser?.uid !== LIMAN_ADMIN_UID) view = "home";
    if (view === "home") startHomeCardRotation();
    else stopHomeCardRotation();
    document.body.classList.toggle("home-screen", view === "home");
    document.body.classList.toggle("scan-screen", view === "scan");
    document.body.classList.toggle("distribution-screen", view === "distribution");
    document.body.classList.toggle("issue-goods-screen", view === "issue-goods");
    document.body.classList.toggle("area-measurement-screen", view === "area-measurement");
    const publicAreaView = view === "area-measurement" && !currentAuthUser;
    document.body.classList.toggle("area-public-view", publicAreaView);
    if (areaPageDescription) {
        areaPageDescription.textContent = currentAuthUser
            ? "Ölçüləri və neçə gündür yığıldığını yazın. Sahə və gün sayı avtomatik hesablansın."
            : "Sahə qeydlərinə baxış. Ölçü əlavə etmək və silmək üçün təsdiqlənmiş hesabla daxil olun.";
    }
    document.body.classList.toggle("maray-water-screen", view === "maray-water");
    document.body.classList.toggle("area-count-screen", view === "area-count");
    document.body.classList.toggle("reminders-screen", view === "reminders");
    document.body.classList.toggle("about-screen", view === "about");
    document.body.classList.toggle("approval-screen", view === "approvals");
    document.body.classList.toggle("account-screen", view === "account");
    document.body.classList.toggle("english-practice-screen", view === "english-practice");
    homeView.hidden = view !== "home";
    scanView.hidden = view !== "scan";
    resultView.hidden = view !== "result";
    distributionView.hidden = view !== "distribution";
    issueGoodsView.hidden = view !== "issue-goods";
    areaMeasurementView.hidden = view !== "area-measurement";
    marayWaterView.hidden = view !== "maray-water";
    areaCountView.hidden = view !== "area-count";
    remindersView.hidden = view !== "reminders";
    approvalView.hidden = view !== "approvals";
    accountView.hidden = view !== "account";
    englishPracticeView.hidden = view !== "english-practice";
    aboutView.hidden = view !== "about";
    dataStatus.hidden = true;
    if (view === "area-measurement") {
        enqueueAreaCloudTask(synchronizeAreaMeasurementsOnStart);
    }
}

function initializeFirebaseAccount() {
    const config = window.APP_CONFIG?.firebaseConfig;
    if (!window.firebase || !config?.projectId) {
        updateAccountButton();
        return;
    }

    try {
        const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();
        try { firebaseMessaging = firebase.messaging(app); } catch (_) { firebaseMessaging = null; }
        if (firebaseMessaging) firebaseMessaging.onMessage(handleForegroundPush);
        firebaseAuth.onAuthStateChanged(async user => {
            const stateVersion = ++authStateVersion;
            if (accountRegistrationInProgress) return;

            currentAuthUser = null;
            pushTokenRegistered = false;
            pushTokenSyncing = false;
            pushTokenError = "";
            currentProfileAvatar = "box";
            approvalMenuLink.hidden = true;
            updateAccountButton();
            if (reminderSubscription) {
                reminderSubscription();
                reminderSubscription = null;
            }
            reminders = [];
            renderReminders();

            if (!user) {
                areaMeasurementRecords = [];
                areaMeasurementsLoading = false;
                areaMeasurementsCloudLoaded = false;
                renderAreaMeasurements();
                enqueueAreaCloudTask(synchronizeAreaMeasurementsOnStart);
                showView("home");
                updateReminderPermissionState();
                return;
            }

            let approvedProfile = null;
            if (user.uid === LIMAN_ADMIN_UID) {
                try {
                    const adminProfileSnapshot = await firebaseDb.collection("users").doc(user.uid).get();
                    if (stateVersion !== authStateVersion) return;
                    approvedProfile = adminProfileSnapshot.exists ? adminProfileSnapshot.data() : null;
                } catch (error) {
                    if (stateVersion !== authStateVersion) return;
                    console.warn("Administrator profili yüklənmədi", error);
                }
            } else {
                let profileSnapshot;
                try {
                    profileSnapshot = await firebaseDb.collection("users").doc(user.uid).get();
                } catch (error) {
                    if (stateVersion !== authStateVersion) return;
                    console.error("Hesab təsdiqi yoxlanmadı", error);
                    await firebaseAuth.signOut();
                    accountLoginError.textContent = "Hesab təsdiqini yoxlamaq olmadı. İnterneti yoxlayıb yenidən cəhd edin.";
                    accountLoginError.hidden = false;
                    showView("account");
                    return;
                }

                if (stateVersion !== authStateVersion) return;
                let profile = profileSnapshot.exists ? profileSnapshot.data() : null;
                if (!profile) {
                    const emailName = String(user.email || "").split("@")[0].trim();
                    const displayName = String(user.displayName || emailName || "İstifadəçi").trim().slice(0, 80);
                    try {
                        await firebaseDb.collection("users").doc(user.uid).set({
                            displayName: displayName.length >= 2 ? displayName : "İstifadəçi",
                            email: user.email || "",
                            avatar: "box",
                            status: "pending",
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (error) {
                        if (stateVersion !== authStateVersion) return;
                        console.error("Hesab üçün təsdiq sorğusu yaradıla bilmədi", error);
                        await firebaseAuth.signOut();
                        accountLoginError.textContent = "Təsdiq sorğusu yaradıla bilmədi. Firebase qaydalarını yeniləyib yenidən cəhd edin.";
                        accountLoginError.hidden = false;
                        showView("account");
                        return;
                    }
                    if (stateVersion !== authStateVersion) return;
                    await firebaseAuth.signOut();
                    accountLoginError.textContent = "Hesabınızın təsdiq sorğusu göndərildi. Administrator təsdiqləyəndən sonra daxil ola bilərsiniz.";
                    accountLoginError.hidden = false;
                    showView("account");
                    updateReminderPermissionState();
                    return;
                }

                approvedProfile = profile;
                if (profile.status !== "approved") {
                    await firebaseAuth.signOut();
                    accountLoginError.textContent = profile?.status === "pending"
                        ? "Qeydiyyat sorğunuz təsdiq gözləyir. Təsdiqdən sonra bu hesabla daxil ola bilərsiniz."
                        : profile?.status === "rejected"
                            ? "Bu hesab üçün giriş təsdiqlənməyib. Administratorla əlaqə saxlayın."
                            : "Hesab profili tapılmadı. Qeydiyyat sorğusu göndərin və təsdiqi gözləyin.";
                    accountLoginError.hidden = false;
                    showView("account");
                    updateReminderPermissionState();
                    return;
                }
            }

            if (stateVersion !== authStateVersion) return;
            currentAuthUser = user;
            enqueueAreaCloudTask(synchronizeAreaMeasurementsOnStart);
            currentProfileAvatar = approvedProfile?.avatar || "box";
            updateAccountButton(user, currentProfileAvatar, approvedProfile?.displayName);
            approvalMenuLink.hidden = user.uid !== LIMAN_ADMIN_UID;
            showView("home");
            reminders = loadReminders(user.uid);
            renderReminders();
            reminderSubscription = firebaseDb.collection("users").doc(user.uid)
                .collection("reminders").orderBy("at", "asc")
                .onSnapshot(snapshot => {
                    reminders = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const rawAt = data.at?.toDate ? data.at.toDate() : new Date(data.at);
                        return { ...data, id: doc.id, at: rawAt.toISOString() };
                    });
                    saveReminders();
                    renderReminders();
                }, error => {
                    console.error("Xatırlatmalar yüklənmədi", error);
                    showActionToast("Xatırlatmaları yükləmək olmadı. İnterneti yoxlayın.");
                });
            updateReminderPermissionState();
            if ("Notification" in window && Notification.permission === "granted") {
                void syncPushToken(false).catch(error => {
                    pushTokenError = error.message || "Telefon bildiriş xidməti qoşula bilmədi.";
                    console.warn("Telefonun bildiriş açarı qeydiyyata alınmadı:", error);
                    updateReminderPermissionState();
                });
            }
        });
    } catch (error) {
        console.error("Firebase başlatma xətası", error);
        updateAccountButton();
    }
}

async function handleForegroundPush(payload) {
    const data = payload?.data || {};
    const title = data.title || payload?.notification?.title || "Liman Anbarı · Xatırlatma";
    const body = data.body || payload?.notification?.body || "Xatırlatma vaxtınız yaxınlaşır.";
    const appUrl = new URL("./", document.baseURI).href;
    const iconUrl = new URL("images/ikoon-192.png", document.baseURI).href;
    const tag = data.tag || `liman-reminder-${data.reminderId || Date.now()}-${data.stage || "notice"}`;

    try {
        if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body,
                icon: iconUrl,
                badge: iconUrl,
                tag,
                renotify: false,
                data: { url: appUrl }
            });
            return;
        }
    } catch (error) {
        console.warn("Açıq tətbiqdə bildiriş göstərilmədi", error);
    }

    showActionToast(`⏰ ${body}`);
}

function reminderCacheKey(uid = currentAuthUser?.uid) {
    return uid ? `${reminderStorageKey}-${uid}` : `${reminderStorageKey}-guest`;
}

function loadReminders(uid = currentAuthUser?.uid) {
    if (!uid) return [];
    try {
        const saved = JSON.parse(localStorage.getItem(reminderCacheKey(uid)) || "[]");
        return Array.isArray(saved) ? saved.filter(item => item && item.id && item.title && item.at) : [];
    } catch {
        return [];
    }
}

function saveReminders() {
    if (!currentAuthUser) return false;
    try {
        localStorage.setItem(reminderCacheKey(), JSON.stringify(reminders));
        return true;
    } catch {
        showActionToast("Xatırlatmanı bu cihazda saxlamaq mümkün olmadı.");
        return false;
    }
}

function localDateTimeInputValue(date = new Date()) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function setReminderDateDefault() {
    const now = new Date();
    reminderDateTimeInput.min = localDateTimeInputValue(now);
    if (!reminderDateTimeInput.value) {
        const suggested = new Date(now.getTime() + 60 * 60 * 1000);
        suggested.setSeconds(0, 0);
        reminderDateTimeInput.value = localDateTimeInputValue(suggested);
    }
}

function formatReminderDate(date) {
    return new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatReminderTime(date) {
    return new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

function renderReminders() {
    if (!reminderList) return;
    const now = Date.now();
    const sorted = [...reminders].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const activeCount = sorted.filter(item => new Date(item.at).getTime() > now).length;
    reminderCount.textContent = `${activeCount} aktiv`;
    reminderList.replaceChildren();

    if (!sorted.length) {
        const empty = document.createElement("li");
        empty.className = "reminder-empty";
        empty.textContent = "Hələ xatırlatma əlavə edilməyib.";
        reminderList.appendChild(empty);
        return;
    }

    sorted.forEach(item => {
        const eventDate = new Date(item.at);
        const eventTime = eventDate.getTime();
        if (Number.isNaN(eventTime)) return;
        const card = document.createElement("li");
        card.className = `reminder-card${eventTime <= now ? " is-past" : ""}`;

        const timeBlock = document.createElement("div");
        timeBlock.className = "reminder-time";
        const time = document.createElement("strong");
        time.textContent = formatReminderTime(eventDate);
        const date = document.createElement("span");
        date.textContent = formatReminderDate(eventDate);
        timeBlock.append(time, date);

        const copy = document.createElement("div");
        copy.className = "reminder-card-copy";
        const title = document.createElement("strong");
        title.textContent = item.title;
        const detail = document.createElement("p");
        detail.textContent = `Vaxtı: ${formatReminderDate(eventDate)} · ${formatReminderTime(eventDate)}`;
        const state = document.createElement("span");
        state.className = "reminder-card-state";
        if (eventTime <= now) state.textContent = "Vaxtı keçib";
        else state.textContent = "10 dəq və 5 dəq qalmış, vaxtında bildiriş";
        copy.append(title, detail, state);

        const remove = document.createElement("button");
        remove.className = "reminder-delete";
        remove.type = "button";
        remove.dataset.reminderDelete = item.id;
        remove.setAttribute("aria-label", `${item.title} xatırlatmasını sil`);
        remove.textContent = "×";
        card.append(timeBlock, copy, remove);
        reminderList.appendChild(card);
    });
}

function updateReminderPermissionState() {
    if (!("Notification" in window)) {
        reminderPermissionTitle.textContent = "Tətbiqdaxili xəbərdarlıq";
        reminderPermissionNote.textContent = "Bu brauzerdə telefon bildirişi dəstəklənmir; tətbiq açıq olanda ekranda xəbərdarlıq görünəcək.";
        reminderPermissionButton.textContent = "Dəstəklənmir";
        reminderPermissionButton.disabled = true;
        return;
    }

    reminderPermissionButton.disabled = !currentAuthUser;
    if (!currentAuthUser) {
        reminderPermissionTitle.textContent = "Hesaba daxil olun";
        reminderPermissionNote.textContent = "Xatırlatma bildirişlərini bu hesabla qoşmaq üçün əvvəlcə daxil olun.";
        reminderPermissionButton.textContent = "Daxil ol";
        return;
    }
    if (Notification.permission === "granted" && pushTokenRegistered) {
        reminderPermissionTitle.textContent = "Telefon bildirişləri aktivdir";
        reminderPermissionNote.textContent = "Bu cihaz qoşulub. Bildirişlər 10 dəq, 5 dəq qalmış və vaxtı çatanda gələcək.";
        reminderPermissionButton.textContent = "Qoşulub";
        reminderPermissionButton.disabled = true;
    } else if (Notification.permission === "granted") {
        reminderPermissionTitle.textContent = pushTokenSyncing ? "Telefon qoşulur…" : "Telefon hələ qoşulmayıb";
        reminderPermissionNote.textContent = pushTokenError
            ? `Qoşulma alınmadı: ${pushTokenError}`
            : "İcazə var, amma bu telefonun bildiriş bağlantısı hələ yadda saxlanmayıb.";
        reminderPermissionButton.textContent = pushTokenSyncing ? "Qoşulur…" : "Yenidən qoş";
        reminderPermissionButton.disabled = pushTokenSyncing;
    } else if (Notification.permission === "denied") {
        reminderPermissionTitle.textContent = "Bildiriş icazəsi bağlıdır";
        reminderPermissionNote.textContent = "İcazəni telefonun və ya brauzerin tətbiq ayarlarından aça bilərsiniz.";
        reminderPermissionButton.textContent = "Ayarlara baxın";
    } else {
        reminderPermissionTitle.textContent = "Telefon bildirişləri";
        reminderPermissionNote.textContent = "Bildirişlər 10 dəq, 5 dəq qalmış və vaxtı çatanda gələcək.";
        reminderPermissionButton.textContent = "İcazəni aktiv et";
    }
}

reminderForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!reminderForm.reportValidity()) return;
    if (!currentAuthUser || !firebaseDb) {
        showActionToast("Xatırlatma əlavə etmək üçün əvvəlcə hesabınıza daxil olun.");
        openAccountPage("login");
        return;
    }

    const title = reminderTitleInput.value.trim();
    const eventDate = new Date(reminderDateTimeInput.value);
    if (!title || Number.isNaN(eventDate.getTime()) || eventDate.getTime() <= Date.now()) {
        showActionToast("Xatırlatma üçün gələcək tarix və saat seçin.");
        return;
    }

    const record = {
        title,
        at: firebase.firestore.Timestamp.fromDate(eventDate),
        pushStage: -1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const submitButton = reminderForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        await firebaseDb.collection("users").doc(currentAuthUser.uid).collection("reminders").add(record);
        reminderForm.reset();
        setReminderDateDefault();
        showActionToast("Xatırlatma hesabınızda yadda saxlanıldı.");
    } catch (error) {
        console.error("Xatırlatma saxlanmadı", error);
        showActionToast("Yadda saxlamaq olmadı. İnterneti yoxlayın.");
    } finally {
        submitButton.disabled = false;
    }
});

reminderList.addEventListener("click", event => {
    const button = event.target.closest("[data-reminder-delete]");
    if (!button) return;
    const item = reminders.find(reminder => reminder.id === button.dataset.reminderDelete);
    if (!item) return;
    pendingReminderDelete = item;
    pendingAreaDelete = null;
    activeAreaRecordId = null;
    areaDialogKicker.textContent = "XATIRLATMA";
    renderReminderDeleteConfirmation(item);
    if (!areaRecordDialog.open) areaRecordDialog.showModal();
});

async function syncPushToken(requestPermission = true) {
    if (!currentAuthUser || !firebaseDb) throw new Error("Hesaba daxil olun.");
    if (!firebaseMessaging || !window.APP_CONFIG?.firebaseVapidPublicKey) throw new Error("Bildiriş xidməti hazır deyil.");
    if (!("serviceWorker" in navigator)) throw new Error("Bu cihazda bildiriş xidməti dəstəklənmir.");

    pushTokenSyncing = true;
    pushTokenError = "";
    updateReminderPermissionState();
    try {
        let permission = Notification.permission;
        if (permission === "default" && requestPermission) permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error(permission === "denied" ? "Bildiriş icazəsini cihaz ayarlarından açın." : "Bildiriş icazəsi verilmədi.");

        const workerUrl = new URL("firebase-messaging-sw.js", document.baseURI);
        const workerScope = new URL("./", document.baseURI).pathname;
        const registration = await navigator.serviceWorker.register(workerUrl.href, { scope: workerScope });
        await registration.update().catch(() => {});
        const token = await firebaseMessaging.getToken({
            vapidKey: window.APP_CONFIG.firebaseVapidPublicKey,
            serviceWorkerRegistration: registration
        });
        if (!token) throw new Error("Bu telefon üçün bildiriş açarı alınmadı.");

        const tokenId = await notificationTokenId(token);
        await firebaseDb.collection("users").doc(currentAuthUser.uid).collection("tokens").doc(tokenId).set({
            token,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent.slice(0, 250)
        }, { merge: true });
        localStorage.setItem(`liman-fcm-token-id-${currentAuthUser.uid}`, tokenId);
        pushTokenRegistered = true;
    } catch (error) {
        pushTokenRegistered = false;
        pushTokenError = error.message || "Telefonun bildiriş xidməti qoşula bilmədi.";
        throw error;
    } finally {
        pushTokenSyncing = false;
        updateReminderPermissionState();
    }
}

async function notificationTokenId(token) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function removeCurrentDeviceToken() {
    if (!currentAuthUser || !firebaseDb) return;
    const tokenId = localStorage.getItem(`liman-fcm-token-id-${currentAuthUser.uid}`);
    if (!tokenId) return;
    await firebaseDb.collection("users").doc(currentAuthUser.uid).collection("tokens").doc(tokenId).delete();
    localStorage.removeItem(`liman-fcm-token-id-${currentAuthUser.uid}`);
}

reminderPermissionButton.addEventListener("click", async () => {
    if (!currentAuthUser) {
        openAccountPage("login");
        return;
    }
    if (!("Notification" in window)) {
        updateReminderPermissionState();
        return;
    }
    if (Notification.permission === "denied") {
        updateReminderPermissionState();
        showActionToast("Bildiriş icazəsini cihaz ayarlarından açın.");
        return;
    }
    try {
        await syncPushToken(true);
        updateReminderPermissionState();
        showActionToast("Bu cihaz xatırlatma bildirişlərinə qoşuldu.");
    } catch (error) {
        updateReminderPermissionState();
        showActionToast(error.message || "Bildiriş icazəsini aktiv etmək mümkün olmadı.");
    }
});

function initializeReminders() {
    setReminderDateDefault();
    updateReminderPermissionState();
    renderReminders();
}

function localDateInputValue(date = new Date()) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function parseMeasurementNumber(value) {
    const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!normalized) return 0;
    return Number(normalized);
}

function formatMeasurementNumber(value) {
    return new Intl.NumberFormat("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatMeasurementDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day) return "Tarix qeyd edilməyib";
    return new Date(year, month - 1, day).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", year: "numeric" });
}

function currentAccumulationDays(area) {
    const initialDays = Math.floor(Number(area?.initialDays) || 0);
    if (initialDays < 1) return 0;
    const [year, month, day] = String(area.daysCountedOn || "").split("-").map(Number);
    if (!year || !month || !day) return initialDays;
    const countedOn = new Date(year, month - 1, day);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return initialDays + Math.max(0, Math.floor((todayStart - countedOn) / 86400000));
}

function formatAccumulationDays(area) {
    const days = currentAccumulationDays(area);
    return days ? `${days} gündür yığılır` : "Yığılma günü qeyd edilməyib";
}

function createAreaMeasurementBlock(index, area = {}) {
    const block = document.createElement("section");
    block.className = "area-measurement-block";
    block.dataset.areaBlock = "";

    const heading = document.createElement("div");
    heading.className = "area-measurement-block-heading";
    const title = document.createElement("strong");
    title.className = "area-measurement-block-title";
    title.textContent = `SAHƏ ${index + 1}`;
    heading.appendChild(title);

    if (index > 0) {
        const removeButton = document.createElement("button");
        removeButton.className = "area-remove-measurement";
        removeButton.type = "button";
        removeButton.dataset.removeArea = "";
        removeButton.setAttribute("aria-label", `Sahə ${index + 1} sətrini sil`);
        removeButton.textContent = "Sil";
        heading.appendChild(removeButton);
    }

    const fields = document.createElement("div");
    fields.className = "area-measurement-fields";

    const createField = (caption, key, placeholder) => {
        const label = document.createElement("label");
        label.className = `area-field${key === "location" || key === "initialDays" ? " area-field-full" : ""}`;
        const text = document.createElement("span");
        text.textContent = caption;
        const input = document.createElement("input");
        input.type = key === "initialDays" ? "number" : "text";
        input.inputMode = key === "location" ? "text" : key === "initialDays" ? "numeric" : "decimal";
        input.autocomplete = "off";
        if (key === "initialDays") {
            input.min = "1";
            input.max = "99999";
            input.step = "1";
        } else input.maxLength = key === "location" ? 100 : 24;
        input.placeholder = placeholder;
        input.required = true;
        input.dataset.areaValue = key;
        if (key === "location") input.value = area.location || "";
        else if (key === "initialDays") input.value = area.initialDays == null ? "1" : String(area.initialDays);
        else input.value = area[key] == null ? "" : String(area[key]).replace(".", ",");
        label.append(text, input);
        if (key === "initialDays") {
            const hint = document.createElement("small");
            hint.textContent = "Məsələn, 2 yazın; sabah 3 olacaq.";
            label.appendChild(hint);
        }
        return label;
    };

    fields.append(
        createField("Yer / zona", "location", "Məsələn, Açıq sahə A"),
        createField("Uzunluq (m)", "length", "Məsələn, 12,5"),
        createField("En (m)", "width", "Məsələn, 8"),
        createField("Neçə gündür yığılır?", "initialDays", "Məsələn, 2")
    );

    const calculation = document.createElement("div");
    calculation.className = "area-section-calculation";
    const calculationLabel = document.createElement("span");
    calculationLabel.textContent = "Bu sahənin ölçüsü";
    const calculationValue = document.createElement("output");
    calculationValue.dataset.areaOutput = "";
    calculationValue.textContent = `${formatMeasurementNumber(area.area || 0)} m²`;
    calculation.append(calculationLabel, calculationValue);

    block.append(heading, fields, calculation);
    return block;
}

function updateAreaBlockNumbers() {
    [...areaMeasurementList.querySelectorAll("[data-area-block]")].forEach((block, index) => {
        const title = block.querySelector(".area-measurement-block-title");
        title.textContent = `SAHƏ ${index + 1}`;
        const removeButton = block.querySelector("[data-remove-area]");
        if (removeButton) removeButton.setAttribute("aria-label", `Sahə ${index + 1} sətrini sil`);
    });
}

function updateAreaCalculation() {
    let totalArea = 0;
    areaMeasurementList.querySelectorAll("[data-area-block]").forEach(block => {
        const length = parseMeasurementNumber(block.querySelector('[data-area-value="length"]').value);
        const width = parseMeasurementNumber(block.querySelector('[data-area-value="width"]').value);
        const area = Number.isFinite(length) && Number.isFinite(width) && length > 0 && width > 0 ? length * width : 0;
        block.querySelector("[data-area-output]").textContent = `${formatMeasurementNumber(area)} m²`;
        totalArea += area;
    });
    areaCalculatedValue.textContent = `${formatMeasurementNumber(totalArea)} m²`;
}

function getAreaMeasurementValues() {
    return [...areaMeasurementList.querySelectorAll("[data-area-block]")].map(block => ({
        location: block.querySelector('[data-area-value="location"]').value.trim(),
        length: parseMeasurementNumber(block.querySelector('[data-area-value="length"]').value),
        width: parseMeasurementNumber(block.querySelector('[data-area-value="width"]').value),
        initialDays: Math.floor(parseMeasurementNumber(block.querySelector('[data-area-value="initialDays"]').value))
    }));
}

function renderAreaMeasurements() {
    renderLongestStoredAreas();
    areaRecordList.replaceChildren();
    const totalArea = areaMeasurementRecords.reduce((sum, record) => sum + (Number(record.area) || 0), 0);
    areaRecordCount.textContent = `${areaMeasurementRecords.length} qeyd`;
    areaTotalValue.textContent = `${formatMeasurementNumber(totalArea)} m²`;

    if (areaMeasurementRecords.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "area-empty";
        emptyItem.textContent = areaMeasurementsLoading
            ? "Google Sheets-dən qeydlər yüklənir…"
            : areaMeasurementsCloudLoaded
                ? "Google Sheets-də hələ ölçü qeydi yoxdur."
                : "Sahə qeydlərini yükləmək olmadı. Yenidən cəhd edin.";
        areaRecordList.appendChild(emptyItem);
        return;
    }

    areaMeasurementRecords.forEach(record => {
        const item = document.createElement("li");
        item.className = "area-record-card";
        const openButton = document.createElement("button");
        openButton.className = "area-record-open";
        openButton.type = "button";
        openButton.dataset.openRecord = record.id;
        openButton.setAttribute("aria-label", `${record.company}, ${formatMeasurementNumber(record.area)} kvadratmetr, ətraflı bax`);

        const top = document.createElement("div");
        top.className = "area-record-top";
        const company = document.createElement("strong");
        company.className = "area-record-company";
        company.textContent = record.company;
        const area = document.createElement("span");
        area.className = "area-record-measure";
        area.textContent = `${formatMeasurementNumber(record.area)} m²`;
        top.append(company, area);

        const vessel = document.createElement("p");
        vessel.className = "area-record-vessel";
        vessel.textContent = `Gəmi: ${record.vessel}`;

        const details = document.createElement("div");
        details.className = "area-record-open-footer";
        const date = document.createElement("time");
        date.dateTime = record.date || "";
        date.textContent = formatMeasurementDate(record.date);
        const areas = Array.isArray(record.areas) && record.areas.length
            ? record.areas
            : [{ location: "Sahə 1", length: record.length, width: record.width, area: record.area }];
        const areaCount = document.createElement("span");
        areaCount.textContent = `${areas.length} sahə`;
        const openLabel = document.createElement("span");
        openLabel.className = "area-record-open-label";
        openLabel.textContent = "Ətraflı bax  ›";
        details.append(date, areaCount, openLabel);
        openButton.append(top, vessel, details);
        item.appendChild(openButton);
        areaRecordList.appendChild(item);
    });
}

function getAreaRecordById(recordId) {
    return areaMeasurementRecords.find(record => record.id === recordId);
}

function renderAreaRecordDetails(record) {
    if (!record) return;
    areaRecordDialogContent.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "area-dialog-title-block";
    const title = document.createElement("h2");
    title.id = "area-dialog-title";
    title.textContent = record.company;
    const vessel = document.createElement("p");
    vessel.textContent = record.vessel ? `Gəmi: ${record.vessel}` : "Gəmi adı qeyd edilməyib";
    heading.append(title, vessel);
    areaRecordDialogContent.appendChild(heading);

    const total = document.createElement("div");
    total.className = "area-dialog-total";
    const totalLabel = document.createElement("span");
    totalLabel.textContent = "ÜMUMİ SAHƏ";
    const totalValue = document.createElement("strong");
    totalValue.textContent = `${formatMeasurementNumber(record.area)} m²`;
    total.append(totalLabel, totalValue);
    areaRecordDialogContent.appendChild(total);

    const date = document.createElement("p");
    date.className = "area-dialog-date";
    date.textContent = formatMeasurementDate(record.date);
    areaRecordDialogContent.appendChild(date);

    const sectionHeading = document.createElement("h3");
    sectionHeading.className = "area-dialog-section-heading";
    sectionHeading.textContent = "Ölçülən sahələr";
    areaRecordDialogContent.appendChild(sectionHeading);

    const areaList = document.createElement("div");
    areaList.className = "area-dialog-area-list";
    const areas = Array.isArray(record.areas) && record.areas.length
        ? record.areas
        : [{ location: "Sahə 1", length: record.length, width: record.width, area: record.area }];
    areas.forEach((measurement, index) => {
        const areaCard = document.createElement("article");
        areaCard.className = "area-dialog-area-card";
        const areaCardHeader = document.createElement("div");
        areaCardHeader.className = "area-dialog-area-header";
        const location = document.createElement("strong");
        location.textContent = measurement.location || `Sahə ${index + 1}`;
        const areaValue = document.createElement("span");
        areaValue.textContent = `${formatMeasurementNumber(measurement.area ?? (Number(measurement.length) * Number(measurement.width)))} m²`;
        areaCardHeader.append(location, areaValue);

        const dimensions = document.createElement("p");
        dimensions.textContent = `${formatMeasurementNumber(measurement.length)} m × ${formatMeasurementNumber(measurement.width)} m`;
        areaCard.append(areaCardHeader, dimensions);

        const age = document.createElement("p");
        age.className = "area-dialog-area-age";
        age.dataset.areaAgeIndex = String(index);
        age.textContent = formatAccumulationDays(measurement);
        areaCard.appendChild(age);

        if (currentAuthUser) {
            const deleteAreaButton = document.createElement("button");
            deleteAreaButton.className = "area-dialog-area-delete";
            deleteAreaButton.type = "button";
            deleteAreaButton.dataset.deleteDialogArea = String(index);
            deleteAreaButton.textContent = "Bu sahəni sil";
            areaCard.appendChild(deleteAreaButton);
        }
        areaList.appendChild(areaCard);
    });
    areaRecordDialogContent.appendChild(areaList);

    if (record.note) {
        const note = document.createElement("p");
        note.className = "area-dialog-note";
        note.textContent = record.note;
        areaRecordDialogContent.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "area-dialog-actions";
    const closeButton = document.createElement("button");
    closeButton.className = "area-dialog-secondary";
    closeButton.type = "button";
    closeButton.dataset.closeAreaDialog = "";
    closeButton.textContent = "Bağla";
    if (currentAuthUser) {
        const deleteRecordButton = document.createElement("button");
        deleteRecordButton.className = "area-dialog-delete-record";
        deleteRecordButton.type = "button";
        deleteRecordButton.dataset.deleteDialogRecord = "";
        deleteRecordButton.textContent = "Bütün qeydi sil";
        actions.append(deleteRecordButton);
    }
    actions.append(closeButton);
    areaRecordDialogContent.appendChild(actions);
}

function refreshAreaAgeLabels() {
    if (!activeAreaRecordId) return;
    const record = getAreaRecordById(activeAreaRecordId);
    if (!record) return;
    areaRecordDialogContent.querySelectorAll("[data-area-age-index]").forEach(label => {
        const area = record.areas?.[Number(label.dataset.areaAgeIndex)];
        if (area) label.textContent = formatAccumulationDays(area);
    });
}

function renderAreaDeleteConfirmation(scope) {
    areaRecordDialogContent.replaceChildren();
    const confirmation = document.createElement("div");
    confirmation.className = "area-delete-confirmation";
    const icon = document.createElement("span");
    icon.className = "area-delete-confirmation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "!";
    const title = document.createElement("h2");
    title.id = "area-dialog-title";
    title.textContent = "Silmək istəyirsiniz?";
    const message = document.createElement("p");
    message.textContent = scope.type === "record"
        ? `${scope.record.company} qeydi və bütün sahələri silinəcək.`
        : `${scope.area.location || "Seçilmiş sahə"} ölçüsü silinəcək${scope.isLastArea ? " və qeydin özü də silinəcək" : ""}.`;
    const actions = document.createElement("div");
    actions.className = "area-dialog-actions area-delete-confirmation-actions";
    const cancelButton = document.createElement("button");
    cancelButton.className = "area-dialog-secondary";
    cancelButton.type = "button";
    cancelButton.dataset.cancelAreaDelete = "";
    cancelButton.textContent = "Ləğv et";
    const confirmButton = document.createElement("button");
    confirmButton.className = "area-dialog-delete-record";
    confirmButton.type = "button";
    confirmButton.dataset.confirmAreaDelete = "";
    confirmButton.textContent = "Bəli, sil";
    actions.append(cancelButton, confirmButton);
    confirmation.append(icon, title, message, actions);
    areaRecordDialogContent.appendChild(confirmation);
}

function renderReminderDeleteConfirmation(item) {
    areaRecordDialogContent.replaceChildren();
    const confirmation = document.createElement("div");
    confirmation.className = "area-delete-confirmation";
    const icon = document.createElement("span");
    icon.className = "area-delete-confirmation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "!";
    const title = document.createElement("h2");
    title.id = "area-dialog-title";
    title.textContent = "Xatırlatma silinsin?";
    const message = document.createElement("p");
    message.textContent = `“${item.title}” xatırlatması hesabınızdan silinəcək.`;
    const actions = document.createElement("div");
    actions.className = "area-dialog-actions area-delete-confirmation-actions";
    const cancelButton = document.createElement("button");
    cancelButton.className = "area-dialog-secondary";
    cancelButton.type = "button";
    cancelButton.dataset.cancelReminderDelete = "";
    cancelButton.textContent = "Ləğv et";
    const confirmButton = document.createElement("button");
    confirmButton.className = "area-dialog-delete-record";
    confirmButton.type = "button";
    confirmButton.dataset.confirmReminderDelete = "";
    confirmButton.textContent = "Bəli, sil";
    actions.append(cancelButton, confirmButton);
    confirmation.append(icon, title, message, actions);
    areaRecordDialogContent.appendChild(confirmation);
}

function renderMarayWaterDeleteConfirmation(record) {
    areaRecordDialogContent.replaceChildren();
    const confirmation = document.createElement("div");
    confirmation.className = "area-delete-confirmation";
    const icon = document.createElement("span");
    icon.className = "area-delete-confirmation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "!";
    const title = document.createElement("h2");
    title.id = "area-dialog-title";
    title.textContent = "Məray Su qaiməsi silinsin?";
    const message = document.createElement("p");
    message.textContent = `${formatMarayWaterDate(record.date)} tarixli qaimə tətbiqdən və Google Sheets-dən silinəcək.`;
    const actions = document.createElement("div");
    actions.className = "area-dialog-actions area-delete-confirmation-actions";
    const cancelButton = document.createElement("button");
    cancelButton.className = "area-dialog-secondary";
    cancelButton.type = "button";
    cancelButton.dataset.cancelMarayWaterDelete = "";
    cancelButton.textContent = "Ləğv et";
    const confirmButton = document.createElement("button");
    confirmButton.className = "area-dialog-delete-record";
    confirmButton.type = "button";
    confirmButton.dataset.confirmMarayWaterDelete = "";
    confirmButton.textContent = "Bəli, sil";
    actions.append(cancelButton, confirmButton);
    confirmation.append(icon, title, message, actions);
    areaRecordDialogContent.appendChild(confirmation);
}

function openAreaRecordDialog(recordId) {
    const record = getAreaRecordById(recordId);
    if (!record) return;
    activeAreaRecordId = recordId;
    pendingAreaDelete = null;
    pendingReminderDelete = null;
    areaDialogKicker.textContent = "ƏRAZİ QEYDİ";
    renderAreaRecordDetails(record);
    if (!areaRecordDialog.open) areaRecordDialog.showModal();
}

function deleteAreaRecord(recordId) {
    const record = getAreaRecordById(recordId);
    if (!record) return;
    syncAreaMeasurementMutation(
        "delete",
        { id: recordId },
        "Qeyd və bütün sahələri Google Sheets-dən silindi.",
        "Qeyd Google Sheets-dən silinmədi. İnterneti yoxlayıb yenidən cəhd edin.",
        () => {
            areaRecordDialog.close();
            pendingAreaDelete = null;
            activeAreaRecordId = null;
        }
    );
}

function deleteAreaRecordSection(recordId, areaIndex) {
    const record = getAreaRecordById(recordId);
    if (!record || !record.areas?.[areaIndex]) return;
    const remainingAreas = record.areas.filter((_, index) => index !== areaIndex);
    if (remainingAreas.length) {
        const updatedRecord = {
            ...record,
            areas: remainingAreas,
            area: remainingAreas.reduce((sum, measurement) => sum + measurement.area, 0)
        };
        syncAreaMeasurementMutation(
            "save",
            updatedRecord,
            "Sahə silindi və Google Sheets yeniləndi.",
            "Sahə Google Sheets-də silinmədi. İnterneti yoxlayıb yenidən cəhd edin.",
            cloudRecords => {
                pendingAreaDelete = null;
                const savedRecord = cloudRecords.find(item => item.id === recordId);
                if (savedRecord) renderAreaRecordDetails(savedRecord);
            }
        );
    } else {
        syncAreaMeasurementMutation(
            "delete",
            { id: recordId },
            "Son sahə və qeyd Google Sheets-dən silindi.",
            "Qeyd Google Sheets-dən silinmədi. İnterneti yoxlayıb yenidən cəhd edin.",
            () => {
                areaRecordDialog.close();
                activeAreaRecordId = null;
                pendingAreaDelete = null;
            }
        );
    }
}

areaRecordList.addEventListener("click", event => {
    const openButton = event.target.closest("[data-open-record]");
    if (openButton) openAreaRecordDialog(openButton.dataset.openRecord);
});

areaDialogCloseButton.addEventListener("click", () => areaRecordDialog.close());
areaRecordDialog.addEventListener("click", async event => {
    if (event.target === areaRecordDialog) {
        areaRecordDialog.close();
        return;
    }

    if (event.target.closest("[data-close-area-dialog]")) {
        areaRecordDialog.close();
        return;
    }

    if (event.target.closest("[data-cancel-reminder-delete]")) {
        pendingReminderDelete = null;
        areaRecordDialog.close();
        return;
    }

    if (event.target.closest("[data-cancel-maray-water-delete]")) {
        if (pendingMarayWaterDelete?.busy) return;
        pendingMarayWaterDelete = null;
        areaRecordDialog.close();
        return;
    }

    if (event.target.closest("[data-confirm-maray-water-delete]") && pendingMarayWaterDelete) {
        const confirmButton = event.target.closest("[data-confirm-maray-water-delete]");
        if (pendingMarayWaterDelete.busy) return;
        pendingMarayWaterDelete.busy = true;
        confirmButton.disabled = true;
        confirmButton.textContent = "Silinir…";
        const deleted = await deleteMarayWaterRecord(pendingMarayWaterDelete.record.id);
        if (!deleted && pendingMarayWaterDelete) {
            pendingMarayWaterDelete.busy = false;
            confirmButton.disabled = false;
            confirmButton.textContent = "Yenidən yoxla";
        }
        return;
    }

    if (event.target.closest("[data-confirm-reminder-delete]") && pendingReminderDelete) {
        const reminderId = pendingReminderDelete.id;
        try {
            await firebaseDb.collection("users").doc(currentAuthUser.uid).collection("reminders").doc(reminderId).delete();
            reminders = reminders.filter(item => item.id !== reminderId);
            saveReminders();
            renderReminders();
            areaRecordDialog.close();
            showActionToast("Xatırlatma silindi.");
        } catch (error) {
            console.error("Xatırlatma silinmədi", error);
            showActionToast("Silmək olmadı. İnterneti yoxlayın.");
        }
        return;
    }

    if (event.target.closest("[data-delete-dialog-record]")) {
        const record = getAreaRecordById(activeAreaRecordId);
        if (!record) return;
        pendingAreaDelete = { type: "record", record };
        renderAreaDeleteConfirmation(pendingAreaDelete);
        return;
    }

    const deleteAreaButton = event.target.closest("[data-delete-dialog-area]");
    if (deleteAreaButton) {
        const record = getAreaRecordById(activeAreaRecordId);
        const areaIndex = Number(deleteAreaButton.dataset.deleteDialogArea);
        const area = record?.areas?.[areaIndex];
        if (!record || !area) return;
        pendingAreaDelete = { type: "area", record, area, areaIndex, isLastArea: record.areas.length === 1 };
        renderAreaDeleteConfirmation(pendingAreaDelete);
        return;
    }

    if (event.target.closest("[data-cancel-area-delete]")) {
        const record = getAreaRecordById(activeAreaRecordId);
        pendingAreaDelete = null;
        if (record) renderAreaRecordDetails(record);
        else areaRecordDialog.close();
        return;
    }

    if (event.target.closest("[data-confirm-area-delete]") && pendingAreaDelete) {
        if (pendingAreaDelete.type === "record") deleteAreaRecord(pendingAreaDelete.record.id);
        else deleteAreaRecordSection(pendingAreaDelete.record.id, pendingAreaDelete.areaIndex);
    }
});

areaRecordDialog.addEventListener("close", () => {
    pendingAreaDelete = null;
    pendingReminderDelete = null;
    pendingMarayWaterDelete = null;
    activeAreaRecordId = null;
    areaDialogKicker.textContent = "ƏRAZİ QEYDİ";
});

function normalizeAreaCloudDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return localDateInputValue(value);
    const text = String(value ?? "").trim();
    const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
    const dottedDate = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dottedDate) return `${dottedDate[3]}-${dottedDate[2].padStart(2, "0")}-${dottedDate[1].padStart(2, "0")}`;
    const usDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usDate) return `${usDate[3]}-${usDate[1].padStart(2, "0")}-${usDate[2].padStart(2, "0")}`;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : localDateInputValue(parsed);
}

function getAreaCloudObjectValue(object, aliases) {
    if (!object || typeof object !== "object") return "";
    const entries = Object.entries(object);
    for (const alias of aliases) {
        const normalizedAlias = normalizeCell(alias);
        const match = entries.find(([key]) => normalizeCell(key) === normalizedAlias);
        if (match) return match[1];
    }
    return "";
}

function normalizeAreaCloudRecord(source, index = 0) {
    const id = String(getAreaCloudObjectValue(source, ["id", "recordId", "qeyd id", "qeydId"]) || "").trim();
    if (!id) return null;
    const sourceAreas = Array.isArray(source.areas) ? source.areas : null;
    const rawAreas = sourceAreas?.length ? sourceAreas : [source];
    const areas = rawAreas.map((area, areaIndex) => {
        const length = parseMeasurementNumber(getAreaCloudObjectValue(area, ["length", "uzunluq", "uzunluq (m)"]));
        const width = parseMeasurementNumber(getAreaCloudObjectValue(area, ["width", "en", "en (m)"]));
        const suppliedArea = parseMeasurementNumber(getAreaCloudObjectValue(area, ["area", "sahə (m²)", "sahe (m2)"]));
        return {
            location: String(getAreaCloudObjectValue(area, ["location", "sahə / yer", "sahe / yer", "yer", "sahə", "sahe"]) || `Sahə ${areaIndex + 1}`).trim(),
            length,
            width,
            area: suppliedArea || (length * width),
            initialDays: Math.floor(parseMeasurementNumber(getAreaCloudObjectValue(area, ["initialDays", "days", "ilkin gün sayı", "yığılıb gün"]))) || 0,
            daysCountedOn: normalizeAreaCloudDate(getAreaCloudObjectValue(area, ["daysCountedOn", "countedOn", "hesab tarixi"]))
        };
    }).filter(area => area.length > 0 && area.width > 0);
    if (!areas.length) return null;
    return {
        id,
        date: normalizeAreaCloudDate(getAreaCloudObjectValue(source, ["date", "tarix"])),
        company: String(getAreaCloudObjectValue(source, ["company", "companyName", "şirkət adı", "sirkət adı", "sirket adi"]) || "Şirkət qeyd edilməyib").trim(),
        vessel: String(getAreaCloudObjectValue(source, ["vessel", "ship", "gəminin adı", "geminin adi", "gəmi adı"]) || "").trim(),
        areas,
        area: areas.reduce((sum, item) => sum + item.area, 0),
        note: String(getAreaCloudObjectValue(source, ["note", "qeyd"]) || "").trim()
    };
}

function unwrapAreaCloudPayload(payload) {
    if (typeof payload === "string") {
        try { payload = JSON.parse(payload); }
        catch { throw new Error("Google Sheets cavabı oxuna bilmədi."); }
    }
    if (payload?.success === false || payload?.ok === false) {
        throw new Error(payload.message || payload.error || "Google Sheets sorğunu qəbul etmədi.");
    }
    if (Array.isArray(payload)) return payload;
    for (const key of ["records", "data", "rows", "values", "result"]) {
        if (payload && Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            if (Array.isArray(value) || typeof value === "string") return unwrapAreaCloudPayload(value);
            if (value && typeof value === "object") return unwrapAreaCloudPayload(value);
        }
    }
    if (payload && typeof payload === "object" && getAreaCloudObjectValue(payload, ["id", "recordId", "qeyd id"])) return [payload];
    throw new Error("Google Sheets cavabında ölçü qeydləri tapılmadı.");
}

function normalizeAreaCloudRecords(payload) {
    const rows = unwrapAreaCloudPayload(payload);
    if (!rows.length) return [];

    if (rows.every(row => row && typeof row === "object" && !Array.isArray(row))) {
        const grouped = new Map();
        rows.forEach((row, index) => {
            const normalized = normalizeAreaCloudRecord(row, index);
            if (!normalized) return;
            const previous = grouped.get(normalized.id);
            if (!previous) grouped.set(normalized.id, normalized);
            else if (!Array.isArray(row.areas) || !row.areas.length) {
                previous.areas.push(...normalized.areas);
                previous.area = previous.areas.reduce((sum, item) => sum + item.area, 0);
            }
        });
        if (!grouped.size) throw new Error("Cədvəldə Qeyd ID sütunu tapılmadı.");
        return [...grouped.values()].sort((a, b) => b.id.localeCompare(a.id));
    }

    if (!rows.every(Array.isArray)) throw new Error("Google Sheets məlumat formatı tanınmadı.");
    const headerIndex = rows.findIndex(row => {
        const cells = row.map(normalizeCell);
        return cells.some(value => value === "tarix") && cells.some(value => value === "şirkət adı" || value === "sirket adi");
    });
    const headers = headerIndex >= 0 ? rows[headerIndex].map(normalizeCell) : [];
    const column = (aliases, fallback) => {
        const found = headers.findIndex(value => aliases.some(alias => value === normalizeCell(alias)));
        return found >= 0 ? found : fallback;
    };
    const columns = {
        date: column(["tarix", "date"], 0),
        company: column(["şirkət adı", "sirket adi", "company"], 1),
        vessel: column(["gəminin adı", "geminin adi", "vessel"], 2),
        location: column(["sahə / yer", "sahe / yer", "yer", "sahə", "sahe"], 3),
        length: column(["uzunluq (m)", "uzunluq", "length"], 4),
        width: column(["en (m)", "en", "width"], 5),
        area: column(["sahə (m²)", "sahe (m2)", "area"], 6),
        currentDays: column(["neçə gündür", "nece gundur", "yığılıb (gün)", "yigilma gunu", "current days"], 7),
        note: column(["qeyd", "note"], 8),
        id: column(["qeyd id", "record id", "id"], 9),
        initialDays: column(["ilkin gün sayı", "ilkin gun sayi", "initial days"], 10),
        daysCountedOn: column(["hesab tarixi", "counted on"], 11)
    };
    const firstDataRow = headerIndex >= 0 ? headerIndex + 1 : 0;
    const grouped = new Map();
    rows.slice(firstDataRow).forEach(row => {
        const id = String(row[columns.id] ?? "").trim();
        const length = parseMeasurementNumber(row[columns.length]);
        const width = parseMeasurementNumber(row[columns.width]);
        if (!id || length <= 0 || width <= 0) return;
        const record = grouped.get(id) || {
            id,
            date: normalizeAreaCloudDate(row[columns.date]),
            company: String(row[columns.company] ?? "").trim() || "Şirkət qeyd edilməyib",
            vessel: String(row[columns.vessel] ?? "").trim(),
            areas: [],
            area: 0,
            note: String(row[columns.note] ?? "").trim()
        };
        const area = parseMeasurementNumber(row[columns.area]) || length * width;
        const currentDays = Math.floor(parseMeasurementNumber(row[columns.currentDays])) || 0;
        const initialDays = Math.floor(parseMeasurementNumber(row[columns.initialDays])) || currentDays;
        record.areas.push({
            location: String(row[columns.location] ?? `Sahə ${record.areas.length + 1}`).trim(),
            length,
            width,
            area,
            initialDays,
            daysCountedOn: normalizeAreaCloudDate(row[columns.daysCountedOn])
        });
        record.area += area;
        grouped.set(id, record);
    });
    if (rows.length > firstDataRow && !grouped.size) throw new Error("Cədvəldə Qeyd ID sütunu tapılmadı.");
    return [...grouped.values()].sort((a, b) => b.id.localeCompare(a.id));
}

async function fetchAreaMeasurementsFromCloud() {
    if (!areaMeasurementsApiUrl) return Promise.reject(new Error("Google Sheets bağlantısı qurulmayıb."));
    return new Promise((resolve, reject) => {
        const callbackName = `__limanAreaCallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const script = document.createElement("script");
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeout);
            script.remove();
            try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        };
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error) reject(error);
            else resolve(result);
        };
        const timeout = setTimeout(() => finish(new Error("Google Sheets-dən cavab gecikdi.")), 20000);
        window[callbackName] = payload => {
            try { finish(null, normalizeAreaCloudRecords(payload)); }
            catch (error) { finish(error); }
        };
        script.async = true;
        script.onerror = () => finish(new Error("Google Sheets bağlantısı açıla bilmədi."));
        const separator = areaMeasurementsApiUrl.includes("?") ? "&" : "?";
        script.src = `${areaMeasurementsApiUrl}${separator}callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
        document.head.appendChild(script);
    });
}

async function postAreaMeasurementMutation(action, record) {
    if (!currentAuthUser) throw new Error("Google Sheets üçün təsdiqlənmiş hesaba daxil olun.");
    const idToken = await currentAuthUser.getIdToken();
    await fetch(areaMeasurementsApiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, record, idToken })
    });
}

function enqueueAreaCloudTask(task) {
    const current = areaCloudQueue.then(task, task);
    areaCloudQueue = current.catch(() => {});
    return current;
}

function isAreaCloudRecordEquivalent(cloudRecord, desiredRecord) {
    const desired = normalizeAreaCloudRecord(desiredRecord);
    if (!desired || normalizeCell(cloudRecord.company) !== normalizeCell(desired.company)
        || normalizeCell(cloudRecord.vessel) !== normalizeCell(desired.vessel)
        || normalizeCell(cloudRecord.note) !== normalizeCell(desired.note)
        || normalizeAreaCloudDate(cloudRecord.date) !== desired.date
        || cloudRecord.areas.length !== desired.areas.length) return false;
    return desired.areas.every((area, index) => {
        const storedArea = cloudRecord.areas[index];
        return storedArea
            && normalizeCell(storedArea.location) === normalizeCell(area.location)
            && Math.abs(storedArea.length - area.length) < 0.0001
            && Math.abs(storedArea.width - area.width) < 0.0001
            && Math.abs(storedArea.area - area.area) < 0.0001
            && (Number(storedArea.initialDays) || 0) === (Number(area.initialDays) || 0)
            && normalizeAreaCloudDate(storedArea.daysCountedOn) === normalizeAreaCloudDate(area.daysCountedOn);
    });
}

async function confirmAreaCloudMutation(action, record) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const cloudRecords = await fetchAreaMeasurementsFromCloud();
        const storedRecord = cloudRecords.find(item => item.id === String(record.id));
        if ((action === "delete" && !storedRecord) || (action === "save" && storedRecord && isAreaCloudRecordEquivalent(storedRecord, record))) return cloudRecords;
        if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 450));
    }
    return null;
}

function syncAreaMeasurementMutation(action, record, successMessage, failureMessage, onSuccess) {
    if (!areaMeasurementsApiUrl || !currentAuthUser) {
        showActionToast("Google Sheets məlumatları üçün tətbiqə daxil olun.");
        return Promise.resolve(false);
    }
    showActionToast("Google Sheets yenilənir…");
    return enqueueAreaCloudTask(async () => {
        try {
            await postAreaMeasurementMutation(action, record);
            const cloudRecords = await confirmAreaCloudMutation(action, record);
            if (!cloudRecords) throw new Error("Google Sheets dəyişiklik təsdiqləmədi.");

            areaMeasurementRecords = cloudRecords;
            areaMeasurementsCloudLoaded = true;
            areaMeasurementsLoading = false;
            renderAreaMeasurements();
            if (typeof onSuccess === "function") onSuccess(cloudRecords);
            showActionToast(successMessage);
            return true;
        } catch (error) {
            console.warn("Sahə ölçüsü Google Sheets-ə sinxronlaşdırıla bilmədi:", error);
            try {
                areaMeasurementRecords = await fetchAreaMeasurementsFromCloud();
                areaMeasurementsCloudLoaded = true;
            } catch (_) {
                areaMeasurementsCloudLoaded = false;
            }
            areaMeasurementsLoading = false;
            renderAreaMeasurements();
            showActionToast(failureMessage);
            return false;
        }
    });
}

async function synchronizeAreaMeasurementsOnStart() {
    if (!areaMeasurementsApiUrl) {
        areaMeasurementsLoading = false;
        renderAreaMeasurements();
        return;
    }

    areaMeasurementsLoading = true;
    areaMeasurementsCloudLoaded = false;
    areaMeasurementRecords = [];
    renderAreaMeasurements();
    try {
        areaMeasurementRecords = await fetchAreaMeasurementsFromCloud();
        areaMeasurementsCloudLoaded = true;
    } catch (error) {
        areaMeasurementRecords = [];
        areaMeasurementsCloudLoaded = false;
        console.warn("Sahə ölçüləri Google Sheets-dən yüklənə bilmədi:", error);
        showActionToast(error?.message || "Sahə ölçülərini Google Sheets-dən yükləmək olmadı.");
    } finally {
        areaMeasurementsLoading = false;
        renderAreaMeasurements();
    }
}

function loadAreaMeasurements() {
    // Köhnə cihaz yaddaşındakı siyahı və növbədə qalmış dəyişikliklər artıq istifadə olunmur.
    try {
        localStorage.removeItem(areaMeasurementStorageKey);
        localStorage.removeItem(areaCloudMigrationKey);
        localStorage.removeItem(areaCloudPendingKey);
    } catch (error) {
        console.warn("Köhnə yerli sahə ölçüsü yaddaşı təmizlənmədi:", error);
    }

    areaMeasurementRecords = [];
    areaMeasurementsLoading = true;
    areaMeasurementsCloudLoaded = false;
    if (areaMeasurementList.children.length === 0) areaMeasurementList.appendChild(createAreaMeasurementBlock(0));
    renderAreaMeasurements();
    if (areaMeasurementsApiUrl) enqueueAreaCloudTask(synchronizeAreaMeasurementsOnStart);
}

addAreaMeasurementButton.addEventListener("click", () => {
    const count = areaMeasurementList.querySelectorAll("[data-area-block]").length;
    areaMeasurementList.appendChild(createAreaMeasurementBlock(count));
    updateAreaBlockNumbers();
    areaMeasurementList.querySelector("[data-area-block]:last-child [data-area-value='location']")?.focus();
});

areaMeasurementList.addEventListener("input", event => {
    if (event.target.matches("[data-area-value]")) updateAreaCalculation();
});

areaMeasurementList.addEventListener("click", event => {
    const removeButton = event.target.closest("[data-remove-area]");
    if (!removeButton) return;
    removeButton.closest("[data-area-block]").remove();
    updateAreaBlockNumbers();
    updateAreaCalculation();
});

areaRecordList.addEventListener("click", event => {
    const deleteAreaButton = event.target.closest("[data-delete-area]");
    const deleteRecordButton = event.target.closest("[data-delete-record]");
    if (!deleteAreaButton && !deleteRecordButton) return;

    const card = event.target.closest("[data-record-id]");
    const recordIndex = areaMeasurementRecords.findIndex(record => record.id === card?.dataset.recordId);
    if (recordIndex < 0) return;
    const record = areaMeasurementRecords[recordIndex];

    if (deleteRecordButton) {
        const confirmed = window.confirm(`${record.company} qeydi və bütün sahələri silinsin?`);
        if (!confirmed) return;
        syncAreaMeasurementMutation(
            "delete",
            { id: record.id },
            "Qeyd və sahələri Google Sheets-dən silindi.",
            "Qeyd Google Sheets-dən silinmədi. İnterneti yoxlayıb yenidən cəhd edin."
        );
        return;
    }

    const areaIndex = Number(deleteAreaButton.dataset.deleteArea);
    const targetArea = record.areas?.[areaIndex];
    if (!targetArea) return;
    const confirmed = window.confirm(`${targetArea.location || `Sahə ${areaIndex + 1}`} ölçüsü silinsin?`);
    if (!confirmed) return;

    const remainingAreas = record.areas.filter((_, index) => index !== areaIndex);
    if (remainingAreas.length) {
        const updatedRecord = {
            ...record,
            areas: remainingAreas,
            area: remainingAreas.reduce((sum, measurement) => sum + measurement.area, 0)
        };
        syncAreaMeasurementMutation(
            "save",
            updatedRecord,
            "Sahə silindi və Google Sheets yeniləndi.",
            "Sahə Google Sheets-də silinmədi. İnterneti yoxlayıb yenidən cəhd edin."
        );
    } else {
        syncAreaMeasurementMutation(
            "delete",
            { id: record.id },
            "Son sahə və qeyd Google Sheets-dən silindi.",
            "Qeyd Google Sheets-dən silinmədi. İnterneti yoxlayıb yenidən cəhd edin."
        );
    }
});

areaMeasurementForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!areaMeasurementForm.reportValidity()) return;

    const areas = getAreaMeasurementValues();
    const invalidAreaIndex = areas.findIndex(area => !area.location || !Number.isFinite(area.length) || !Number.isFinite(area.width) || area.length <= 0 || area.width <= 0 || !Number.isInteger(area.initialDays) || area.initialDays < 1);
    if (invalidAreaIndex >= 0) {
        const invalidBlock = areaMeasurementList.querySelectorAll("[data-area-block]")[invalidAreaIndex];
        const invalidField = !areas[invalidAreaIndex].location
            ? invalidBlock.querySelector('[data-area-value="location"]')
            : !Number.isFinite(areas[invalidAreaIndex].length) || areas[invalidAreaIndex].length <= 0
                ? invalidBlock.querySelector('[data-area-value="length"]')
                : !Number.isFinite(areas[invalidAreaIndex].width) || areas[invalidAreaIndex].width <= 0
                    ? invalidBlock.querySelector('[data-area-value="width"]')
                    : invalidBlock.querySelector('[data-area-value="initialDays"]');
        invalidField.focus();
        showActionToast("Hər sahənin yerini, ölçülərini və yığılma gün sayını düzgün yazın.");
        return;
    }

    const countedOn = localDateInputValue();
    const measuredAreas = areas.map(area => ({ ...area, area: area.length * area.width, daysCountedOn: countedOn }));

    const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        company: areaCompanyInput.value.trim(),
        vessel: areaVesselInput.value.trim(),
        areas: measuredAreas,
        area: measuredAreas.reduce((sum, area) => sum + area.area, 0),
        date: areaDateInput.value || localDateInputValue(),
        note: areaNoteInput.value.trim()
    };

    syncAreaMeasurementMutation(
        "save",
        record,
        "Sahə ölçüsü Google Sheets-də yadda saxlanıldı.",
        "Google Sheets-ə yazılmadı. Qeyd bu cihazda saxlanmayıb.",
        () => {
            areaMeasurementForm.reset();
            areaMeasurementList.replaceChildren(createAreaMeasurementBlock(0));
            areaDateInput.value = localDateInputValue();
            updateAreaCalculation();
        }
    );
});

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
    const codeIndex = headers.findIndex(value => value === "malın kodu" || value === "mal kodu" || value === "kod");
    const unitIndex = headers.findIndex(value => value === "ölçü vahidi" || value === "ölçü vahidi (ədəd)");

    const data = rows.slice(headerIndex + 1)
        .filter(Array.isArray)
        .map(row => ({
            "Rəf": String(row[shelfIndex] ?? "").trim(),
            "Malın Adı": String(row[nameIndex] ?? "").trim(),
            "Say": String(row[quantityIndex] ?? "").trim(),
            "Kod": codeIndex >= 0 ? String(row[codeIndex] ?? "").trim() : "",
            "Ölçü vahidi": unitIndex >= 0 ? String(row[unitIndex] ?? "").trim() : ""
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
            if (!issueGoodsApiUrl && issueStockRecords.length === 0) {
                issueStockRecords = anbarData.slice();
                if (issueGoodsView && !issueGoodsView.hidden) renderIssueGoodsList();
            }
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

function parseIssueQuantity(value) {
    const text = String(value ?? "").trim().replace(/[^\d,.-]/g, "");
    if (!text) return 0;
    let normalized = text;
    const comma = normalized.lastIndexOf(",");
    const dot = normalized.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
        const decimal = comma > dot ? "," : ".";
        const grouping = decimal === "," ? "." : ",";
        normalized = normalized.split(grouping).join("");
        if (decimal === ",") normalized = normalized.replace(",", ".");
    } else if (comma >= 0) {
        normalized = normalized.replace(",", ".");
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
}

function formatIssueQuantity(value) {
    return Number(value || 0).toLocaleString("az-AZ", { maximumFractionDigits: 3 });
}

function normalizeIssueStockRows(payload) {
    if (!payload?.ok || !Array.isArray(payload.records)) {
        throw new Error(payload?.error || "Anbar siyahısı oxunmadı.");
    }
    if (payload.records.some(record => !record || typeof record.name !== "string")) {
        throw new Error("Apps Script-i yeniləyib yenidən yayımlayın; köhnə server anbar siyahısını qaytarmadı.");
    }
    const rows = payload.records.map(record => ({
        "Cədvəl sətri": Number(record.sheetRow),
        "Rəf": String(record.shelf || ""),
        "Malın Adı": String(record.name || ""),
        "Say": String(record.quantity ?? "0"),
        "Kod": String(record.code || ""),
        "Ölçü vahidi": String(record.unit || "")
    })).filter(record => record["Malın Adı"]);
    if (rows.some(record => !Number.isInteger(record["Cədvəl sətri"]) || record["Cədvəl sətri"] < 1)) {
        throw new Error("Apps Script-i yeniləyib yayımlayın; anbar sətrinin nömrəsi alınmadı.");
    }
    return rows;
}

async function requestIssueGoodsApi(mode, extra = {}) {
    if (!issueGoodsApiUrl) throw new Error("Mal vermə serveri hələ qoşulmayıb.");
    if (!currentAuthUser) throw new Error("Davam etmək üçün tətbiq hesabınıza daxil olun.");
    const idToken = await currentAuthUser.getIdToken();
    return new Promise((resolve, reject) => {
        const callbackName = `__limanIssueCallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const script = document.createElement("script");
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeout);
            script.remove();
            try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        };
        const finish = (error, payload) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error) reject(error);
            else if (!payload?.ok) reject(new Error(payload?.error || "Mal vermə sorğusu təsdiqlənmədi."));
            else resolve(payload);
        };
        const timeout = setTimeout(() => finish(new Error("Serverdən cavab gecikdi. İnterneti yoxlayıb yenidən cəhd edin.")), 20000);
        window[callbackName] = payload => finish(null, payload);
        script.async = true;
        script.onerror = () => finish(new Error("Mal vermə serverinə qoşulmaq olmadı."));
        const params = new URLSearchParams({ mode, callback: callbackName, idToken, _: String(Date.now()), ...extra });
        script.src = `${issueGoodsApiUrl}${issueGoodsApiUrl.includes("?") ? "&" : "?"}${params.toString()}`;
        document.head.appendChild(script);
    });
}

function renderIssueGoodsList() {
    if (!issueGoodsList) return;
    const query = normalizeSearchText(issueGoodsSearchInput.value);
    const matches = issueStockRecords
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !query || [item["Malın Adı"], item["Kod"], item["Rəf"]].some(value => normalizeSearchText(value).includes(query)));
    issueGoodsList.replaceChildren();
    if (!matches.length) {
        const empty = document.createElement("li");
        empty.className = "issue-goods-empty";
        empty.textContent = issueStockRecords.length ? "Axtarışa uyğun mal tapılmadı." : "Anbar siyahısı boşdur və ya hələ yüklənməyib.";
        issueGoodsList.appendChild(empty);
        return;
    }

    matches.forEach(({ item, index }) => {
        const available = parseIssueQuantity(item["Say"]);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "issue-stock-card";
        button.disabled = available <= 0;
        button.setAttribute("aria-label", `${item["Malın Adı"]}, qalıq ${formatIssueQuantity(available)}`);

        const copy = document.createElement("span");
        copy.className = "issue-stock-copy";
        const name = document.createElement("strong");
        name.textContent = item["Malın Adı"] || "Adsız mal";
        const meta = document.createElement("span");
        meta.textContent = [item["Kod"] ? `Kod: ${item["Kod"]}` : "", item["Rəf"] ? `Rəf: ${item["Rəf"]}` : ""]
            .filter(Boolean).join(" · ") || "Anbar qalığı";
        copy.append(name, meta);

        const balance = document.createElement("span");
        balance.className = "issue-stock-balance";
        const balanceValue = document.createElement("strong");
        balanceValue.textContent = formatIssueQuantity(available);
        const unit = document.createElement("small");
        unit.textContent = item["Ölçü vahidi"] || "qalıq";
        balance.append(balanceValue, unit);

        const arrow = document.createElement("span");
        arrow.className = "issue-stock-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = available > 0 ? "↗" : "—";
        button.append(copy, balance, arrow);
        button.addEventListener("click", () => openIssueGoodsDialog(item, index));

        const row = document.createElement("li");
        row.appendChild(button);
        issueGoodsList.appendChild(row);
    });
}

function openIssueGoodsDialog(item) {
    selectedIssueStockItem = item;
    const available = parseIssueQuantity(item["Say"]);
    issueGoodsSelected.replaceChildren();
    const name = document.createElement("strong");
    name.textContent = item["Malın Adı"] || "Adsız mal";
    const details = document.createElement("span");
    details.textContent = item["Kod"] ? `Kod: ${item["Kod"]}` : "Kod göstərilməyib";
    const shelfLocation = document.createElement("div");
    shelfLocation.className = "issue-goods-shelf-location";
    const shelfLabel = document.createElement("span");
    shelfLabel.textContent = "RƏF / YER";
    const shelfValue = document.createElement("strong");
    shelfValue.textContent = item["Rəf"] || "Rəf qeyd olunmayıb";
    shelfLocation.append(shelfLabel, shelfValue);
    const balance = document.createElement("b");
    balance.textContent = `Qalıq: ${formatIssueQuantity(available)} ${item["Ölçü vahidi"] || ""}`.trim();
    issueGoodsSelected.append(name, details, shelfLocation, balance);
    issueGoodsQuantityInput.value = "";
    issueGoodsQuantityInput.max = String(available);
    issueGoodsDateInput.value = localDateInputValue();
    issueGoodsFormStatus.textContent = issueGoodsApiReady ? "" : "Apps Script yenilənib yayımlandıqdan sonra bu malı cədvələ yazmaq mümkün olacaq.";
    issueGoodsSubmitButton.disabled = !issueGoodsApiReady || available <= 0;
    issueGoodsSubmitButton.title = issueGoodsApiReady ? "" : "Apps Script yenilənib anbar siyahısı yüklənəndən sonra aktiv olacaq";
    issueGoodsDialog.showModal();
    requestAnimationFrame(() => issueGoodsQuantityInput.focus());
}
async function loadIssueGoodsInventory() {
    if (!issueGoodsView || issueGoodsView.hidden) return;
    issueGoodsRefreshButton.disabled = true;
    issueGoodsStatus.textContent = "Anbar siyahısı yenilənir…";
    try {
        if (!issueGoodsApiUrl) {
            issueGoodsApiReady = false;
            issueStockRecords = anbarData.slice();
            issueGoodsStatus.textContent = "Mallar anbar cədvəlindən göstərilir. Mal qalığını dəyişmək üçün server bağlantısı quraşdırılmalıdır.";
        } else {
            const payload = await requestIssueGoodsApi("inventory");
            issueStockRecords = normalizeIssueStockRows(payload);
            issueGoodsApiReady = true;
            anbarData = issueStockRecords.slice();
            issueGoodsStatus.textContent = `Anbar yeniləndi · ${issueStockRecords.length} mal`;
        }
        renderIssueGoodsList();
    } catch (error) {
        issueGoodsApiReady = false;
        issueGoodsStatus.textContent = error.message || "Anbar siyahısını yükləmək olmadı.";
        if (!issueStockRecords.length) issueStockRecords = anbarData.slice();
        renderIssueGoodsList();
    } finally {
        issueGoodsRefreshButton.disabled = false;
    }
}

function openIssueGoods() {
    if (currentAuthUser?.uid !== LIMAN_ADMIN_UID) {
        if (!currentAuthUser) openAccountPage("login");
        showActionToast(currentAuthUser ? "Mal vermək yalnız administrator hesabı ilə mümkündür." : "Mal vermək üçün administrator hesabına daxil olun.");
        return;
    }
    issueReturnView = distributionView.hidden ? "home" : "distribution";
    closeMenu();
    showView("issue-goods");
    issueGoodsSearchInput.value = "";
    void loadIssueGoodsInventory();
}

async function submitIssueGoods(event) {
    event.preventDefault();
    if (issueGoodsSaving || !selectedIssueStockItem || !issueGoodsForm.reportValidity()) return;
    const quantity = Number(issueGoodsQuantityInput.value);
    const available = parseIssueQuantity(selectedIssueStockItem["Say"]);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > available) {
        issueGoodsFormStatus.textContent = `Miqdar 0-dan çox və ${formatIssueQuantity(available)}-dan artıq olmamalıdır.`;
        issueGoodsQuantityInput.focus();
        return;
    }
    if (!issueGoodsApiReady) {
        issueGoodsFormStatus.textContent = "Mal vermə serveri hazır deyil; cədvələ heç nə yazılmadı.";
        return;
    }

    const record = {
        id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        code: selectedIssueStockItem["Kod"],
        name: selectedIssueStockItem["Malın Adı"],
        shelf: selectedIssueStockItem["Rəf"],
        sheetRow: selectedIssueStockItem["Cədvəl sətri"],
        unit: selectedIssueStockItem["Ölçü vahidi"],
        quantity,
        department: issueGoodsDepartmentInput.value.trim(),
        recipient: issueGoodsRecipientInput.value.trim(),
        date: issueGoodsDateInput.value || localDateInputValue()
    };
    issueGoodsSaving = true;
    issueGoodsSubmitButton.disabled = true;
    issueGoodsFormStatus.textContent = "Təhvil Google Sheets-ə yazılır…";
    try {
        if (!currentAuthUser) throw new Error("Hesabdan çıxmısınız. Yenidən daxil olun.");
        const idToken = await currentAuthUser.getIdToken();
        await fetch(issueGoodsApiUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "issue", record, idToken })
        });

        let confirmed = false;
        let confirmationError = null;
        for (let attempt = 0; attempt < 4 && !confirmed; attempt++) {
            if (attempt) await new Promise(resolve => setTimeout(resolve, 450));
            try {
                const result = await requestIssueGoodsApi("status", { requestId: record.id });
                confirmed = result.processed === true;
                if (result.error) throw new Error(result.error);
            } catch (error) {
                confirmationError = error;
            }
        }
        if (!confirmed) throw confirmationError || new Error("Server əməliyyatı təsdiqləmədi. Jurnalı yeniləyib yoxlayın.");

        issueGoodsDialog.close();
        issueGoodsForm.reset();
        issueGoodsFormStatus.textContent = "";
        showActionToast("Mal təhvil verildi, qalıq və paylama jurnalı yeniləndi.");
        await loadIssueGoodsInventory();
        void loadDistributionJournal();
    } catch (error) {
        console.error("Mal təhvil verilmədi:", error);
        issueGoodsFormStatus.textContent = error.message || "Mal vermə alınmadı. İnterneti yoxlayıb yenidən cəhd edin.";
        showActionToast(error.message || "Mal vermək olmadı.");
    } finally {
        issueGoodsSaving = false;
        issueGoodsSubmitButton.disabled = !issueGoodsApiReady || !selectedIssueStockItem || parseIssueQuantity(selectedIssueStockItem["Say"]) <= 0;
    }
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
    scanCameraStatus.textContent = "Kamera hazırlanır";
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
        scanCameraStatus.textContent = "Kamera aktivdir";
    } catch (error) {
        scannerRunning = false;
        scanCameraStatus.textContent = "Kamera açılmadı";
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

function readMarayWaterCache() {
    try {
        const records = JSON.parse(localStorage.getItem(marayWaterStorageKey) || "[]");
        return Array.isArray(records) ? records : [];
    } catch { return []; }
}

function readPendingMarayWaterRecords() {
    try {
        const records = JSON.parse(localStorage.getItem(marayWaterPendingKey) || "[]");
        return Array.isArray(records) ? records : [];
    } catch { return []; }
}

function saveMarayWaterCache(records) {
    marayWaterRecords = records;
    localStorage.setItem(marayWaterStorageKey, JSON.stringify(records));
    renderMarayWaterRecords();
}

function formatMarayWaterDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day) return "Tarix qeyd edilməyib";
    return new Date(year, month - 1, day).toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" });
}

function refreshMarayWaterAllocationRowNumbers() {
    const rows = [...marayWaterAllocationRows.querySelectorAll(".maray-water-allocation-row")];
    rows.forEach((row, index) => {
        const placeInput = row.querySelector("[data-allocation-place]");
        placeInput.setAttribute("aria-label", `${index + 1}-ci təhvil yeri`);
        if (!placeInput.value) placeInput.placeholder = index === 0 ? "1-ci post" : index === 1 ? "2-ci post" : index === 2 ? "İdarə" : "Təhvil yeri";
        const quantityInput = row.querySelector("[data-allocation-quantity]");
        quantityInput.setAttribute("aria-label", `${index + 1}-ci yer üçün butulka sayı`);
    });
    marayWaterAddAllocationButton.disabled = rows.length >= 20;
    marayWaterAddAllocationButton.setAttribute("aria-disabled", String(rows.length >= 20));
}

function addMarayWaterAllocationRow(values = {}, removable = false) {
    const row = document.createElement("div");
    row.className = "maray-water-allocation-row";

    const quantityLabel = document.createElement("label");
    quantityLabel.className = "maray-water-allocation-quantity";
    const quantityName = document.createElement("span");
    quantityName.className = "visually-hidden";
    quantityName.textContent = "Butulka sayı";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = "100000";
    quantityInput.step = "1";
    quantityInput.inputMode = "numeric";
    quantityInput.placeholder = "0";
    quantityInput.dataset.allocationQuantity = "";
    quantityInput.value = values.bottles || "";
    quantityLabel.append(quantityName, quantityInput);

    const placeLabel = document.createElement("label");
    placeLabel.className = "maray-water-allocation-place";
    const placeName = document.createElement("span");
    placeName.className = "visually-hidden";
    placeName.textContent = "Təhvil yeri";
    const placeInput = document.createElement("input");
    placeInput.type = "text";
    placeInput.maxLength = 100;
    placeInput.autocomplete = "off";
    placeInput.dataset.allocationPlace = "";
    placeInput.value = values.destination || "";
    placeLabel.append(placeName, placeInput);

    row.append(quantityLabel, placeLabel);
    if (removable) {
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "maray-water-remove-allocation";
        removeButton.setAttribute("aria-label", "Bu təhvil yerini sil");
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
            row.remove();
            refreshMarayWaterAllocationRowNumbers();
        });
        row.appendChild(removeButton);
    }
    marayWaterAllocationRows.appendChild(row);
    refreshMarayWaterAllocationRowNumbers();
}

function resetMarayWaterAllocationRows() {
    marayWaterAllocationRows.replaceChildren();
    addMarayWaterAllocationRow();
    addMarayWaterAllocationRow();
    addMarayWaterAllocationRow();
}

function clearMarayWaterEditMode() {
    editingMarayWaterId = null;
    marayWaterForm.classList.remove("is-editing");
    marayWaterSaveButton.innerHTML = '<span aria-hidden="true">＋</span> Qaiməni yadda saxla';
    marayWaterCancelEditButton.hidden = true;
}

function resetMarayWaterForm() {
    marayWaterForm.reset();
    resetMarayWaterAllocationRows();
    marayWaterDateInput.value = localDateInputValue();
    clearMarayWaterEditMode();
}

function beginMarayWaterEdit(record) {
    if (!currentAuthUser) {
        showActionToast("Qaiməni redaktə etmək üçün təsdiqlənmiş hesabınıza daxil olun.");
        return;
    }
    if (marayWaterSaving) return;
    editingMarayWaterId = record.id;
    marayWaterDateInput.value = record.date || localDateInputValue();
    marayWaterAllocationRows.replaceChildren();
    (record.allocations || []).forEach((allocation, index) => addMarayWaterAllocationRow(allocation, index > 0));
    if (!record.allocations?.length) addMarayWaterAllocationRow();
    marayWaterRecipientInput.value = record.recipient || "";
    marayWaterNoteInput.value = record.note || "";
    marayWaterSaveButton.innerHTML = '<span aria-hidden="true">✓</span> Dəyişikliyi yadda saxla';
    marayWaterCancelEditButton.hidden = false;
    marayWaterForm.classList.add("is-editing");
    marayWaterSyncNote.textContent = `${formatMarayWaterDate(record.date)} tarixli qaiməni redaktə edirsiniz.`;
    marayWaterForm.scrollIntoView({ behavior: "smooth", block: "start" });
    marayWaterDateInput.focus({ preventScroll: true });
}

function marayWaterRecordsMatch(first, second) {
    if (!first || !second) return false;
    if (String(first.date) !== String(second.date)
        || String(first.recipient || "") !== String(second.recipient || "")
        || String(first.note || "") !== String(second.note || "")) return false;
    const firstAllocations = first.allocations || [];
    const secondAllocations = second.allocations || [];
    return firstAllocations.length === secondAllocations.length
        && firstAllocations.every((item, index) =>
            String(item.destination || "") === String(secondAllocations[index].destination || "")
            && Number(item.bottles) === Number(secondAllocations[index].bottles));
}

function collectMarayWaterAllocations() {
    const rows = [...marayWaterAllocationRows.querySelectorAll(".maray-water-allocation-row")];
    const allocations = [];
    for (const row of rows) {
        const destinationInput = row.querySelector("[data-allocation-place]");
        const quantityInput = row.querySelector("[data-allocation-quantity]");
        const destination = destinationInput.value.trim();
        const rawQuantity = quantityInput.value.trim();
        if (!destination && !rawQuantity) continue;
        const bottles = Number(rawQuantity);
        if (!destination || !Number.isInteger(bottles) || bottles < 1 || bottles > 100000) {
            showActionToast("Hər sətirdə təhvil yerini və butulka sayını tamamlayın.");
            (destination ? quantityInput : destinationInput).focus();
            return null;
        }
        allocations.push({ destination, bottles });
    }
    if (!allocations.length) {
        showActionToast("Ən azı bir təhvil yeri və butulka sayı yazın.");
        marayWaterAllocationRows.querySelector("[data-allocation-place]")?.focus();
        return null;
    }
    return allocations;
}

function renderMarayWaterRecords() {
    const records = [...marayWaterRecords].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
    marayWaterCount.textContent = `${records.length} qaimə`;
    marayWaterTotal.textContent = `${records.reduce((sum, record) => sum + (record.allocations || []).reduce((total, item) => total + (Number(item.bottles) || 0), 0), 0)} butulka`;
    marayWaterRecordList.replaceChildren();
    if (!records.length) {
        const empty = document.createElement("li");
        empty.className = "maray-water-empty";
        empty.textContent = "Hələ Məray Su təhvili qeyd edilməyib.";
        marayWaterRecordList.appendChild(empty);
        return;
    }
    records.forEach(record => {
        const card = document.createElement("li");
        card.className = "maray-water-record-card";
        const top = document.createElement("div");
        top.className = "maray-water-record-top";
        const heading = document.createElement("div");
        heading.className = "maray-water-record-heading";
        const kicker = document.createElement("span");
        kicker.className = "maray-water-record-kicker";
        kicker.textContent = "MƏRAY SU  ·  TƏHVİL QAİMƏSİ";
        const destination = document.createElement("strong");
        destination.className = "maray-water-record-destination";
        destination.textContent = formatMarayWaterDate(record.date);
        heading.append(kicker, destination);

        const actions = document.createElement("div");
        actions.className = "maray-water-record-actions";
        const quantity = document.createElement("span");
        quantity.className = "maray-water-record-quantity";
        const bottleTotal = (record.allocations || []).reduce((sum, item) => sum + (Number(item.bottles) || 0), 0);
        quantity.textContent = `${bottleTotal} butulka`;
        const editButton = document.createElement("button");
        editButton.className = "maray-water-edit-button";
        editButton.type = "button";
        editButton.dataset.editMarayWater = record.id;
        editButton.setAttribute("aria-label", "Məray Su qaiməsini redaktə et");
        editButton.title = "Qaiməni redaktə et";
        editButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/></svg>';
        const deleteButton = document.createElement("button");
        deleteButton.className = "maray-water-delete-button";
        deleteButton.type = "button";
        deleteButton.dataset.deleteMarayWater = record.id;
        deleteButton.setAttribute("aria-label", "Məray Su qaiməsini sil");
        deleteButton.title = "Qaiməni sil";
        deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>';
        actions.append(quantity, editButton, deleteButton);
        top.append(heading, actions);

        const allocationList = document.createElement("div");
        allocationList.className = "maray-water-record-allocations";
        (record.allocations || []).forEach(allocation => {
            const allocationLine = document.createElement("div");
            allocationLine.className = "maray-water-record-allocation";
            const place = document.createElement("span");
            place.textContent = allocation.destination || "Təhvil yeri qeyd edilməyib";
            const amount = document.createElement("strong");
            amount.textContent = `${Number(allocation.bottles) || 0} butulka`;
            allocationLine.append(place, amount);
            allocationList.appendChild(allocationLine);
        });

        const details = document.createElement("div");
        details.className = "maray-water-record-details";
        const recipient = document.createElement("span");
        recipient.textContent = `Qəbul edən: ${record.recipient || "—"}`;
        details.append(recipient);
        card.append(top, allocationList, details);
        if (record.note) {
            const note = document.createElement("p");
            note.className = "maray-water-record-note";
            note.textContent = record.note;
            card.appendChild(note);
        }
        marayWaterRecordList.appendChild(card);
    });
}

function normalizeMarayWaterRecords(payload) {
    if (payload?.ok === false || payload?.success === false) {
        throw new Error(payload.error || payload.message || "Məray Su cədvəlindən cavab alınmadı.");
    }
    const source = Array.isArray(payload) ? payload : payload?.records;
    if (!Array.isArray(source)) throw new Error("Məray Su cədvəlində qeydlər tapılmadı.");
    return source.map(record => ({
        id: String(record.id || record.recordId || ""),
        date: String(record.date || ""),
        allocations: Array.isArray(record.allocations)
            ? record.allocations.map(item => ({ destination: String(item.destination || ""), bottles: Math.max(0, Math.floor(Number(item.bottles) || 0)) }))
            : record.destination ? [{ destination: String(record.destination), bottles: Math.max(0, Math.floor(Number(record.bottles) || 0)) }] : [],
        recipient: String(record.recipient || ""),
        note: String(record.note || "")
    })).filter(record => record.id);
}

async function fetchMarayWaterRecordsFromCloud() {
    if (!marayWaterApiUrl) throw new Error("Məray Su üçün Google Sheets bağlantısı qurulmayıb.");
    if (!currentAuthUser) throw new Error("Məray Su qeydləri üçün təsdiqlənmiş hesaba daxil olun.");
    const idToken = await currentAuthUser.getIdToken();
    return new Promise((resolve, reject) => {
        const callbackName = `__limanMarayCallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const script = document.createElement("script");
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeout);
            script.remove();
            try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        };
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error) reject(error);
            else resolve(result);
        };
        const timeout = setTimeout(() => finish(new Error("Google Sheets-dən cavab gecikdi.")), 20000);
        window[callbackName] = payload => {
            try { finish(null, normalizeMarayWaterRecords(payload)); }
            catch (error) { finish(error); }
        };
        script.async = true;
        script.onerror = () => finish(new Error("Məray Su Google Sheets bağlantısı açıla bilmədi."));
        const separator = marayWaterApiUrl.includes("?") ? "&" : "?";
        script.src = `${marayWaterApiUrl}${separator}callback=${encodeURIComponent(callbackName)}&idToken=${encodeURIComponent(idToken)}&_=${Date.now()}`;
        document.head.appendChild(script);
    });
}

async function postMarayWaterMutation(action, record) {
    if (!currentAuthUser) throw new Error("Məray Su qaiməsi üçün hesaba daxil olun.");
    const idToken = await currentAuthUser.getIdToken();
    await fetch(marayWaterApiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, record, idToken })
    });
}

async function deleteMarayWaterRecord(recordId) {
    try {
        await postMarayWaterMutation("delete", { id: recordId });
        const cloudRecords = await fetchMarayWaterRecordsFromCloud();
        if (cloudRecords.some(record => record.id === recordId)) {
            throw new Error("Qaimənin silinməsi Google Sheets-də təsdiqlənmədi. İnterneti yoxlayıb yenidən cəhd edin.");
        }
        saveMarayWaterCache(marayWaterRecords.filter(record => record.id !== recordId));
        removePendingMarayWaterRecord(recordId);
        marayWaterSyncNote.textContent = "Qaimə tətbiqdən və Google Sheets-dən silindi.";
        pendingMarayWaterDelete = null;
        areaRecordDialog.close();
        showActionToast("Məray Su qaiməsi silindi.");
        return true;
    } catch (error) {
        console.error("Məray Su qaiməsi silinmədi", error);
        marayWaterSyncNote.textContent = "Qaimə silinmədi. Google Sheets ilə bağlantını yoxlayın.";
        showActionToast(error.message || "Qaiməni silmək olmadı. İnterneti yoxlayın.");
        return false;
    }
}

async function loadMarayWaterRecords() {
    if (!currentAuthUser) {
        marayWaterRecords = [];
        renderMarayWaterRecords();
        marayWaterSyncNote.textContent = "Qaimələri görmək və yazmaq üçün təsdiqlənmiş hesabınıza daxil olun.";
        return;
    }
    if (!marayWaterApiUrl) {
        marayWaterRecords = [];
        renderMarayWaterRecords();
        marayWaterSyncNote.textContent = "Google Sheets bağlantısı qurulandan sonra qeydlər Excel-ə də yazılacaq.";
        return;
    }
    marayWaterRecords = readMarayWaterCache();
    renderMarayWaterRecords();
    marayWaterSyncNote.textContent = "Məray Su qaimələri yüklənir…";
    try {
        for (const record of readPendingMarayWaterRecords()) {
            try { await postMarayWaterMutation("save", record); } catch (_) { /* İnternet qayıdanda yenidən yoxlanacaq. */ }
        }
        const records = await fetchMarayWaterRecordsFromCloud();
        const cloudIds = new Set(records.map(record => record.id));
        const remainingPending = readPendingMarayWaterRecords().filter(record => !cloudIds.has(record.id));
        const pendingIds = new Set(remainingPending.map(record => record.id));
        const pending = readMarayWaterCache().filter(record => pendingIds.has(record.id));
        const merged = [...records];
        pending.forEach(record => { if (!merged.some(item => item.id === record.id)) merged.push(record); });
        saveMarayWaterCache(merged);
        localStorage.setItem(marayWaterPendingKey, JSON.stringify(remainingPending));
        marayWaterSyncNote.textContent = remainingPending.length
            ? `${remainingPending.length} qaimə internet bərpa olunanda cədvələ göndəriləcək.`
            : "Qeydlər Google Sheets-lə sinxronlaşdırıldı.";
    } catch (error) {
        marayWaterSyncNote.textContent = error.message || "Məray Su qeydləri yüklənmədi.";
    }
}

function addPendingMarayWaterRecord(record) {
    const pending = readPendingMarayWaterRecords().filter(item => item.id !== record.id);
    pending.push(record);
    localStorage.setItem(marayWaterPendingKey, JSON.stringify(pending));
}

function removePendingMarayWaterRecord(recordId) {
    localStorage.setItem(marayWaterPendingKey, JSON.stringify(readPendingMarayWaterRecords().filter(item => item.id !== recordId)));
}

async function openMarayWaterPage() {
    await stopScanner();
    showView("maray-water");
    if (!marayWaterDateInput.value) marayWaterDateInput.value = localDateInputValue();
    await loadMarayWaterRecords();
}

marayWaterForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (marayWaterSaving) return;
    if (!marayWaterForm.reportValidity()) return;
    if (!currentAuthUser) {
        showActionToast("Qaimə yazmaq üçün təsdiqlənmiş hesabınıza daxil olun.");
        openAccountPage("login");
        return;
    }
    if (!marayWaterApiUrl) {
        marayWaterSyncNote.textContent = "Google Sheets bağlantısı hələ qurulmayıb. Tətbiq ayarlarına Web App linki əlavə edilməlidir.";
        showActionToast("Google Sheets bağlantısı hələ qurulmayıb.");
        return;
    }
    const allocations = collectMarayWaterAllocations();
    if (!allocations) return;
    const isEditing = Boolean(editingMarayWaterId);
    const recordId = editingMarayWaterId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
        id: recordId,
        date: marayWaterDateInput.value,
        allocations,
        recipient: marayWaterRecipientInput.value.trim(),
        note: marayWaterNoteInput.value.trim()
    };
    marayWaterSaving = true;
    marayWaterSaveButton.disabled = true;
    marayWaterCancelEditButton.disabled = true;
    addPendingMarayWaterRecord(record);
    saveMarayWaterCache([record, ...marayWaterRecords.filter(item => item.id !== record.id)]);
    if (!isEditing) resetMarayWaterForm();
    marayWaterSyncNote.textContent = isEditing
        ? "Qaimədəki dəyişikliklər Google Sheets-ə göndərilir…"
        : "Qaimə Google Sheets-ə göndərilir…";
    try {
        await postMarayWaterMutation("save", record);
        let confirmed = false;
        for (let attempt = 0; attempt < 4; attempt++) {
            const cloudRecords = await fetchMarayWaterRecordsFromCloud();
            const cloudRecord = cloudRecords.find(item => item.id === record.id);
            if (cloudRecord && (!isEditing || marayWaterRecordsMatch(cloudRecord, record))) {
                saveMarayWaterCache(cloudRecords);
                confirmed = true;
                break;
            }
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!confirmed) throw new Error(isEditing
            ? "Dəyişiklik Google Sheets-də təsdiqlənmədi. Qaimə cihazda saxlanıldı."
            : "Qaimə cədvəldə təsdiqlənmədi.");
        removePendingMarayWaterRecord(record.id);
        if (isEditing) {
            resetMarayWaterForm();
            marayWaterSyncNote.textContent = "Qaimədəki dəyişikliklər Google Sheets-də yadda saxlanıldı.";
            showActionToast("Məray Su qaiməsi yeniləndi.");
        } else {
            marayWaterSyncNote.textContent = "Qaimə Google Sheets-də yadda saxlanıldı.";
            showActionToast("Məray Su qaiməsi yadda saxlanıldı.");
        }
    } catch (error) {
        addPendingMarayWaterRecord(record);
        marayWaterSyncNote.textContent = isEditing
            ? "Dəyişiklik cihazda saxlanıldı, Google Sheets-lə sinxronizasiya gözləyir."
            : "Qaimə cihazda qaldı, amma Google Sheets-ə göndərilməsi təsdiqlənmədi.";
        showActionToast(error.message || (isEditing
            ? "Dəyişiklikləri Google Sheets-ə göndərmək olmadı."
            : "Qaiməni Google Sheets-ə göndərmək olmadı."));
    } finally {
        marayWaterSaving = false;
        marayWaterSaveButton.disabled = false;
        marayWaterCancelEditButton.disabled = false;
    }
});

document.querySelectorAll(".maray-water-open").forEach(button => button.addEventListener("click", () => void openMarayWaterPage()));
marayWaterRecordList.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-maray-water]");
    if (editButton) {
        const record = marayWaterRecords.find(item => item.id === editButton.dataset.editMarayWater);
        if (record) beginMarayWaterEdit(record);
        return;
    }
    const deleteButton = event.target.closest("[data-delete-maray-water]");
    if (!deleteButton || !currentAuthUser) return;
    const record = marayWaterRecords.find(item => item.id === deleteButton.dataset.deleteMarayWater);
    if (!record) return;
    pendingMarayWaterDelete = { record, busy: false };
    areaDialogKicker.textContent = "MƏRAY SU QAİMƏSİ";
    renderMarayWaterDeleteConfirmation(record);
    if (!areaRecordDialog.open) areaRecordDialog.showModal();
});
marayWaterCancelEditButton.addEventListener("click", () => {
    if (marayWaterSaving) return;
    resetMarayWaterForm();
    marayWaterSyncNote.textContent = "Yeni Məray Su qaiməsi əlavə edə bilərsiniz.";
});
document.getElementById("maray-water-home").addEventListener("click", () => showView("home"));
marayWaterAddAllocationButton.addEventListener("click", () => {
    if (marayWaterAllocationRows.querySelectorAll(".maray-water-allocation-row").length < 20) addMarayWaterAllocationRow({}, true);
});
resetMarayWaterAllocationRows();

function makeAreaCountField(labelText, key, placeholder, type = "text") {
    const label = document.createElement("label");
    label.className = "area-field";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement("input");
    input.type = type;
    input.dataset.areaCountValue = key;
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.required = true;
    if (key === "quantity") {
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
    } else {
        input.maxLength = "120";
    }
    label.append(caption, input);
    return label;
}

function addAreaCountRow(values = {}, focusNew = false) {
    const entry = document.createElement("div");
    entry.className = "area-count-entry";
    entry.dataset.areaCountRow = "";

    const heading = document.createElement("div");
    heading.className = "area-count-entry-heading";
    const title = document.createElement("strong");
    title.className = "area-count-entry-title";
    const remove = document.createElement("button");
    remove.className = "area-count-remove-row";
    remove.type = "button";
    remove.dataset.removeAreaCountRow = "";
    remove.setAttribute("aria-label", "Sayım qeydini sil");
    remove.title = "Bu qeydi sil";
    remove.textContent = "×";
    heading.append(title, remove);

    const fields = document.createElement("div");
    fields.className = "area-count-row-fields";
    const nameField = makeAreaCountField("Əşyanın adı", "name", "Məsələn, yanğın balonu");
    const locationField = makeAreaCountField("Yer / zona", "location", "Məsələn, Post 1");
    const quantityField = makeAreaCountField("Miqdar", "quantity", "0", "number");
    nameField.querySelector("input").value = values.name || "";
    locationField.querySelector("input").value = values.location || "";
    quantityField.querySelector("input").value = values.quantity ?? "";
    fields.append(nameField, locationField, quantityField);
    entry.append(heading, fields);
    areaCountRows.append(entry);
    updateAreaCountRows();
    if (focusNew) nameField.querySelector("input").focus();
}

function updateAreaCountRows() {
    const entries = [...areaCountRows.querySelectorAll("[data-area-count-row]")];
    entries.forEach((entry, index) => {
        entry.querySelector(".area-count-entry-title").textContent = `QEYD ${index + 1}`;
        const remove = entry.querySelector("[data-remove-area-count-row]");
        remove.disabled = entries.length === 1;
    });
    const hasInput = entries.some(entry => [...entry.querySelectorAll("input")].some(input => input.value.trim() !== ""))
        || Boolean(areaCountNoteInput.value.trim());
    areaCountActions.hidden = !hasInput;
    areaCountSaveButton.textContent = editingAreaCountReportId ? "Dəyişiklikləri saxla" : "Yadda saxla";
}

function readAreaCountReports() {
    try {
        const parsed = JSON.parse(localStorage.getItem(areaCountReportsStorageKey) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(report => report && typeof report.id === "string" && Array.isArray(report.items));
    } catch (_) {
        return [];
    }
}

function persistAreaCountReports() {
    try {
        localStorage.setItem(areaCountReportsStorageKey, JSON.stringify(areaCountReports));
        return true;
    } catch (error) {
        console.error("Ərazi sayımlarını cihazda saxlamaq olmadı:", error);
        return false;
    }
}

function collectAreaCountForm() {
    if (!areaCountForm.reportValidity()) return null;
    const items = [...areaCountRows.querySelectorAll("[data-area-count-row]")].map(entry => ({
        name: entry.querySelector('[data-area-count-value="name"]').value.trim(),
        location: entry.querySelector('[data-area-count-value="location"]').value.trim(),
        quantity: Number(entry.querySelector('[data-area-count-value="quantity"]').value)
    }));
    if (!items.length || items.some(item => !item.name || !item.location || !Number.isInteger(item.quantity) || item.quantity < 0)) {
        showActionToast("Hər qeyddə əşyanın adını, yerini və tam miqdarını yazın.");
        return null;
    }
    return { date: areaCountDateInput.value, note: areaCountNoteInput.value.trim(), items };
}

function createAreaCountId() {
    return globalThis.crypto?.randomUUID?.() || `sayim-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatAreaCountDate(value) {
    const parts = String(value || "").split("-");
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value || "Tarix yoxdur";
}

function renderAreaCountReports() {
    const query = areaCountSearchInput.value.trim().toLocaleLowerCase("az");
    const reports = [...areaCountReports].sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
    areaCountSavedCount.textContent = `${reports.length} qeyd`;
    areaCountSavedList.replaceChildren();

    const filtered = query ? reports.filter(report => {
        const searchable = [report.date, report.note, ...(report.items || []).flatMap(item => [item.name, item.location, item.quantity])]
            .join(" ").toLocaleLowerCase("az");
        return searchable.includes(query);
    }) : reports;

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "area-count-saved-empty";
        empty.textContent = reports.length ? "Axtarışa uyğun sayım tapılmadı." : "Hələ sayım yadda saxlanmayıb.";
        areaCountSavedList.append(empty);
        return;
    }

    filtered.forEach(report => {
        const card = document.createElement("article");
        card.className = "area-count-saved-card";
        const heading = document.createElement("div");
        heading.className = "area-count-saved-card-heading";
        const title = document.createElement("strong");
        title.textContent = `Sayım · ${formatAreaCountDate(report.date)}`;
        const total = (report.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const meta = document.createElement("span");
        meta.textContent = `${report.items.length} qeyd · cəmi ${total} ədəd`;
        heading.append(title, meta);

        const preview = document.createElement("p");
        preview.className = "area-count-saved-preview";
        const visibleItems = report.items.slice(0, 3).map(item => `${item.name} · ${item.location} · ${item.quantity}`);
        if (report.items.length > 3) visibleItems.push(`+ ${report.items.length - 3} başqa qeyd`);
        preview.textContent = visibleItems.join("  |  ");

        const actions = document.createElement("div");
        actions.className = "area-count-saved-actions";
        [
            ["open", "Aç / redaktə et"],
            ["excel", "Excel"],
            ["delete", "Sil"]
        ].forEach(([action, label]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.areaCountAction = action;
            button.dataset.areaCountId = report.id;
            button.textContent = label;
            actions.append(button);
        });
        card.append(heading, preview, actions);
        areaCountSavedList.append(card);
    });
}

function resetAreaCountForm() {
    editingAreaCountReportId = null;
    areaCountDateInput.value = localDateInputValue();
    areaCountNoteInput.value = "";
    areaCountRows.replaceChildren();
    addAreaCountRow();
}

function saveAreaCountReport() {
    const formData = collectAreaCountForm();
    if (!formData) return;
    const existing = areaCountReports.find(report => report.id === editingAreaCountReportId);
    const report = {
        ...formData,
        id: existing?.id || createAreaCountId(),
        savedAt: new Date().toISOString()
    };
    const previous = areaCountReports;
    areaCountReports = existing
        ? areaCountReports.map(item => item.id === report.id ? report : item)
        : [...areaCountReports, report];
    if (!persistAreaCountReports()) {
        areaCountReports = previous;
        showActionToast("Cihaz yaddaşına yazmaq olmadı. Brauzer yaddaşını yoxlayın.");
        return;
    }
    renderAreaCountReports();
    resetAreaCountForm();
    areaCountStatus.textContent = "Sayım bu cihazda yadda saxlanıldı. Sonra siyahıdan aça və Excel kimi endirə bilərsiniz.";
    showActionToast("Sayım yadda saxlanıldı.");
}

function openSavedAreaCountReport(report) {
    editingAreaCountReportId = report.id;
    areaCountDateInput.value = report.date || localDateInputValue();
    areaCountNoteInput.value = report.note || "";
    areaCountRows.replaceChildren();
    (report.items || []).forEach(item => addAreaCountRow(item));
    if (!report.items?.length) addAreaCountRow();
    updateAreaCountRows();
    areaCountStatus.textContent = "Saxlanılan sayım açıldı. Dəyişiklikləri yadda saxlaya və ya Excel kimi endirə bilərsiniz.";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

areaCountSaveButton.addEventListener("click", saveAreaCountReport);
areaCountExportButton.addEventListener("click", async () => {
    const formData = collectAreaCountForm();
    if (!formData) return;
    areaCountExportButton.disabled = true;
    areaCountStatus.textContent = "Excel hesabatı hazırlanır…";
    try {
        await downloadAreaCountWorkbook(formData.items, formData.date, formData.note);
        areaCountStatus.textContent = "Excel faylı endirildi. Qeydi siyahıda saxlamaq üçün “Yadda saxla” düyməsinə basın.";
        showActionToast("Ərazi sayımı Excel faylı kimi endirildi.");
    } catch (error) {
        console.error("Ərazi sayımı Excel faylı yaradıla bilmədi:", error);
        areaCountStatus.textContent = error.message || "Excel faylını yaratmaq olmadı.";
        showActionToast(error.message || "Excel faylını yaratmaq olmadı.");
    } finally {
        areaCountExportButton.disabled = false;
    }
});

areaCountSavedList.addEventListener("click", async event => {
    const button = event.target.closest("[data-area-count-action]");
    if (!button) return;
    const report = areaCountReports.find(item => item.id === button.dataset.areaCountId);
    if (!report) return;
    if (button.dataset.areaCountAction === "open") {
        openSavedAreaCountReport(report);
    } else if (button.dataset.areaCountAction === "excel") {
        try {
            await downloadAreaCountWorkbook(report.items, report.date, report.note || "");
            showActionToast("Saxlanılan sayım Excel kimi endirildi.");
        } catch (error) {
            showActionToast(error.message || "Excel faylını yaratmaq olmadı.");
        }
    } else if (button.dataset.areaCountAction === "delete") {
        if (!window.confirm(`${formatAreaCountDate(report.date)} tarixli sayım silinsin?`)) return;
        const previous = areaCountReports;
        areaCountReports = areaCountReports.filter(item => item.id !== report.id);
        if (!persistAreaCountReports()) {
            areaCountReports = previous;
            showActionToast("Sayımı cihaz yaddaşından silmək olmadı.");
            return;
        }
        if (editingAreaCountReportId === report.id) resetAreaCountForm();
        renderAreaCountReports();
        showActionToast("Sayım yaddaşdan silindi.");
    }
});

areaCountSearchInput.addEventListener("input", renderAreaCountReports);
areaCountNoteInput.addEventListener("input", updateAreaCountRows);
areaCountForm.addEventListener("submit", event => event.preventDefault());

function xmlEscape(value) {
    return String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function inlineExcelCell(reference, value, style = 4) {
    return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function numberExcelCell(reference, value, style = 5) {
    return `<c r="${reference}" s="${style}" t="n"><v>${Number(value)}</v></c>`;
}

function buildAreaCountWorksheet(records, date, note) {
    const lastRow = records.length + 4;
    const dateText = String(date || "").split("-").reverse().join(".");
    const rows = [
        `<row r="1" ht="30" customHeight="1">${inlineExcelCell("A1", "ƏRAZİ SAYIM HESABATI", 1)}</row>`,
        `<row r="2" ht="23" customHeight="1">${inlineExcelCell("A2", "Sayım tarixi", 3)}${inlineExcelCell("B2", dateText, 4)}${inlineExcelCell("C2", "Qeyd sayı", 3)}${numberExcelCell("D2", records.length, 5)}</row>`,
        `<row r="3" ht="24" customHeight="1">${inlineExcelCell("A3", note ? `Ümumi qeyd: ${note}` : "Ümumi qeyd: —", 4)}</row>`,
        `<row r="4" ht="28" customHeight="1">${inlineExcelCell("A4", "№", 2)}${inlineExcelCell("B4", "Əşyanın adı", 2)}${inlineExcelCell("C4", "Yer / zona", 2)}${inlineExcelCell("D4", "Miqdar", 2)}</row>`
    ];
    records.forEach((record, index) => {
        const row = index + 5;
        rows.push(`<row r="${row}" ht="24" customHeight="1">${numberExcelCell(`A${row}`, index + 1, 6)}${inlineExcelCell(`B${row}`, record.name, 4)}${inlineExcelCell(`C${row}`, record.location, 4)}${numberExcelCell(`D${row}`, record.quantity, 6)}</row>`);
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:D${lastRow}"/>` +
        `<sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView></sheetViews>` +
        `<sheetFormatPr defaultRowHeight="21"/><cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/><col min="3" max="3" width="30" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/></cols>` +
        `<sheetData>${rows.join("")}</sheetData><autoFilter ref="A4:D${lastRow}"/><mergeCells count="2"><mergeCell ref="A1:D1"/><mergeCell ref="A3:D3"/></mergeCells>` +
        `<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
}

async function downloadAreaCountWorkbook(records, date, note) {
    if (typeof window.JSZip !== "function") throw new Error("Excel faylını yaratmaq üçün lazım olan hissə yüklənmədi.");
    const zip = new window.JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`);
    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
    zip.folder("xl").file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ərazi sayımı" sheetId="1" r:id="rId1"/></sheets></workbook>`);
    zip.folder("xl").folder("_rels").file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.folder("xl").file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FF24364A"/><name val="Aptos Display"/></font><font><b/><sz val="11"/><color rgb="FF24364A"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF0F5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD7E0E8"/></left><right style="thin"><color rgb="FFD7E0E8"/></right><top style="thin"><color rgb="FFD7E0E8"/></top><bottom style="thin"><color rgb="FFD7E0E8"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color rgb="FFB9C7D4"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="2" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
    zip.folder("xl").folder("worksheets").file("sheet1.xml", buildAreaCountWorksheet(records, date, note));
    const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `erazi-sayimi-${date || localDateInputValue()}.xlsx`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function openAreaCountPage() {
    scanHandled = false;
    void stopScanner();
    if (!areaCountDateInput.value) areaCountDateInput.value = localDateInputValue();
    if (!areaCountRows.children.length) addAreaCountRow();
    updateAreaCountRows();
    showView("area-count");
}

areaCountRows.addEventListener("input", updateAreaCountRows);
areaCountRows.addEventListener("click", event => {
    const removeButton = event.target.closest("[data-remove-area-count-row]");
    if (!removeButton) return;
    const entry = removeButton.closest("[data-area-count-row]");
    if (areaCountRows.children.length > 1) entry.remove();
    else entry.querySelectorAll("input").forEach(input => { input.value = ""; });
    updateAreaCountRows();
});
areaCountAddRowButton.addEventListener("click", () => {
    if (areaCountRows.children.length >= 30) {
        showActionToast("Bir hesabatda ən çox 30 qeyd əlavə etmək olar.");
        return;
    }
    addAreaCountRow({}, true);
});
areaCountDateInput.value = localDateInputValue();
addAreaCountRow();
renderAreaCountReports();
document.querySelectorAll(".area-count-open").forEach(button => button.addEventListener("click", openAreaCountPage));
document.getElementById("area-count-home").addEventListener("click", () => showView("home"));

document.getElementById("start-scan").addEventListener("click", startScan);
function openPortMap() {
    if (!portMapDialog.open) portMapDialog.showModal();
}
portMapOpenButton.addEventListener("click", openPortMap);
portMapOpenMobileButton.addEventListener("click", openPortMap);
portMapCloseButton.addEventListener("click", () => portMapDialog.close());
portMapDialog.addEventListener("click", event => {
    if (event.target === portMapDialog) portMapDialog.close();
});
document.getElementById("home-area-measurement").addEventListener("click", function () {
    scanHandled = false;
    void stopScanner();
    showView("area-measurement");
    renderAreaMeasurements();
});
document.getElementById("cancel-scan").addEventListener("click", returnHome);
document.getElementById("return-home").addEventListener("click", returnHome);
document.getElementById("about-home").addEventListener("click", returnHome);
document.getElementById("recent-distribution-open").addEventListener("click", () => {
    showView("distribution");
    loadDistributionJournal();
});
document.getElementById("area-summary-open").addEventListener("click", () => {
    scanHandled = false;
    void stopScanner();
    showView("area-measurement");
    renderAreaMeasurements();
});
function showDistributionError(message) {
    distributionStatus.textContent = message;
    distributionStatus.classList.add("journal-status-error");
    journalMatchCount.textContent = "—";
    renderRecentMessage("Paylama məlumatları yüklənmədi.");
    dashboardRecordCount.textContent = "—";
    dashboardQuantityTotal.textContent = "—";
}

async function loadDistributionJournal() {
    if (distributionLoading) {
        distributionRefreshQueued = true;
        return;
    }
    distributionLoading = true;
    const csvUrl = distributionPublicCsvUrl;
    distributionStatus.classList.remove("journal-status-error");
    distributionStatus.textContent = "Paylama jurnalı yüklənir…";
    distributionResults.hidden = true;
    if (!csvUrl || !window.Papa) {
        showDistributionError("Paylama jurnalı bağlantısı qurulmayıb.");
        distributionLoading = false;
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
    } finally {
        distributionLoading = false;
        if (distributionRefreshQueued) {
            distributionRefreshQueued = false;
            void loadDistributionJournal();
        }
    }
}

distributionRefreshButton.addEventListener("click", loadDistributionJournal);
distributionSearchForm.addEventListener("submit", event => {
    event.preventDefault();
    renderFilteredDistribution();
});
distributionSearchClear.addEventListener("click", () => {
    distributionSearchInput.value = "";
    renderFilteredDistribution();
    distributionSearchInput.focus();
});
distributionSearchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        distributionSearchInput.value = "";
        renderFilteredDistribution();
    }
});
issueGoodsButton.addEventListener("click", function () {
    openIssueGoods();
});
document.getElementById("home-issue-goods").addEventListener("click", function () {
    openIssueGoods();
});
issueGoodsBackButton.addEventListener("click", () => showView(issueReturnView));
issueGoodsSearchInput.addEventListener("input", renderIssueGoodsList);
issueGoodsRefreshButton.addEventListener("click", () => void loadIssueGoodsInventory());
issueGoodsForm.addEventListener("submit", submitIssueGoods);
issueGoodsCancelButton.addEventListener("click", () => issueGoodsDialog.close());
issueGoodsDialogCloseButton.addEventListener("click", () => issueGoodsDialog.close());

loginPlaceholder.addEventListener("click", function () {
    if (!firebaseAuth) {
        showActionToast("Hesab xidməti açıla bilmədi. Səhifəni yeniləyin.");
        return;
    }
    if (currentAuthUser) {
        accountLogoutMenu.hidden = !accountLogoutMenu.hidden;
        loginPlaceholder.setAttribute("aria-expanded", String(!accountLogoutMenu.hidden));
        return;
    }
    openAccountPage("login");
});

accountLogoutButton.addEventListener("click", async () => {
    closeAccountLogoutMenu();
    try {
        try { await removeCurrentDeviceToken(); } catch (error) { console.warn("Cihaz bildiriş əlaqəsi silinmədi", error); }
        await firebaseAuth.signOut();
        showActionToast("Hesabdan çıxdınız.");
    } catch {
        showActionToast("Hesabdan çıxmaq olmadı.");
    }
});

document.addEventListener("click", event => {
    if (!accountControl.contains(event.target)) closeAccountLogoutMenu();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAccountLogoutMenu();
});

accountBackButton.addEventListener("click", () => showView("home"));

function selectAccountAvatar(avatar) {
    const selected = Object.prototype.hasOwnProperty.call(profileAvatars, avatar) ? avatar : "box";
    accountAvatarInput.value = selected;
    accountAvatarOptions.querySelectorAll("[data-account-avatar]").forEach(button => {
        const isSelected = button.dataset.accountAvatar === selected;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
    renderProfileAvatar(accountAvatarPickerPreview, selected);
    accountAvatarPickerLabel.textContent = profileAvatars[selected].label;
    accountAvatarOptions.hidden = true;
    accountAvatarPickerToggle.setAttribute("aria-expanded", "false");
}

accountAvatarPickerToggle.addEventListener("click", () => {
    const opening = accountAvatarOptions.hidden;
    accountAvatarOptions.hidden = !opening;
    accountAvatarPickerToggle.setAttribute("aria-expanded", String(opening));
});

accountAvatarOptions.addEventListener("click", event => {
    const button = event.target.closest("[data-account-avatar]");
    if (button) selectAccountAvatar(button.dataset.accountAvatar);
});

accountLoginForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!firebaseAuth) return;
    const submit = accountLoginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    accountLoginError.hidden = true;
    try {
        if (accountDialogMode === "register") {
            const displayName = accountNameInput.value.trim();
            if (displayName.length < 2) throw new Error("Ad və soyadı daxil edin.");
            accountRegistrationInProgress = true;
            const credential = await firebaseAuth.createUserWithEmailAndPassword(
                accountEmailInput.value.trim(),
                accountPasswordInput.value
            );
            try {
                await credential.user.updateProfile({ displayName });
                await firebaseDb.collection("users").doc(credential.user.uid).set({
                    displayName,
                    email: credential.user.email || accountEmailInput.value.trim(),
                    avatar: accountAvatarInput.value,
                    status: "pending",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                try { await credential.user.delete(); } catch (cleanupError) { console.warn("Yarımçıq qeydiyyat təmizlənmədi", cleanupError); }
                throw error;
            } finally {
                await firebaseAuth.signOut();
            }
            accountLoginForm.reset();
            selectAccountAvatar("box");
            setAccountDialogMode("login");
            showView("account");
            showActionToast("Qeydiyyat sorğunuz göndərildi. Təsdiqi gözləyin.");
        } else {
            await firebaseAuth.signInWithEmailAndPassword(accountEmailInput.value.trim(), accountPasswordInput.value);
            accountLoginForm.reset();
            showActionToast("Hesab yoxlanılır…");
        }
    } catch (error) {
        console.error("Hesaba giriş alınmadı", error);
        accountLoginError.textContent = error.message === "Ad və soyadı daxil edin."
            ? error.message
            : error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found"
                ? "E-poçt və ya şifrə düzgün deyil."
                : error.code === "auth/email-already-in-use"
                    ? "Bu e-poçtla artıq hesab yaradılıb. Daxil olma bölməsindən yoxlayın."
                    : error.code === "auth/weak-password"
                        ? "Şifrə ən azı 6 simvol olmalıdır."
                        : error.code === "auth/invalid-email"
                            ? "E-poçt ünvanını düzgün yazın."
                            : accountDialogMode === "register"
                                ? "Qeydiyyat sorğusu göndərilmədi. İnterneti yoxlayıb yenidən cəhd edin."
                                : "Daxil olmaq alınmadı. İnterneti yoxlayıb yenidən cəhd edin.";
        accountLoginError.hidden = false;
    } finally {
        accountRegistrationInProgress = false;
        submit.disabled = false;
    }
});

function setAccountDialogMode(mode) {
    accountDialogMode = mode === "register" ? "register" : "login";
    const isRegistration = accountDialogMode === "register";
    accountDialogTitle.textContent = isRegistration ? "Qeydiyyat sorğusu" : "Hesaba daxil ol";
    accountDialogDescription.textContent = isRegistration
        ? "Hesabınız administrator təsdiqindən sonra aktiv olacaq."
        : "Xatırlatmalarınız bu hesabda ayrıca saxlanacaq.";
    accountLoginFootnote.textContent = isRegistration
        ? "Sorğu təsdiqlənənədək hesabla daxil olmaq mümkün olmayacaq."
        : "Hesabınız yoxdursa, qeydiyyat sorğusu göndərin.";
    accountModeToggle.textContent = isRegistration ? "Artıq hesabım var · Daxil ol" : "Qeydiyyat sorğusu göndər";
    accountNameField.hidden = !isRegistration;
    accountNameInput.disabled = !isRegistration;
    accountNameInput.required = isRegistration;
    accountAvatarField.hidden = !isRegistration;
    accountLoginForm.autocomplete = isRegistration ? "off" : "on";
    accountEmailInput.autocomplete = isRegistration ? "off" : "username";
    accountPasswordInput.autocomplete = isRegistration ? "new-password" : "current-password";
    accountAvatarOptions.hidden = true;
    accountAvatarPickerToggle.setAttribute("aria-expanded", "false");
    if (isRegistration) {
        accountNameInput.value = "";
        accountEmailInput.value = "";
        accountPasswordInput.value = "";
        const selected = accountAvatarInput.value || "box";
        renderProfileAvatar(accountAvatarPickerPreview, selected);
        accountAvatarPickerLabel.textContent = "Avatar seç";
    }
    accountLoginForm.querySelector('button[type="submit"]').textContent = isRegistration ? "Sorğu göndər" : "Daxil ol";
}

accountModeToggle.addEventListener("click", () => {
    accountLoginError.hidden = true;
    setAccountDialogMode(accountDialogMode === "register" ? "login" : "register");
});

approvalRefreshButton.addEventListener("click", () => void loadRegistrationRequests());
approvalList.addEventListener("click", async event => {
    const approveButton = event.target.closest("[data-approve-user]");
    if (!approveButton || currentAuthUser?.uid !== LIMAN_ADMIN_UID) return;

    const uid = approveButton.dataset.approveUser;
    if (!uid) return;
    approveButton.disabled = true;
    approvalStatus.textContent = "Hesab təsdiqlənir…";
    try {
        await firebaseDb.collection("users").doc(uid).update({
            status: "approved",
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentAuthUser.uid
        });
        showActionToast("Hesab təsdiqləndi.");
        await loadRegistrationRequests();
    } catch (error) {
        console.error("Hesab təsdiqlənmədi", error);
        approvalStatus.textContent = "Təsdiq alınmadı. Firebase qaydalarını yoxlayın və yenidən cəhd edin.";
        approveButton.disabled = false;
    }
});

async function loadRegistrationRequests() {
    if (currentAuthUser?.uid !== LIMAN_ADMIN_UID || !firebaseDb) return;
    approvalRefreshButton.disabled = true;
    approvalStatus.textContent = "Sorğular yüklənir…";
    approvalList.replaceChildren();
    try {
        const snapshot = await firebaseDb.collection("users")
            .where("status", "==", "pending")
            .limit(50)
            .get();
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return aTime - bTime;
        });
        approvalCount.textContent = String(requests.length);
        if (!requests.length) {
            approvalStatus.textContent = "Hazırda təsdiq gözləyən qeydiyyat yoxdur.";
            return;
        }

        approvalStatus.textContent = "Təsdiqləmək istədiyiniz hesabı seçin.";
        requests.forEach(request => {
            const item = document.createElement("li");
            item.className = "approval-card";
            const avatar = document.createElement("span");
            avatar.className = "approval-card-avatar";
            avatar.setAttribute("aria-hidden", "true");
            renderProfileAvatar(avatar, request.avatar);
            const copy = document.createElement("div");
            copy.className = "approval-card-copy";
            const name = document.createElement("strong");
            name.textContent = request.displayName || "Ad göstərilməyib";
            const email = document.createElement("span");
            email.textContent = request.email || "E-poçt göstərilməyib";
            copy.append(name, email);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "primary-button approval-approve-button";
            button.dataset.approveUser = request.id;
            button.textContent = "Təsdiqlə";
            item.append(avatar, copy, button);
            approvalList.appendChild(item);
        });
    } catch (error) {
        console.error("Qeydiyyat sorğuları yüklənmədi", error);
        approvalCount.textContent = "—";
        approvalStatus.textContent = "Sorğuları yükləmək olmadı. Firebase qaydalarını və interneti yoxlayın.";
    } finally {
        approvalRefreshButton.disabled = false;
    }
}

function normalizeJournalHeader(value) {
    return String(value || "").trim().toLocaleLowerCase("az-AZ").replace(/\s+/g, " ");
}

function renderDistributionRows(rows) {
    distributionRecords = [];
    const headerIndex = rows.findIndex(row => {
        const headers = row.map(normalizeJournalHeader);
        return headers.some(value => value.includes("tarix"))
            && headers.some(value => value.includes("malın adı"))
            && headers.some(value => value.includes("verilən miqdar"));
    });

    if (headerIndex < 0) {
        journalMatchCount.textContent = "0";
        distributionList.replaceChildren();
        appendJournalMessage("Paylanma Jurnalı vərəqində uyğun başlıq sətri tapılmadı.");
        renderRecentMessage("Paylama məlumatları oxuna bilmədi.");
        return;
    }

    const headers = rows[headerIndex].map(normalizeJournalHeader);
    const column = (...needles) => headers.findIndex(value => needles.some(needle => value.includes(needle)));
    distributionColumnIndexes = {
        date: column("tarix"),
        code: column("malın kodu"),
        name: column("malın adı"),
        quantity: column("verilən miqdar"),
        unit: column("ölçü vahidi"),
        department: column("hansı şöbəyə verildi"),
        recipient: column("malı götürən işçi", "mal götürən işçi", "işçi (ad, soyad)")
    };
    distributionRecords = rows.slice(headerIndex + 1).filter(row =>
        String(row[distributionColumnIndexes.name] || "").trim() || String(row[distributionColumnIndexes.code] || "").trim()
    ).reverse();

    if (distributionRecords.length === 0) {
        journalMatchCount.textContent = "0";
        distributionList.replaceChildren();
        appendJournalMessage("Paylama jurnalında hələ qeyd yoxdur.");
        renderRecentMessage("Hələ paylama qeydi yoxdur.");
        renderDailySummary();
        return;
    }

    renderRecentDistribution();
    renderDailySummary();
    renderFilteredDistribution();
}

function parseJournalDate(value) {
    const text = String(value || "").trim();
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    match = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (match) {
        const first = Number(match[1]);
        const second = Number(match[2]);
        const month = text.includes(".") || first > 12 ? second : first;
        const day = text.includes(".") || first > 12 ? first : second;
        return new Date(Number(match[3]), month - 1, day);
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function renderDailySummary() {
    const today = new Date();
    const todaysRecords = distributionRecords.filter(row => {
        const date = parseJournalDate(row[distributionColumnIndexes.date]);
        return date && date.getFullYear() === today.getFullYear()
            && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    });
    const total = todaysRecords.reduce((sum, row) => {
        const value = Number.parseFloat(String(row[distributionColumnIndexes.quantity] || "0").replace(",", "."));
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    dashboardRecordCount.textContent = String(todaysRecords.length);
    dashboardQuantityTotal.textContent = Number.isInteger(total) ? String(total) : total.toLocaleString("az-AZ", { maximumFractionDigits: 2 });
}

function normalizeExpenseHeader(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("az-AZ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/\s+/g, " ");
}

function parseExpenseNumber(value) {
    let text = String(value ?? "").trim().replace(/[^\d,.-]/g, "");
    if (!/\d/.test(text)) return null;

    const commaIndex = text.lastIndexOf(",");
    const dotIndex = text.lastIndexOf(".");
    if (commaIndex >= 0 && dotIndex >= 0) {
        const decimalSeparator = commaIndex > dotIndex ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        text = text.split(thousandsSeparator).join("");
        if (decimalSeparator === ",") text = text.replace(",", ".");
    } else if (commaIndex >= 0) {
        const decimals = text.length - commaIndex - 1;
        text = decimals > 0 && decimals <= 2
            ? text.replace(/,/g, ".")
            : text.replace(/,/g, "");
    } else if (dotIndex >= 0 && text.indexOf(".") !== dotIndex) {
        // Multiple dots are treated as grouping separators (for example 1.234.567).
        text = text.replace(/\./g, "");
    }

    const number = Number(text);
    return Number.isFinite(number) ? number : null;
}

function findPurchaseTable(rows) {
    const headerIndex = rows.findIndex(row => {
        if (!Array.isArray(row)) return false;
        const headers = row.map(normalizeExpenseHeader);
        return headers.some(value => value.includes("tarix") || value === "date")
            && headers.some(value => value.includes("toplam mebleg") || value.includes("umumi mebleg")
                || value.includes("mebleg") || value.includes("amount") || value.includes("xerc"));
    });
    if (headerIndex < 0) return { records: [], error: "Mal Girişi vərəqində Tarix və Toplam məbləğ başlıqları tapılmadı." };

    const headers = rows[headerIndex].map(normalizeExpenseHeader);
    const dateIndex = headers.findIndex(value => value.includes("tarix") || value === "date");
    let amountIndex = headers.findIndex(value => value.includes("toplam mebleg"));
    if (amountIndex < 0) amountIndex = headers.findIndex(value => value.includes("umumi mebleg") || value.includes("mebleg") || value.includes("amount") || value.includes("xerc"));

    const records = rows.slice(headerIndex + 1)
        .filter(Array.isArray)
        .map(row => ({
            date: parseJournalDate(row[dateIndex]),
            amount: parseExpenseNumber(row[amountIndex])
        }))
        .filter(record => record.date && record.amount !== null);

    return { records, error: "" };
}

function renderMonthlyExpense() {
    const today = new Date();
    const monthNames = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    const monthName = monthNames[today.getMonth()];
    dashboardExpenseLabel.textContent = `${monthName.charAt(0).toLocaleUpperCase("az-AZ")}${monthName.slice(1)} ayı üzrə xərclənən vəsait`;

    if (!monthlyPurchaseReady) {
        dashboardMonthlyExpense.textContent = "—";
        return;
    }

    const total = monthlyPurchaseRecords.reduce((sum, record) => {
        return record.date.getFullYear() === today.getFullYear() && record.date.getMonth() === today.getMonth()
            ? sum + record.amount
            : sum;
    }, 0);
    const formatted = new Intl.NumberFormat("en-US", {
        useGrouping: false,
        maximumFractionDigits: 3
    }).format(total);
    dashboardMonthlyExpense.textContent = `${formatted} ₼`;
}

async function loadMonthlyExpenses() {
    if (!purchasePublicCsvUrl || !window.Papa) return;
    try {
        const response = await fetch(purchasePublicCsvUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Mal Girişi cədvəlindən məlumat alınmadı.");
        const csvText = await response.text();
        const parsed = Papa.parse(csvText, { header: false, skipEmptyLines: false });
        const result = findPurchaseTable(parsed.data || []);
        if (result.error) throw new Error(result.error);

        monthlyPurchaseRecords = result.records;
        monthlyPurchaseReady = true;
        renderMonthlyExpense();
    } catch (error) {
        monthlyPurchaseReady = false;
        renderMonthlyExpense();
        console.error("Aylıq mal girişi məbləği yüklənmədi:", error);
    }
}

function renderLongestStoredAreas() {
    if (!dashboardOldestList) return;
    dashboardOldestList.replaceChildren();

    const entries = areaMeasurementRecords.flatMap(record => {
        const areas = Array.isArray(record.areas) && record.areas.length
            ? record.areas
            : [{ location: record.location || "Sahə", area: record.area, length: record.length, width: record.width }];
        return areas.map(area => ({
            company: record.company || "Şirkət qeyd edilməyib",
            vessel: record.vessel || "",
            date: record.date || "",
            location: area.location || "Sahə",
            area,
            squareMeters: Number(area.area) || ((Number(area.length) || 0) * (Number(area.width) || 0)),
            days: currentAccumulationDays(area)
        }));
    });

    entries.sort((first, second) => second.days - first.days || first.date.localeCompare(second.date));
    const oldestEntries = entries.slice(0, 3);
    if (!oldestEntries.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "recent-empty";
        emptyItem.textContent = "Hələ sahə qeydi yoxdur.";
        dashboardOldestList.appendChild(emptyItem);
        return;
    }

    oldestEntries.forEach(entry => {
        const item = document.createElement("li");
        item.className = "recent-distribution-item";

        const info = document.createElement("div");
        info.className = "recent-distribution-info";
        const name = document.createElement("strong");
        name.textContent = entry.company;
        const detail = document.createElement("span");
        detail.textContent = [entry.vessel ? `Gəmi: ${entry.vessel}` : "", entry.location,
            `${formatMeasurementNumber(entry.squareMeters)} m²`].filter(Boolean).join(" · ");
        info.append(name, detail);

        const age = document.createElement("span");
        age.className = "recent-distribution-quantity";
        age.textContent = entry.days ? `${entry.days} gün` : "— gün";
        item.append(info, age);
        dashboardOldestList.appendChild(item);
    });
}

function updateDashboardClock() {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (dashboardDayKey && dashboardDayKey !== dayKey) {
        // Gün dəyişəndə xülasəni dərhal yenidən hesabla, sonra jurnalı təzələ.
        renderDailySummary();
        renderLongestStoredAreas();
        void loadDistributionJournal();
    }
    dashboardDayKey = dayKey;
    const clockParts = new Intl.DateTimeFormat("az-AZ", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(now);
    const clockValues = Object.fromEntries(clockParts.map(({ type, value }) => [type, value]));
    dashboardClockHour.textContent = clockValues.hour;
    dashboardClockMinute.textContent = clockValues.minute;
    dashboardClockSecond.textContent = `:${clockValues.second}`;
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    dashboardDate.textContent = `${day}.${month}.${now.getFullYear()}`;
}

function renderRecentMessage(message) {
    recentDistributionList.replaceChildren();
    const item = document.createElement("li");
    item.className = "recent-empty";
    item.textContent = message;
    recentDistributionList.appendChild(item);
}

function renderRecentDistribution() {
    recentDistributionList.replaceChildren();
    distributionRecords.slice(0, 3).forEach(row => {
        const item = document.createElement("li");
        item.className = "recent-distribution-item";

        const info = document.createElement("div");
        info.className = "recent-distribution-info";
        const name = document.createElement("strong");
        name.textContent = row[distributionColumnIndexes.name] || "Adsız mal";
        const recipient = document.createElement("span");
        recipient.textContent = row[distributionColumnIndexes.recipient]
            ? "Götürən: " + row[distributionColumnIndexes.recipient]
            : (row[distributionColumnIndexes.code] || "Paylama qeydi");
        info.append(name, recipient);

        const quantity = document.createElement("span");
        quantity.className = "recent-distribution-quantity";
        quantity.textContent = (row[distributionColumnIndexes.quantity] || "0")
            + (row[distributionColumnIndexes.unit] ? " " + row[distributionColumnIndexes.unit] : "");
        item.append(info, quantity);
        recentDistributionList.appendChild(item);
    });
}

function normalizeSearchText(value) {
    return String(value || "")
        .toLocaleLowerCase("az-AZ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function renderFilteredDistribution() {
    distributionList.replaceChildren();
    const query = normalizeSearchText(distributionSearchInput.value);
    const matches = distributionRecords.filter(row =>
        !query || row.some(value => normalizeSearchText(value).includes(query))
    );
    journalMatchCount.textContent = matches.length.toLocaleString("az-AZ");

    if (matches.length === 0) {
        appendJournalMessage("Axtarışınıza uyğun paylama qeydi tapılmadı.");
        return;
    }

    matches.forEach(row => {
        const entry = document.createElement("li");
        entry.className = "distribution-entry";
        const top = document.createElement("div");
        top.className = "distribution-entry-top";
        const item = document.createElement("div");
        item.className = "distribution-item";
        const name = document.createElement("strong");
        name.textContent = row[distributionColumnIndexes.name] || "Adsız mal";
        item.appendChild(name);
        if (row[distributionColumnIndexes.code]) {
            const code = document.createElement("span");
            code.className = "distribution-code";
            code.textContent = row[distributionColumnIndexes.code];
            item.appendChild(code);
        }
        const quantity = document.createElement("span");
        quantity.className = "count-badge";
        quantity.textContent = (row[distributionColumnIndexes.quantity] || "0") + (row[distributionColumnIndexes.unit] ? " " + row[distributionColumnIndexes.unit] : "");
        top.append(item, quantity);

        const details = document.createElement("div");
        details.className = "distribution-details";
        [
            ["Tarix", row[distributionColumnIndexes.date]],
            ["Şöbə", row[distributionColumnIndexes.department]],
            ["Götürən işçi", row[distributionColumnIndexes.recipient]]
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

// Səhifənin istənilən yerinə, o cümlədən düymə və yazılara basanda qabarcıq effekti.
const tapEffectLayer = document.createElement("div");
tapEffectLayer.className = "tap-effect-layer";
tapEffectLayer.setAttribute("aria-hidden", "true");
document.body.appendChild(tapEffectLayer);

window.addEventListener("pointerdown", function (event) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (let i = 0; i < 6; i++) {
        const bubble = document.createElement("span");
        const size = 6 + Math.random() * 8;
        bubble.className = "tap-bubble";
        bubble.style.setProperty("--bubble-x", `${event.clientX + (Math.random() - .5) * 38}px`);
        bubble.style.setProperty("--bubble-y", `${event.clientY + (Math.random() - .5) * 18}px`);
        bubble.style.setProperty("--bubble-size", `${size}px`);
        bubble.style.setProperty("--bubble-drift", `${(Math.random() - .5) * 60}px`);
        bubble.style.setProperty("--bubble-duration", `${750 + Math.random() * 450}ms`);
        tapEffectLayer.appendChild(bubble);
        bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    }
}, { capture: true, passive: true });

const splashScreen = document.getElementById("splash-screen");
if (splashScreen) {
    const progressValue = document.getElementById("opening-progress-value");
    const progressFill = document.getElementById("opening-progress-fill");
    const progressTrack = splashScreen.querySelector(".opening-progress-track");
    if (progressValue && progressFill && progressTrack) {
        const progressDuration = 3900;
        const progressStartedAt = performance.now();
        const updateOpeningProgress = (now) => {
            const fraction = Math.min(1, (now - progressStartedAt) / progressDuration);
            const percentage = Math.round(fraction * 100);
            progressValue.textContent = `${percentage}%`;
            progressFill.style.width = `${percentage}%`;
            progressTrack.setAttribute("aria-valuenow", String(percentage));
            if (fraction < 1 && splashScreen.isConnected) requestAnimationFrame(updateOpeningProgress);
        };
        requestAnimationFrame(updateOpeningProgress);
    }
    splashScreen.addEventListener("animationend", function (event) {
        if (event.animationName === "splashExit") splashScreen.remove();
    });
}

function registerLimanOfflineWorker() {
    if (!("serviceWorker" in navigator)) return;
    const isSecureOrigin = location.protocol === "https:"
        || location.hostname === "localhost"
        || location.hostname === "127.0.0.1";
    if (!isSecureOrigin) return;
    const workerUrl = new URL("firebase-messaging-sw.js", document.baseURI);
    const workerScope = new URL("./", document.baseURI).pathname;
    navigator.serviceWorker.register(workerUrl.href, {
        scope: workerScope,
        updateViaCache: "none"
    }).catch(error => console.warn("Offline tətbiq yaddaşı aktiv olmadı:", error));
}

registerLimanOfflineWorker();
areaDateInput.value = localDateInputValue();
loadAreaMeasurements();
initializeFirebaseAccount();
initializeReminders();
setInterval(refreshAreaAgeLabels, 60 * 1000);
loadDistributionJournal();
updateDashboardClock();
renderMonthlyExpense();
void loadMonthlyExpenses();
setInterval(updateDashboardClock, 1000);
setInterval(renderMonthlyExpense, 60 * 1000);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        updateDashboardClock();
        if (!areaMeasurementView.hidden) {
            enqueueAreaCloudTask(synchronizeAreaMeasurementsOnStart);
        }
    }
});
