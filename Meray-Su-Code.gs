const SPREADSHEET_ID = "1LDc79H0tk0u5yblJAujz3NOJfdCvM2iLaQsbEv6ojPU";
const SHEET_NAME = "Məray Su";
const FIREBASE_PROJECT_ID = "limananbari";
const LIMAN_ADMIN_UID = "WvDIKF4R5SNNEGBpMy6oZdcA1Ub2";
const COLUMN_COUNT = 9;
const VISIBLE_COLUMN_COUNT = 5;
const ISSUE_STOCK_SHEET_NAME = "Anbar Qalığı";
const ISSUE_JOURNAL_SHEET_NAME = "Paylanma Jurnalı";
const ISSUE_ID_HEADER = "Əməliyyat ID";

// Apps Script-də bir dəfə Run edib cədvəl və xarici sorğu icazələrini təsdiqləyin.
function authorizeMarayWater() {
  const sheet = getMarayWaterSheet_();
  sheet.getLastRow();
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  getIssueStockLayout_(spreadsheet);
  getIssueJournalLayout_(spreadsheet);
  UrlFetchApp.fetch("https://firestore.googleapis.com", { muteHttpExceptions: true });
}

function doGet(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  const callback = parameters.callback || "";
  try {
    const uid = requireApprovedUser_(parameters.idToken || "");
    if (parameters.mode === "inventory" || parameters.mode === "status") {
      requireIssueAdministrator_(uid);
      if (parameters.mode === "status") {
        const requestId = validateIssueRequestId_(parameters.requestId);
        const cached = CacheService.getScriptCache().get("liman-issue:" + requestId);
        return output_(cached ? JSON.parse(cached) : { ok: true, processed: false }, callback);
      }
      return output_({ ok: true, records: readIssueStock_(SpreadsheetApp.openById(SPREADSHEET_ID)) }, callback);
    }
    return output_({ ok: true, records: readMarayWaterRecords_() }, callback);
  } catch (error) {
    return output_({ ok: false, error: safeErrorMessage_(error) }, callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let issueRequestId = "";
  try {
    const data = JSON.parse(e && e.postData ? e.postData.contents || "{}" : "{}");
    const uid = requireApprovedUser_(data.idToken || "");
    if (data.action === "issue") {
      issueRequestId = validateIssueRequestId_(data.record && data.record.id);
      requireIssueAdministrator_(uid);
      lock.waitLock(15000);
      const previous = CacheService.getScriptCache().get("liman-issue:" + issueRequestId);
      if (previous) return output_(JSON.parse(previous));
      const result = issueStockAndAppendJournal_(SpreadsheetApp.openById(SPREADSHEET_ID), validateIssueRecord_(data.record));
      CacheService.getScriptCache().put("liman-issue:" + issueRequestId, JSON.stringify(result), 21600);
      return output_(result);
    }
    if (data.action !== "save" && data.action !== "delete") throw new Error("Sorğu növü tanınmadı.");
    lock.waitLock(15000);

    const sheet = getMarayWaterSheet_();
    if (data.action === "delete") {
      const id = String(data.record && data.record.id || "").trim();
      if (!/^[A-Za-z0-9._-]{5,80}$/.test(id)) throw new Error("Silinəcək qaimə nömrəsi düzgün deyil.");
      deleteInvoiceRows_(sheet, id);
      return output_({ ok: true, id: id, deleted: true });
    }

    const record = validateRecord_(data.record);
    // Təkrar göndərilən qaimə iki dəfə görünməsin: əvvəl köhnə bloku silib sonra yenisini yazırıq.
    deleteInvoiceRows_(sheet, record.id);
    appendInvoiceBlock_(sheet, record, uid);
    return output_({ ok: true, id: record.id });
  } catch (error) {
    const result = { ok: false, processed: false, error: safeErrorMessage_(error) };
    if (issueRequestId) {
      try { CacheService.getScriptCache().put("liman-issue:" + issueRequestId, JSON.stringify(result), 21600); } catch (_) {}
    }
    return output_(result);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function requireApprovedUser_(idToken) {
  const token = String(idToken || "").trim();
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) throw new Error("Tətbiq hesabınıza yenidən daxil olun.");

  let claims;
  try {
    const bytes = Utilities.base64DecodeWebSafe(tokenParts[1]);
    claims = JSON.parse(Utilities.newBlob(bytes).getDataAsString());
  } catch (_) {
    throw new Error("Giriş sessiyası yoxlanmadı. Tətbiqə yenidən daxil olun.");
  }

  const uid = String(claims.user_id || claims.sub || "");
  const expiresAt = Number(claims.exp);
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== FIREBASE_PROJECT_ID
      || claims.iss !== "https://securetoken.google.com/" + FIREBASE_PROJECT_ID
      || !uid || !Number.isFinite(expiresAt) || expiresAt <= now) {
    throw new Error("Giriş sessiyası bitib və ya bu tətbiqə aid deyil.");
  }

  // Firestore bu sorğuda tokenin imzasını yoxlayır; yalnız hesab sahibinin profilini oxumağa icazə verilir.
  const profileUrl = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID
    + "/databases/(default)/documents/users/" + encodeURIComponent(uid);
  const response = UrlFetchApp.fetch(profileUrl, {
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error("Hesabın təsdiq statusu yoxlanmadı. Tətbiqə yenidən daxil olun.");
  }
  const profile = JSON.parse(response.getContentText());
  const status = profile.fields && profile.fields.status ? profile.fields.status.stringValue : "";
  if (uid !== LIMAN_ADMIN_UID && status !== "approved") {
    throw new Error("Bu bölmə yalnız təsdiqlənmiş hesablar üçündür.");
  }
  return uid;
}

function getMarayWaterSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() > 0) {
    const rows = sheet.getRange(1, 1, sheet.getLastRow(), COLUMN_COUNT).getValues();
    const hasInvoiceMarkers = rows.some(function (row) { return String(row[5] || "") && Number(row[8]) === -1; });
    if (!hasInvoiceMarkers) migrateLegacySheetToInvoices_(sheet, rows);
  }
  styleInvoiceSheet_(sheet);
  return sheet;
}

function migrateLegacySheetToInvoices_(sheet, rows) {
  let headerIndex = -1;
  const headerMatches = ["tarix", "tehvil yeri", "butulka sayi", "qebul eden sexs", "qeyd"];
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const candidate = rows[i].slice(0, VISIBLE_COLUMN_COUNT).map(normalizeHeader_);
    if (headerMatches.every(function (header, index) { return candidate[index] === header; })) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    throw new Error("“Məray Su” vərəqində köhnə cədvəl başlıqları tapılmadı. Məlumatı qorumaq üçün vərəqi avtomatik dəyişmədim.");
  }

  const timeZone = sheet.getParent().getSpreadsheetTimeZone();
  const grouped = new Map();
  rows.slice(headerIndex + 1).forEach(function (row) {
    const id = String(row[5] || "").trim();
    const destination = String(row[1] || "").trim();
    const bottles = Number(row[2]);
    if (!id || !destination || !Number.isFinite(bottles) || bottles < 1) return;
    if (!grouped.has(id)) {
      grouped.set(id, {
        id: id,
        date: row[0] instanceof Date ? Utilities.formatDate(row[0], timeZone, "yyyy-MM-dd") : String(row[0] || ""),
        recipient: String(row[3] || ""),
        note: String(row[4] || ""),
        allocations: []
      });
    }
    grouped.get(id).allocations.push({
      index: Number(row[8]) || grouped.get(id).allocations.length + 1,
      destination: destination,
      bottles: Math.floor(bottles)
    });
  });

  const records = Array.from(grouped.values()).map(function (record) {
    record.allocations.sort(function (a, b) { return a.index - b.index; });
    record.allocations = record.allocations.map(function (item) { return { destination: item.destination, bottles: item.bottles }; });
    return record;
  });
  rows.slice(headerIndex + 1).forEach(function (row) {
    const visibleDataExists = row.slice(0, VISIBLE_COLUMN_COUNT).some(function (value) { return String(value || "").trim() !== ""; });
    if (visibleDataExists && !String(row[5] || "").trim()) {
      throw new Error("Köhnə “Məray Su” vərəqində Qaimə ID-si olmayan məlumat var. Məlumatı qorumaq üçün avtomatik çevirməni dayandırdım.");
    }
  });
  sheet.clear();
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  styleInvoiceSheet_(sheet);
  records.forEach(function (record) { appendInvoiceBlock_(sheet, record, "köhnə qeyd"); });
}

