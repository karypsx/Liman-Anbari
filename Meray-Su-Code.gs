const SPREADSHEET_ID = "1LDc79H0tk0u5yblJAujz3NOJfdCvM2iLaQsbEv6ojPU";
const SHEET_NAME = "Məray Su";
const FIREBASE_PROJECT_ID = "limananbari";
const LIMAN_ADMIN_UID = "WvDIKF4R5SNNEGBpMy6oZdcA1Ub2";
const HEADER_ROW = 3;
const DATA_START_ROW = 4;
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
    if (data.action !== "save") throw new Error("Sorğu növü tanınmadı.");
    lock.waitLock(15000);
    const record = validateRecord_(data.record);
    const sheet = getMarayWaterSheet_();
    const existingRows = findRowsById_(sheet, record.id);
    const existingByIndex = new Map(existingRows.map(item => [item.index, item.row]));
    const usedRows = new Set();
    let nextRow = Math.max(sheet.getLastRow() + 1, DATA_START_ROW);
    record.allocations.forEach(function (allocation, index) {
      const rowNumber = existingByIndex.get(index) || nextRow++;
      const row = [
        dateValue_(record.date),
        safeText_(allocation.destination, 100),
        allocation.bottles,
        safeText_(record.recipient, 100),
        safeText_(record.note, 300),
        record.id,
        new Date(),
        uid,
        index + 1
      ];
      sheet.getRange(rowNumber, 1, 1, COLUMN_COUNT).setValues([row]);
      styleDataRow_(sheet, rowNumber);
      usedRows.add(rowNumber);
    });
    existingRows.forEach(function (item) {
      if (!usedRows.has(item.row)) sheet.getRange(item.row, 1, 1, COLUMN_COUNT).clearContent();
    });
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

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLUMN_COUNT).merge();
    sheet.getRange(1, 1).setValue("MƏRAY SU  ·  TƏHVİL JURNALI");
    sheet.getRange(2, 1, 1, COLUMN_COUNT).merge();
    sheet.getRange(2, 1).setValue("Tətbiqdən daxil edilən su təhvili qeydləri");
    sheet.getRange(HEADER_ROW, 1, 1, COLUMN_COUNT).setValues([[
      "Tarix", "Təhvil yeri", "Butulka sayı", "Qəbul edən şəxs", "Qeyd", "Qaimə ID", "Yaradılma vaxtı", "Qeyd edən UID", "Sətir №"
    ]]);
    styleSheet_(sheet);
  } else {
    const headers = sheet.getRange(HEADER_ROW, 1, 1, VISIBLE_COLUMN_COUNT).getDisplayValues()[0]
      .map(normalizeHeader_);
    if (headers[0] !== "tarix" || headers[1] !== "tehvil yeri" || headers[2] !== "butulka sayi"
        || headers[3] !== "qebul eden sexs" || headers[4] !== "qeyd") {
      throw new Error("“Məray Su” vərəqinin 3-cü sətirində Tarix, Təhvil yeri, Butulka sayı, Qəbul edən şəxs, Qeyd başlıqları olmalıdır.");
    }
  }
  return sheet;
}

function styleSheet_(sheet) {
  sheet.setFrozenRows(HEADER_ROW);
  sheet.setRowHeight(1, 42);
  sheet.setRowHeight(2, 26);
  sheet.setRowHeight(HEADER_ROW, 36);
  sheet.getRange(1, 1, 1, COLUMN_COUNT)
    .setBackground("#123c31").setFontColor("#eafff1").setFontSize(15).setFontWeight("bold")
    .setHorizontalAlignment("left").setVerticalAlignment("middle");
  sheet.getRange(2, 1, 1, COLUMN_COUNT)
    .setBackground("#eaf4ef").setFontColor("#587064").setFontSize(10).setFontStyle("italic")
    .setVerticalAlignment("middle");
  sheet.getRange(HEADER_ROW, 1, 1, COLUMN_COUNT)
    .setBackground("#24704f").setFontColor("#ffffff").setFontSize(10).setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true)
    .setBorder(true, true, true, true, true, true, "#174d38", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 210);
  sheet.setColumnWidth(3, 125);
  sheet.setColumnWidth(4, 210);
  sheet.setColumnWidth(5, 300);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 165);
  sheet.setColumnWidth(8, 190);
  sheet.hideColumns(6, 4);
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(HEADER_ROW, 1, Math.max(sheet.getMaxRows() - HEADER_ROW + 1, 1), VISIBLE_COLUMN_COUNT).createFilter();
}

function styleDataRow_(sheet, rowNumber) {
  sheet.setRowHeight(rowNumber, 34);
  sheet.getRange(rowNumber, 1, 1, COLUMN_COUNT)
    .setBackground(rowNumber % 2 === 0 ? "#eef7f1" : "#ffffff")
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
  if (lastRow < DATA_START_ROW) return [];
  const rows = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, COLUMN_COUNT).getValues();
  const timeZone = sheet.getParent().getSpreadsheetTimeZone();
  const grouped = new Map();
  rows.forEach(function (row) {
    const id = String(row[5] || "").trim();
    if (!id) return;
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
      index: Number(row[8]) || 1,
      destination: String(row[1] || ""),
      bottles: Math.max(0, Math.floor(Number(row[2]) || 0))
    });
  });
  return Array.from(grouped.values()).map(function (record) {
    record.allocations.sort(function (a, b) { return a.index - b.index; });
    record.allocations = record.allocations.map(function (item) { return { destination: item.destination, bottles: item.bottles }; });
    return record;
  });
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

function findRowsById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];
  const rows = sheet.getRange(DATA_START_ROW, 6, lastRow - DATA_START_ROW + 1, 4).getDisplayValues();
  return rows.reduce(function (matches, row, index) {
    if (row[0] === id) matches.push({ row: DATA_START_ROW + index, index: Math.max(0, Number(row[3]) - 1) });
    return matches;
  }, []);
}

function dateValue_(value) {
  const parts = String(value).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
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
