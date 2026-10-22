const SPREADSHEET_ID = "1LDc79H0tk0u5yblJAujz3NOJfdCvM2iLaQsbEv6ojPU";
const SHEET_NAME = "Məray Su";
const FIREBASE_PROJECT_ID = "limananbari";
const LIMAN_ADMIN_UID = "WvDIKF4R5SNNEGBpMy6oZdcA1Ub2";
const COLUMN_COUNT = 9;
const VISIBLE_COLUMN_COUNT = 5;

// Apps Script-də bir dəfə Run edib cədvəl və xarici sorğu icazələrini təsdiqləyin.
function authorizeMarayWater() {
  const sheet = getMarayWaterSheet_();
  sheet.getLastRow();
  UrlFetchApp.fetch("https://firestore.googleapis.com", { muteHttpExceptions: true });
}

function doGet(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  const callback = parameters.callback || "";
  try {
    requireApprovedUser_(parameters.idToken || "");
    return output_({ ok: true, records: readMarayWaterRecords_() }, callback);
  } catch (error) {
    return output_({ ok: false, error: safeErrorMessage_(error) }, callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e && e.postData ? e.postData.contents || "{}" : "{}");
    const uid = requireApprovedUser_(data.idToken || "");
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
    return output_({ ok: false, error: safeErrorMessage_(error) });
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
