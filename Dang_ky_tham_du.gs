// =====================================================================
//  HỘI NGHỊ KHOA HỌC ĐIỀU DƯỠNG - KỸ THUẬT Y LẦN II - 2026
//  Bệnh viện Đa khoa Hùng Vương
//  - Lưu dữ liệu đăng ký vào Google Sheets + upload file lên Drive
//  - Tự động gửi mail xác nhận tới người đăng ký (Tham dự / Báo cáo)
//  - Ghi TRẠNG THÁI gửi mail vào Sheet + Menu kiểm tra / Gửi lại mail
// =====================================================================

// ------- CẤU HÌNH CHUNG (chỉnh sửa tại đây nếu cần) -------
var CONFIG = {
  folderId: '1HIw48KpRhGEop5UX7P-9Bu_uHnkeHrO9', // ID thư mục Google Drive lưu file
  tenHoiNghi: 'Hội nghị Khoa học Điều dưỡng - Kỹ thuật y lần II - 2026',
  thoiGian: 'Thứ Bảy, ngày 12 / 09 / 2026',
  diaDiem: 'Bệnh viện Đa khoa Hùng Vương',
  emailBTC: 'phongdieuduongbvhv@gmail.com',
  hotline: 'ĐD.CKI. Trần Thị Minh Phương - 0982 899 296 | CNĐD. Lê Thị Thu - 0941 525 115',
  mauChinh: '#0284c7' // màu sky-600 đồng bộ với website
};

// ------- SƠ ĐỒ CỘT CỦA TỪNG TAB (1 = cột A) -------
// statusCol = cột ghi trạng thái mail. fields = vị trí cột để ĐỌC LẠI dữ liệu khi Gửi lại mail.
var SCHEMA = {
  "Tham_du": {
    statusCol: 14, // cột N
    headerTrangThai: "Trạng thái mail",
    fields: {
      hocVi: 2, hoTen: 3, gioiTinh: 4, ngaySinh: 5,
      tinhThanh: 7, phuongXa: 8, diaChi: 9,
      soDienThoai: 10, email: 11, capCME: 13
    }
  },
  "Bao_cao": {
    statusCol: 13, // cột M
    headerTrangThai: "Trạng thái mail",
    fields: {
      hocVi: 2, hoTen: 3, gioiTinh: 4, ngaySinh: 5,
      donVi: 7, soDienThoai: 8, email: 9,
      tieuDe: 10, dongYChiaSe: 12
    }
  }
};

// ---------------------------------------------------------------------
//  NHẬN DỮ LIỆU TỪ WEBSITE
// ---------------------------------------------------------------------
function doPost(e) {
  try {
    // Chốt chặn: nếu bấm Run thẳng trong editor (không có 'e') -> báo nhắc thay vì lỗi đỏ khó hiểu
    if (!e || !e.postData) {
      console.warn("⚠️ doPost được gọi KHÔNG qua HTTP POST. Hàm này chỉ chạy khi website gửi dữ liệu lên. " +
                   "Để kiểm thử trong editor, hãy chạy hàm 'testGuiMail' hoặc 'kiemTraTrangThai'.");
      return jsonResponse("error", "doPost cần được gọi qua HTTP POST từ website, không chạy trực tiếp trong editor.");
    }

    var data = JSON.parse(e.postData.contents);

    var folder = DriveApp.getFolderById(CONFIG.folderId);

    console.log("1. TÊN TAB MÀ WEB ĐANG TÌM: '" + data.formType + "'");

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var allNames = spreadsheet.getSheets().map(function(s) { return s.getName(); });
    console.log("2. CÁC TAB HIỆN CÓ TRONG GOOGLE SHEETS: " + allNames.join(", "));

    var sheetName = data.formType;
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      console.error("=> KHÔNG tìm thấy tab tên '" + sheetName + "'");
      return jsonResponse("error", "Lỗi: Không tìm thấy tab [" + sheetName + "]. Các tab đang có là: " + allNames.join(", "));
    }

    function uploadFile(fileData) {
      if (!fileData || !fileData.base64) return "";
      var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), fileData.mimeType, fileData.name);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }

    // Ghi dữ liệu
    if (data.formType === "Tham_du") {
      var urlBangCap = uploadFile(data.fileBangCap);
      var urlBienLai = uploadFile(data.fileBienLai);
      sheet.appendRow([
        new Date(), data.hocVi, data.hoTen, data.gioiTinh, data.ngaySinh,
        urlBangCap, data.tinhThanh, data.phuongXa, data.diaChi,
        data.soDienThoai, data.email, urlBienLai, data.capCME
      ]);
    } else if (data.formType === "Bao_cao") {
      var urlBangCapBC = uploadFile(data.fileBangCap);
      var urlFileBaoCao = uploadFile(data.fileBaoCao);
      sheet.appendRow([
        new Date(), data.hocVi, data.hoTen, data.gioiTinh, data.ngaySinh,
        urlBangCapBC, data.donVi, data.soDienThoai, data.email,
        data.tieuDe, urlFileBaoCao, data.dongYChiaSe
      ]);
    }

    // Gửi mail xác nhận + ghi trạng thái vào dòng vừa thêm
    var dongVuaThem = sheet.getLastRow();
    capNhatHeaderTrangThai(sheet, sheetName);
    var kq = guiMail(sheetName, data);
    ghiTrangThaiMail(sheet, sheetName, dongVuaThem, kq);

    return jsonResponse("success", "Đã lưu thành công!");

  } catch (error) {
    console.error("LỖI HỆ THỐNG: " + error.toString());
    return jsonResponse("error", "Lỗi máy chủ: " + error.toString());
  }
}

