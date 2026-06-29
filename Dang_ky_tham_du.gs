function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // ĐIỀN ID THƯ MỤC GOOGLE DRIVE CỦA BẠN VÀO ĐÂY
    var folderId = '1HIw48KpRhGEop5UX7P-9Bu_uHnkeHrO9'; 
    var folder = DriveApp.getFolderById(folderId);

    // --- TRACKING 1: Xem dữ liệu nhận từ Web là gì ---
    console.log("1. TÊN TAB MÀ WEB ĐANG TÌM: '" + data.formType + "'");

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = spreadsheet.getSheets();
    var allNames = allSheets.map(function(s) { return s.getName(); });
    
    // --- TRACKING 2: Xem trong file Sheet đang có những Tab nào ---
    console.log("2. CÁC TAB HIỆN CÓ TRONG GOOGLE SHEETS: " + allNames.join(", "));

    var sheetName = data.formType; 
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    // --- CHỐT CHẶN BÁO LỖI ---
    if (!sheet) {
      console.error("=> KẾT LUẬN LỖI: Không tìm thấy tab nào có tên chính xác là '" + sheetName + "'");
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error", 
        "message": "Lỗi: Không tìm thấy tab [" + sheetName + "]. Các tab đang có là: " + allNames.join(", ")
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Hàm hỗ trợ upload file
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

    return ContentService.createTextOutput(JSON.stringify({
      "status": "success", "message": "Đã lưu thành công!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("LỖI HỆ THỐNG: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error", "message": "Lỗi máy chủ: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}