function styleInvoiceSheet_(sheet) {
  sheet.setColumnWidth(1, 112);
  sheet.setColumnWidth(2, 185);
  sheet.setColumnWidth(3, 118);
  sheet.setColumnWidth(4, 190);
  sheet.setColumnWidth(5, 260);
  sheet.setColumnWidth(6, 145);
  sheet.setColumnWidth(7, 165);
  sheet.setColumnWidth(8, 175);
  sheet.setColumnWidth(9, 95);
  sheet.hideColumns(6, 4);
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.setFrozenRows(0);
  sheet.setHiddenGridlines(true);
}

function appendInvoiceBlock_(sheet, record, uid) {
  const lastUsedRow = sheet.getLastRow();
  const firstRow = lastUsedRow ? lastUsedRow + 2 : 1;
  const titleRow = firstRow;
  const headerRow = firstRow + 1;
  const firstAllocationRow = firstRow + 2;
  const totalRow = firstAllocationRow + record.allocations.length;
  const spacerRow = totalRow + 1;
  const totalBottles = record.allocations.reduce(function (sum, item) { return sum + item.bottles; }, 0);

  sheet.getRange(titleRow, 1, 1, VISIBLE_COLUMN_COUNT).merge();
  sheet.getRange(titleRow, 1).setValue("MƏRAY SU  ·  TƏHVİL QAİMƏSİ  ·  " + displayDate_(record.date, sheet));
  sheet.getRange(titleRow, 6, 1, 4).setValues([[record.id, new Date(), uid, -1]]);
  sheet.setRowHeight(titleRow, 42);
  sheet.getRange(titleRow, 1, 1, VISIBLE_COLUMN_COUNT)
    .setBackground("#123c31").setFontColor("#eafff1").setFontSize(14).setFontWeight("bold")
    .setHorizontalAlignment("left").setVerticalAlignment("middle").setWrap(true)
    .setBorder(true, true, false, true, false, false, "#24704f", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.getRange(headerRow, 1, 1, COLUMN_COUNT).setValues([[
    "Tarix", "Təhvil yeri", "Butulka sayı", "Qəbul edən şəxs", "Qeyd", record.id, new Date(), uid, -2
  ]]);
  sheet.setRowHeight(headerRow, 34);
  sheet.getRange(headerRow, 1, 1, VISIBLE_COLUMN_COUNT)
    .setBackground("#24704f").setFontColor("#ffffff").setFontSize(10).setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true)
    .setBorder(true, true, true, true, true, true, "#174d38", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  const allocationRows = record.allocations.map(function (allocation, index) {
    return [dateValue_(record.date), safeText_(allocation.destination, 100), allocation.bottles,
      safeText_(record.recipient, 100), safeText_(record.note, 300), record.id, new Date(), uid, index + 1];
  });
  sheet.getRange(firstAllocationRow, 1, allocationRows.length, COLUMN_COUNT).setValues(allocationRows);
  for (let i = 0; i < allocationRows.length; i++) styleInvoiceAllocationRow_(sheet, firstAllocationRow + i, i);

  sheet.getRange(totalRow, 1, 1, 2).merge();
  sheet.getRange(totalRow, 1).setValue("CƏMİ BUTULKA");
  sheet.getRange(totalRow, 3).setValue(totalBottles);
  sheet.getRange(totalRow, 4, 1, 2).merge();
  sheet.getRange(totalRow, 4).setValue(record.allocations.length + " təhvil yeri");
  sheet.getRange(totalRow, 6, 1, 4).setValues([[record.id, new Date(), uid, -3]]);
  sheet.setRowHeight(totalRow, 36);
  sheet.getRange(totalRow, 1, 1, VISIBLE_COLUMN_COUNT)
    .setBackground("#dff2e8").setFontColor("#174d38").setFontSize(11).setFontWeight("bold")
    .setVerticalAlignment("middle").setBorder(true, true, true, true, false, false, "#6eaa87", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange(totalRow, 3).setHorizontalAlignment("center").setNumberFormat("0");
  sheet.setRowHeight(spacerRow, 14);
}

function styleInvoiceAllocationRow_(sheet, rowNumber, index) {
  sheet.setRowHeight(rowNumber, 34);
  sheet.getRange(rowNumber, 1, 1, VISIBLE_COLUMN_COUNT)
    .setBackground(index % 2 === 0 ? "#eef7f1" : "#ffffff")
    .setFontColor("#17231c").setFontSize(10).setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true, "#a8c4b2", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(rowNumber, 1).setNumberFormat("dd.mm.yyyy").setHorizontalAlignment("center");
  sheet.getRange(rowNumber, 2).setWrap(true);
  sheet.getRange(rowNumber, 3).setNumberFormat("0").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange(rowNumber, 4, 1, 2).setWrap(true);
  sheet.getRange(rowNumber, 7).setNumberFormat("dd.mm.yyyy hh:mm");
}

function readMarayWaterRecords_() {
  const sheet = getMarayWaterSheet_();
  const lastRow = sheet.getLastRow();
  if (!lastRow) return [];
  const rows = sheet.getRange(1, 1, lastRow, COLUMN_COUNT).getValues();
  const timeZone = sheet.getParent().getSpreadsheetTimeZone();
  const grouped = new Map();
  rows.forEach(function (row) {
    const id = String(row[5] || "").trim();
    const index = Number(row[8]);
    if (!id || !Number.isFinite(index) || index < 1) return;
    if (!grouped.has(id)) {
      grouped.set(id, {
        id: id,
        date: row[0] instanceof Date ? Utilities.formatDate(row[0], timeZone, "yyyy-MM-dd") : String(row[0] || ""),
        recipient: String(row[3] || ""),
        note: String(row[4] || ""),
        allocations: []
      });
    }
    grouped.get(id).allocations.push({ index: index, destination: String(row[1] || ""), bottles: Math.max(0, Math.floor(Number(row[2]) || 0)) });
  });
  return Array.from(grouped.values()).map(function (record) {
    record.allocations.sort(function (a, b) { return a.index - b.index; });
    record.allocations = record.allocations.map(function (item) { return { destination: item.destination, bottles: item.bottles }; });
    return record;
  });
}

function deleteInvoiceRows_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (!lastRow) return;
  const ids = sheet.getRange(1, 6, lastRow, 1).getDisplayValues();
  const matchingRows = [];
  ids.forEach(function (row, index) { if (row[0] === id) matchingRows.push(index + 1); });
  if (!matchingRows.length) return;
  // Silmə zamanı metadata daşıyan qaimə sətirlərinin hamısını götürürük; qonşu qaimələrə toxunmuruq.
  matchingRows.reverse().forEach(function (rowNumber) { sheet.deleteRow(rowNumber); });
}

function validateRecord_(record) {
  if (!record || typeof record !== "object") throw new Error("Qaimə məlumatı tapılmadı.");
  const id = String(record.id || "").trim();
  const date = String(record.date || "").trim();
  const recipient = String(record.recipient || "").trim();
  const parsedDate = dateValue_(date);
  if (!/^[A-Za-z0-9._-]{5,80}$/.test(id)) throw new Error("Qaimə nömrəsi düzgün deyil.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(parsedDate.getTime())
      || parsedDate.getFullYear() !== Number(date.slice(0, 4))
      || parsedDate.getMonth() + 1 !== Number(date.slice(5, 7))
      || parsedDate.getDate() !== Number(date.slice(8, 10))) throw new Error("Tarix düzgün deyil.");
  if (!recipient || recipient.length > 100) throw new Error("Qəbul edən şəxsin adını düzgün yazın.");
  if (!Array.isArray(record.allocations) || !record.allocations.length || record.allocations.length > 20) {
    throw new Error("Təhvil yerlərinin sayı düzgün deyil.");
  }
  const allocations = record.allocations.map(function (item) {
    const destination = String(item && item.destination || "").trim();
    const bottles = Number(item && item.bottles);
    if (!destination || destination.length > 100) throw new Error("Hər sətirdə təhvil yerini yazın.");
    if (!Number.isInteger(bottles) || bottles < 1 || bottles > 100000) throw new Error("Butulka sayını düzgün yazın.");
    return { destination: destination, bottles: bottles };
  });
  if (String(record.note || "").length > 300) throw new Error("Qeyd 300 simvoldan çox ola bilməz.");
  return { id: id, date: date, recipient: recipient, note: String(record.note || "").trim(), allocations: allocations };
}

function dateValue_(value) {
  const parts = String(value).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function displayDate_(value, sheet) {
  const date = dateValue_(value);
  return isNaN(date.getTime()) ? String(value) : Utilities.formatDate(date, sheet.getParent().getSpreadsheetTimeZone(), "dd.MM.yyyy");
}

function safeText_(value, maxLength) {
  const text = String(value == null ? "" : value).trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function normalizeHeader_(value) {
  return String(value || "").toLocaleLowerCase("az").replace(/ə/g, "e").replace(/ı/g, "i")
    .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").trim();
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function safeErrorMessage_(error) {
  const message = error && error.message ? error.message : "Sorğu icra olunmadı.";
  return String(message).slice(0, 250);
}

function requireIssueAdministrator_(uid) {
  if (uid !== LIMAN_ADMIN_UID) throw new Error("Mal vermək yalnız administrator hesabı ilə mümkündür.");
}

function validateIssueRequestId_(value) {
  const id = String(value || "").trim();
  if (!/^issue-[A-Za-z0-9_-]{8,90}$/.test(id)) throw new Error("Əməliyyat nömrəsi düzgün deyil.");
  return id;
}

function getIssueStockLayout_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(ISSUE_STOCK_SHEET_NAME);
  if (!sheet) throw new Error("“Anbar Qalığı” vərəqi tapılmadı.");
  const headerRow = findIssueHeaderRow_(sheet, function (headers) {
    return hasIssueHeader_(headers, ["malin adi ve tesviri", "malin adi"])
      && hasIssueHeader_(headers, ["cari qaliq", "say", "qaliq"])
      && hasIssueHeader_(headers, ["refler", "ref", "ref kodu", "reflerin"]);
  });
  if (!headerRow) throw new Error("Anbar Qalığı vərəqində mal adı, cari qalıq və rəf başlıqları tapılmadı.");
  const headers = getIssueHeaders_(sheet, headerRow);
  return {
    sheet: sheet,
    headerRow: headerRow,
    nameColumn: findIssueHeader_(headers, ["malin adi ve tesviri", "malin adi"]),
    quantityColumn: findIssueHeader_(headers, ["cari qaliq", "say", "qaliq"]),
    shelfColumn: findIssueHeader_(headers, ["refler", "ref", "ref kodu", "reflerin"]),
    codeColumn: findIssueHeader_(headers, ["malin kodu", "mal kodu", "kod"]),
    unitColumn: findIssueHeader_(headers, ["olcu vahidi", "olcu vahidi (eded)"])
  };
}

function getIssueJournalLayout_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(ISSUE_JOURNAL_SHEET_NAME) || spreadsheet.getSheetByName("Paylama Jurnalı");
  if (!sheet) throw new Error("“Paylanma Jurnalı” vərəqi tapılmadı.");
  const headerRow = findIssueHeaderRow_(sheet, function (headers) {
    return hasIssueHeader_(headers, ["tarix"])
      && hasIssueHeader_(headers, ["malin adi"])
      && hasIssueHeader_(headers, ["verilen miqdar"]);
  });
  if (!headerRow) throw new Error("Paylama Jurnalı vərəqində tarix, mal adı və verilən miqdar başlıqları tapılmadı.");
  const headers = getIssueHeaders_(sheet, headerRow);
  const columns = {
    number: findIssueHeader_(headers, ["№", "no", "nomre"]),
    date: findIssueHeader_(headers, ["tarix"]),
    code: findIssueHeader_(headers, ["malin kodu", "mal kodu", "kod"]),
    name: findIssueHeader_(headers, ["malin adi"]),
    quantity: findIssueHeader_(headers, ["verilen miqdar"]),
    unit: findIssueHeader_(headers, ["olcu vahidi"]),
    department: findIssueHeader_(headers, ["hansi sobeye verildi", "hansi subeye verildi", "sobeye verildi"]),
    recipient: findIssueHeader_(headers, ["mali goturen isci", "mal goturen isci", "isci ad soyad", "isci"])
  };
  ["date", "name", "quantity", "unit", "department", "recipient"].forEach(function (key) {
    if (columns[key] < 1) throw new Error("Paylama Jurnalı başlıqlarında “" + key + "” sütunu tapılmadı.");
  });

  const idCell = sheet.getRange(headerRow, 9);
  const currentHeader = String(idCell.getDisplayValue() || "").trim();
  if (!currentHeader) {
    if (idCell.getFormula()) throw new Error("Paylama Jurnalı I sütununda düstur var. Əməliyyat ID-si üçün boş sütun lazımdır.");
    const usedRows = Math.max(sheet.getLastRow(), headerRow);
    const existingIds = sheet.getRange(1, 9, usedRows, 1).getDisplayValues();
    const existingFormulas = sheet.getRange(1, 9, usedRows, 1).getFormulas();
    const columnInUse = existingIds.some(function (row, index) {
      return index + 1 !== headerRow && (String(row[0] || "").trim() || existingFormulas[index][0]);
    });
    if (columnInUse) throw new Error("Paylama Jurnalı I sütununda mövcud məlumat var; təhlükəsizlik üçün onu istifadə etmədim.");
    idCell.setValue(ISSUE_ID_HEADER).setFontWeight("bold").setBackground("#1f6b45").setFontColor("#ffffff");
    sheet.hideColumns(9);
  } else if (currentHeader !== ISSUE_ID_HEADER) {
    throw new Error("Paylama Jurnalı I sütunu boş olmalıdır; ora avtomatik əməliyyat ID-si yazılacaq.");
  }
  return { sheet: sheet, headerRow: headerRow, columns: columns, idColumn: 9 };
}

function readIssueStock_(spreadsheet) {
  const layout = getIssueStockLayout_(spreadsheet);
  const lastRow = layout.sheet.getLastRow();
  if (lastRow <= layout.headerRow) return [];
  const width = Math.max(layout.sheet.getLastColumn(), layout.nameColumn, layout.quantityColumn, layout.shelfColumn);
  const rows = layout.sheet.getRange(layout.headerRow + 1, 1, lastRow - layout.headerRow, width).getDisplayValues();
  return rows.map(function (row) {
    return {
      code: layout.codeColumn ? String(row[layout.codeColumn - 1] || "").trim() : "",
      name: String(row[layout.nameColumn - 1] || "").trim(),
      shelf: String(row[layout.shelfColumn - 1] || "").trim(),
      quantity: String(row[layout.quantityColumn - 1] || "0").trim(),
      unit: layout.unitColumn ? String(row[layout.unitColumn - 1] || "").trim() : ""
    };
  }).filter(function (record) { return record.name; });
}

function issueStockAndAppendJournal_(spreadsheet, record) {
  const cached = CacheService.getScriptCache().get("liman-issue:" + record.id);
  if (cached) return JSON.parse(cached);
  const journal = getIssueJournalLayout_(spreadsheet);
  const existingRow = findIssueJournalRequestRow_(journal, record.id);
  const stock = findIssueStockItem_(spreadsheet, record);
  if (existingRow) return { ok: true, processed: true, requestId: record.id, remaining: stock.quantity };
  if (record.quantity > stock.quantity + 0.0000001) {
    throw new Error("Qalıq kifayət etmir. Hazırda " + formatIssueNumber_(stock.quantity) + " " + (record.unit || "vahid") + " var.");
  }

  const oldQuantity = stock.quantity;
  const journalRow = appendIssueJournalRow_(journal, record);
  const balanceCell = stock.sheet.getRange(stock.row, stock.quantityColumn);
  try {
    if (stock.formula) {
      SpreadsheetApp.flush();
      const recalculated = parseIssueNumber_(balanceCell.getValue());
      const expected = Math.max(0, oldQuantity - record.quantity);
      if (!Number.isFinite(recalculated) || Math.abs(recalculated - expected) > 0.0001) {
        throw new Error("Paylama qeydi yazıldı, amma “Cari Qalıq” düsturu azalmanı hesablamadı. Dəyişiklik ləğv edildi; anbar qalığı düsturunu yoxlayın.");
      }
      stock.quantity = recalculated;
    } else {
      balanceCell.setValue(Math.max(0, oldQuantity - record.quantity));
      SpreadsheetApp.flush();
      stock.quantity = parseIssueNumber_(balanceCell.getValue());
    }
  } catch (error) {
    try {
      if (!stock.formula) balanceCell.setValue(oldQuantity);
      if (journal.sheet.getLastRow() >= journalRow) journal.sheet.deleteRow(journalRow);
      SpreadsheetApp.flush();
    } catch (_) {}
    throw error;
  }
  return { ok: true, processed: true, requestId: record.id, remaining: stock.quantity };
}

function findIssueStockItem_(spreadsheet, record) {
  const layout = getIssueStockLayout_(spreadsheet);
  const lastRow = layout.sheet.getLastRow();
  if (lastRow <= layout.headerRow) throw new Error("Anbar Qalığı vərəqində mallar yoxdur.");
  const width = Math.max(layout.sheet.getLastColumn(), layout.nameColumn, layout.quantityColumn, layout.shelfColumn);
  const rows = layout.sheet.getRange(layout.headerRow + 1, 1, lastRow - layout.headerRow, width).getDisplayValues();
  const matches = [];
  rows.forEach(function (row, index) {
    const name = normalizeIssueText_(row[layout.nameColumn - 1]);
    const shelf = normalizeIssueText_(row[layout.shelfColumn - 1]);
    const code = layout.codeColumn ? normalizeIssueText_(row[layout.codeColumn - 1]) : "";
    const sameName = name === normalizeIssueText_(record.name);
    const sameShelf = !record.shelf || shelf === normalizeIssueText_(record.shelf);
    const sameCode = record.code && code === normalizeIssueText_(record.code);
    if (record.code && layout.codeColumn ? sameCode && sameName && sameShelf : sameName && sameShelf) {
      matches.push({ row: layout.headerRow + index + 1 });
    }
  });
  if (matches.length !== 1) {
    throw new Error(matches.length ? "Eyni mal üçün bir neçə sətir tapıldı. Anbar siyahısında kod və rəfi dəqiqləşdirin." : "Seçilmiş mal Anbar Qalığı vərəqində tapılmadı. Siyahını yeniləyin.");
  }
  const rowNumber = matches[0].row;
  const balanceCell = layout.sheet.getRange(rowNumber, layout.quantityColumn);
  const quantity = parseIssueNumber_(balanceCell.getValue());
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error("Seçilmiş malın cari qalığı ədədi deyil; cədvəli yoxlayın.");
  return { sheet: layout.sheet, row: rowNumber, quantityColumn: layout.quantityColumn,
    quantity: quantity, formula: balanceCell.getFormula() };
}

function appendIssueJournalRow_(journal, record) {
  const sheet = journal.sheet;
  const rowNumber = Math.max(sheet.getLastRow() + 1, journal.headerRow + 1);
  const columns = journal.columns;
  const values = Array(journal.idColumn).fill("");
  if (columns.number > 0) values[columns.number - 1] = countIssueJournalRows_(journal) + 1;
  values[columns.date - 1] = dateValue_(record.date);
  if (columns.code > 0) values[columns.code - 1] = safeText_(record.code, 100);
  values[columns.name - 1] = safeText_(record.name, 200);
  values[columns.quantity - 1] = record.quantity;
  values[columns.unit - 1] = safeText_(record.unit, 60);
  values[columns.department - 1] = safeText_(record.department, 120);
  values[columns.recipient - 1] = safeText_(record.recipient, 120);
  values[journal.idColumn - 1] = record.id;
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  try {
    sheet.setRowHeight(rowNumber, 34);
    sheet.getRange(rowNumber, 1, 1, 8)
      .setBackground((rowNumber - journal.headerRow) % 2 ? "#e8f3fb" : "#ffffff")
      .setFontColor("#19324b").setFontSize(10).setVerticalAlignment("middle")
      .setBorder(true, true, true, true, true, true, "#b7cbd9", SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(rowNumber, columns.date).setNumberFormat("dd.mm.yyyy").setHorizontalAlignment("center");
    sheet.getRange(rowNumber, columns.quantity).setNumberFormat("0.##").setHorizontalAlignment("center").setFontWeight("bold");
  } catch (_) {
    // Format changes are optional; do not stop the stock and journal transaction if style application fails.
  }
  return rowNumber;
}

function countIssueJournalRows_(journal) {
  const lastRow = journal.sheet.getLastRow();
  if (lastRow <= journal.headerRow) return 0;
  const cells = journal.sheet.getRange(journal.headerRow + 1, journal.columns.name, lastRow - journal.headerRow, 1).getDisplayValues();
  return cells.filter(function (row) { return String(row[0] || "").trim(); }).length;
}

function findIssueJournalRequestRow_(journal, requestId) {
  const lastRow = journal.sheet.getLastRow();
  if (lastRow <= journal.headerRow) return 0;
  const ids = journal.sheet.getRange(journal.headerRow + 1, journal.idColumn, lastRow - journal.headerRow, 1).getDisplayValues();
  const index = ids.findIndex(function (row) { return row[0] === requestId; });
  return index < 0 ? 0 : journal.headerRow + index + 1;
}

function validateIssueRecord_(record) {
  if (!record || typeof record !== "object") throw new Error("Təhvil məlumatı tapılmadı.");
  const id = validateIssueRequestId_(record.id);
  const name = String(record.name || "").trim();
  const code = String(record.code || "").trim();
  const shelf = String(record.shelf || "").trim();
  const department = String(record.department || "").trim();
  const recipient = String(record.recipient || "").trim();
  const quantity = Number(record.quantity);
  const date = String(record.date || "").trim();
  const parsedDate = dateValue_(date);
  if (!name || name.length > 200) throw new Error("Malın adı düzgün deyil.");
  if (!department || department.length > 120) throw new Error("Şöbənin adını düzgün yazın.");
  if (!recipient || recipient.length > 120) throw new Error("Malı götürən işçinin adını düzgün yazın.");
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000000) throw new Error("Verilən miqdar düzgün deyil.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(parsedDate.getTime())
      || parsedDate.getFullYear() !== Number(date.slice(0, 4))
      || parsedDate.getMonth() + 1 !== Number(date.slice(5, 7))
      || parsedDate.getDate() !== Number(date.slice(8, 10))) throw new Error("Tarix düzgün deyil.");
  return { id: id, name: name, code: code, shelf: shelf, department: department,
    recipient: recipient, quantity: quantity, unit: String(record.unit || "").trim(), date: date };
}

function findIssueHeaderRow_(sheet, predicate) {
  const rowCount = Math.min(Math.max(sheet.getLastRow(), 1), 50);
  const columnCount = Math.min(Math.max(sheet.getLastColumn(), 1), 20);
  const rows = sheet.getRange(1, 1, rowCount, columnCount).getDisplayValues();
  for (let index = 0; index < rows.length; index++) {
    if (predicate(rows[index].map(normalizeIssueText_))) return index + 1;
  }
  return 0;
}

function getIssueHeaders_(sheet, rowNumber) {
  const columns = Math.min(Math.max(sheet.getLastColumn(), 1), 20);
  return sheet.getRange(rowNumber, 1, 1, columns).getDisplayValues()[0].map(normalizeIssueText_);
}

function findIssueHeader_(headers, aliases) {
  const index = headers.findIndex(function (header) {
    return aliases.some(function (aliasText) {
      const alias = normalizeIssueText_(aliasText);
      return header === alias || (alias.length > 3 && header.indexOf(alias) >= 0);
    });
  });
  return index < 0 ? 0 : index + 1;
}

function hasIssueHeader_(headers, aliases) {
  return findIssueHeader_(headers, aliases) > 0;
}

function normalizeIssueText_(value) {
  return normalizeHeader_(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function parseIssueNumber_(value) {
  if (typeof value === "number") return value;
  let text = String(value == null ? "" : value).trim().replace(/[^\d,.-]/g, "");
  if (!text) return NaN;
  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    const grouping = decimal === "," ? "." : ",";
    text = text.split(grouping).join("");
    if (decimal === ",") text = text.replace(",", ".");
  } else if (comma >= 0) {
    text = text.replace(",", ".");
  }
  return Number(text);
}

function formatIssueNumber_(value) {
  return Number(value || 0).toLocaleString("az-AZ", { maximumFractionDigits: 3 });
}