// ---------------------------------------------------------------------
//  MENU TRÊN GOOGLE SHEETS (tự hiện khi mở file)
// ---------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📧 Quản lý Mail')
    .addItem('📋 Kiểm tra trạng thái gửi mail (tất cả)', 'kiemTraTrangThai')
    .addSeparator()
    .addItem('🔁 Gửi lại mail CHƯA gửi / LỖI (tab hiện tại)', 'guiLaiMailChuaGuiHoacLoi')
    .addItem('🔁 Gửi lại mail cho (các) dòng đang chọn', 'guiLaiMailDangChon')
    .addToUi();
}

// --- 1) CHECKLIST: tổng hợp trạng thái cả 2 tab ---
function kiemTraTrangThai() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bao = "";

  Object.keys(SCHEMA).forEach(function(ten) {
    var sheet = ss.getSheetByName(ten);
    if (!sheet) return;
    var sc = SCHEMA[ten];
    var lastRow = sheet.getLastRow();
    var tong = 0, daGui = 0, loi = 0, chua = 0, dsLoiChua = [];

    for (var r = 2; r <= lastRow; r++) {
      var email = sheet.getRange(r, sc.fields.email).getValue();
      if (!email) continue; // bỏ dòng trống
      tong++;
      var tt = String(sheet.getRange(r, sc.statusCol).getValue() || "");
      if (tt.indexOf("✅") > -1) daGui++;
      else if (tt.indexOf("❌") > -1) { loi++; dsLoiChua.push("Dòng " + r + " (LỖI): " + email); }
      else { chua++; dsLoiChua.push("Dòng " + r + " (CHƯA gửi): " + email); }
    }

    bao += "▶ TAB [" + ten + "]\n";
    bao += "   Tổng: " + tong + "  |  ✅ Đã gửi: " + daGui + "  |  ❌ Lỗi: " + loi + "  |  ⏳ Chưa gửi: " + chua + "\n";
    if (dsLoiChua.length) bao += "   " + dsLoiChua.join("\n   ") + "\n";
    bao += "\n";
  });

  if (!bao) bao = "Không tìm thấy tab dữ liệu (Tham_du / Bao_cao).";
  ui.alert("📋 TRẠNG THÁI GỬI MAIL", bao, ui.ButtonSet.OK);
}

// --- 2) Gửi lại mail cho dòng CHƯA gửi hoặc LỖI trên tab hiện tại ---
function guiLaiMailChuaGuiHoacLoi() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var ten = sheet.getName();
  if (!SCHEMA[ten]) { thongBaoSaiTab(); return; }

  var sc = SCHEMA[ten];
  var lastRow = sheet.getLastRow();
  var dsDong = [];
  for (var r = 2; r <= lastRow; r++) {
    if (!sheet.getRange(r, sc.fields.email).getValue()) continue;
    var tt = String(sheet.getRange(r, sc.statusCol).getValue() || "");
    if (tt.indexOf("✅") === -1) dsDong.push(r); // chưa gửi hoặc lỗi
  }
  guiLaiTheoDanhSach(sheet, ten, dsDong);
}

// --- 3) Gửi lại mail cho (các) dòng người dùng đang bôi đen ---
function guiLaiMailDangChon() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var ten = sheet.getName();
  if (!SCHEMA[ten]) { thongBaoSaiTab(); return; }

  var ranges = sheet.getActiveRangeList() ? sheet.getActiveRangeList().getRanges() : [sheet.getActiveRange()];
  var dsDong = [];
  ranges.forEach(function(rg) {
    var dau = rg.getRow(), so = rg.getNumRows();
    for (var i = 0; i < so; i++) {
      var r = dau + i;
      if (r >= 2) dsDong.push(r);
    }
  });
  // loại trùng
  dsDong = dsDong.filter(function(v, i) { return dsDong.indexOf(v) === i; });
  guiLaiTheoDanhSach(sheet, ten, dsDong);
}

// --- Lõi xử lý gửi lại theo danh sách dòng ---
function guiLaiTheoDanhSach(sheet, ten, dsDong) {
  var ui = SpreadsheetApp.getUi();
  if (!dsDong.length) {
    ui.alert("Không có dòng nào cần gửi lại.");
    return;
  }
  var tl = ui.alert("Xác nhận", "Sẽ gửi lại mail cho " + dsDong.length + " người trong tab [" + ten + "]. Tiếp tục?", ui.ButtonSet.YES_NO);
  if (tl !== ui.Button.YES) return;

  capNhatHeaderTrangThai(sheet, ten);
  var thanhCong = 0, that_bai = 0;
  dsDong.forEach(function(r) {
    var data = docDuLieuDong(sheet, ten, r);
    if (!data.email) return;
    var kq = guiMail(ten, data);
    ghiTrangThaiMail(sheet, ten, r, kq);
    if (kq.ok) thanhCong++; else that_bai++;
    Utilities.sleep(300); // nhẹ tay với hạn mức gửi mail
  });

  ui.alert("Hoàn tất", "✅ Gửi thành công: " + thanhCong + "\n❌ Thất bại: " + that_bai, ui.ButtonSet.OK);
}

// Đọc lại dữ liệu 1 dòng -> object data (để dựng lại nội dung mail)
function docDuLieuDong(sheet, ten, row) {
  var f = SCHEMA[ten].fields;
  var data = { formType: ten };
  Object.keys(f).forEach(function(key) {
    data[key] = sheet.getRange(row, f[key]).getValue();
  });
  return data;
}

// Ghi trạng thái mail vào cột statusCol
function ghiTrangThaiMail(sheet, ten, row, kq) {
  var col = SCHEMA[ten].statusCol;
  var gio = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm");
  var text = kq.ok ? ("✅ Đã gửi - " + gio) : ("❌ LỖI - " + gio + " - " + kq.message);
  var cell = sheet.getRange(row, col);
  cell.setValue(text);
  cell.setFontColor(kq.ok ? "#15803d" : "#b91c1c");
}

// Đảm bảo có tiêu đề cột trạng thái
function capNhatHeaderTrangThai(sheet, ten) {
  var col = SCHEMA[ten].statusCol;
  var h = sheet.getRange(1, col);
  if (!h.getValue()) {
    h.setValue(SCHEMA[ten].headerTrangThai).setFontWeight("bold");
  }
}

function thongBaoSaiTab() {
  SpreadsheetApp.getUi().alert(
    "Vui lòng mở đúng tab [Tham_du] hoặc [Bao_cao] rồi thực hiện lại."
  );
}

// ---------------------------------------------------------------------
//  TẠO & GỬI MAIL XÁC NHẬN  -> trả về { ok: bool, message: string }
// ---------------------------------------------------------------------
function guiMail(loai, data) {
  try {
    var email = String(data.email || "").trim();
    if (!email || email.indexOf("@") === -1) {
      return { ok: false, message: "Email không hợp lệ" };
    }

    var hoVaTen = [data.hocVi, data.hoTen].filter(Boolean).join(" ").trim();
    var subject, htmlBody;

    if (loai === "Tham_du") {
      subject = "[XÁC NHẬN] Đăng ký tham dự " + CONFIG.tenHoiNghi;
      var bangTD =
        hangThongTin("Họ và tên", hoVaTen) +
        hangThongTin("Giới tính", data.gioiTinh) +
        hangThongTin("Ngày sinh", data.ngaySinh) +
        hangThongTin("Tỉnh / Thành", data.tinhThanh) +
        hangThongTin("Phường / Xã", data.phuongXa) +
        hangThongTin("Địa chỉ", data.diaChi) +
        hangThongTin("Số điện thoại", data.soDienThoai) +
        hangThongTin("Email", email) +
        hangThongTin("Cấp CME", data.capCME);
      htmlBody = mauMail(
        "Xác nhận ĐĂNG KÝ THAM DỰ", hoVaTen,
        "Ban Tổ chức xin trân trọng <b>xác nhận đã nhận được đăng ký tham dự</b> của Quý đại biểu. Thông tin đăng ký của Quý vị như sau:",
        bangTD,
        "Ban Tổ chức sẽ gửi thông tin chi tiết về chương trình và hướng dẫn tham dự qua email/điện thoại trước ngày diễn ra Hội nghị. Trường hợp cần điều chỉnh thông tin, vui lòng phản hồi lại email này."
      );
    } else { // Bao_cao
      subject = "[XÁC NHẬN] Đăng ký báo cáo khoa học - " + CONFIG.tenHoiNghi;
      var bangBC =
        hangThongTin("Họ và tên", hoVaTen) +
        hangThongTin("Giới tính", data.gioiTinh) +
        hangThongTin("Ngày sinh", data.ngaySinh) +
        hangThongTin("Đơn vị công tác", data.donVi) +
        hangThongTin("Số điện thoại", data.soDienThoai) +
        hangThongTin("Email", email) +
        hangThongTin("Tiêu đề báo cáo", data.tieuDe) +
        hangThongTin("Đồng ý chia sẻ tài liệu", data.dongYChiaSe);
      htmlBody = mauMail(
        "Xác nhận ĐĂNG KÝ BÁO CÁO KHOA HỌC", hoVaTen,
        "Ban Tổ chức xin trân trọng <b>xác nhận đã nhận được đăng ký báo cáo khoa học</b> của Quý tác giả. Thông tin đăng ký của Quý vị như sau:",
        bangBC,
        "Bài báo cáo của Quý vị sẽ được Hội đồng Khoa học xem xét, phản biện. Ban Tổ chức sẽ thông báo kết quả và hình thức trình bày (báo cáo miệng / poster) qua email trong thời gian sớm nhất. Trường hợp cần cập nhật bài hoặc thông tin, vui lòng phản hồi lại email này."
      );
    }

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: "Ban Tổ chức Hội nghị - BV Đa khoa Hùng Vương",
      replyTo: CONFIG.emailBTC
    });

    console.log("Đã gửi mail [" + loai + "] tới: " + email);
    return { ok: true, message: "" };

  } catch (mailErr) {
    console.error("LỖI GỬI MAIL [" + loai + "]: " + mailErr.toString());
    return { ok: false, message: mailErr.toString() };
  }
}

// Tạo 1 hàng trong bảng thông tin (bỏ qua nếu rỗng)
function hangThongTin(nhan, giaTri) {
  if (giaTri === undefined || giaTri === null || String(giaTri).trim() === "") return "";
  return '<tr>' +
    '<td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;color:#334155;width:40%;">' + nhan + '</td>' +
    '<td style="padding:8px 12px;border:1px solid #e5e7eb;color:#0f172a;">' + escapeHtml(String(giaTri)) + '</td>' +
    '</tr>';
}

// Khung mail HTML dùng chung
function mauMail(tieuDe, hoVaTen, doanMoDau, bangThongTin, doanKetThuc) {
  var loiChao = hoVaTen ? ("Kính gửi " + escapeHtml(hoVaTen) + ",") : "Kính gửi Quý đại biểu,";

  return '' +
  '<div style="margin:0;padding:0;background:#f1f5f9;">' +
  '<div style="max-width:600px;margin:0 auto;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">' +

    '<div style="background:' + CONFIG.mauChinh + ';color:#ffffff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">' +
      '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.9;">Bệnh viện Đa khoa Hùng Vương</div>' +
      '<div style="font-size:18px;font-weight:800;margin-top:6px;line-height:1.4;">' + CONFIG.tenHoiNghi + '</div>' +
    '</div>' +

    '<div style="background:#ffffff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;">' +
      '<h2 style="margin:0 0 16px;font-size:17px;color:' + CONFIG.mauChinh + ';">' + tieuDe + '</h2>' +
      '<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">' + loiChao + '</p>' +
      '<p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:1.7;">' + doanMoDau + '</p>' +

      '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">' + bangThongTin + '</table>' +

      '<div style="background:#f0f9ff;border-left:4px solid ' + CONFIG.mauChinh + ';padding:14px 16px;border-radius:6px;margin-bottom:20px;">' +
        '<p style="margin:0 0 6px;color:#0f172a;font-size:14px;"><b>🗓 Thời gian:</b> ' + CONFIG.thoiGian + '</p>' +
        '<p style="margin:0;color:#0f172a;font-size:14px;"><b>📍 Địa điểm:</b> ' + CONFIG.diaDiem + '</p>' +
      '</div>' +

      '<p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:1.7;">' + doanKetThuc + '</p>' +

      '<p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">' +
        'Trân trọng cảm ơn sự quan tâm và tham gia của Quý vị.<br><b>BAN TỔ CHỨC HỘI NGHỊ</b>' +
      '</p>' +
    '</div>' +

    '<div style="background:#0f172a;color:#94a3b8;padding:18px 24px;border-radius:0 0 12px 12px;font-size:12px;line-height:1.7;">' +
      '<div style="color:#ffffff;font-weight:700;margin-bottom:6px;">Liên hệ Ban Tổ chức</div>' +
      '<div>' + CONFIG.hotline + '</div>' +
      '<div>Email: <a href="mailto:' + CONFIG.emailBTC + '" style="color:#38bdf8;">' + CONFIG.emailBTC + '</a></div>' +
      '<div style="margin-top:10px;font-style:italic;opacity:.7;">Đây là email tự động xác nhận đăng ký. Vui lòng không xem đây là thư mời chính thức.</div>' +
    '</div>' +

  '</div>' +
  '</div>';
}

// Chống lỗi hiển thị / chèn HTML ngoài ý muốn
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------
//  HÀM TEST: chạy thẳng trong editor để kiểm tra việc gửi mail
//  -> Đổi 'email' bên dưới thành mail của bạn rồi bấm Run hàm này
// ---------------------------------------------------------------------
function testGuiMail() {
  var duLieuThu = {
    hocVi: "CN.", hoTen: "Nguyễn Văn A (THỬ)", gioiTinh: "Nam", ngaySinh: "01/01/1990",
    tinhThanh: "Phú Thọ", phuongXa: "Phường X", diaChi: "123 Đường Y",
    soDienThoai: "0900000000", email: "nguyenlam.bvhv@gmail.com", capCME: "Có"
  };
  var kq = guiMail("Tham_du", duLieuThu);
  console.log("Kết quả gửi mail THỬ: " + JSON.stringify(kq));
}

// Trả về JSON response chuẩn
function jsonResponse(status, message) {
  return ContentService.createTextOutput(JSON.stringify({
    "status": status, "message": message
  })).setMimeType(ContentService.MimeType.JSON);
}
