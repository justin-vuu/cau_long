/**
 * ĐẤU TRƯỜNG CẦU LÔNG — Google Apps Script API
 * Runtime: V8. Múi giờ khuyến nghị: Asia/Ho_Chi_Minh.
 * Không chạy seed tự động. Mọi dữ liệu production nằm trong Google Sheet.
 */

const SCHEMA = {
  GiaiDau: ['MaGiai', 'TenGiai', 'DiaDiem', 'NgayBatDau', 'HanDangKy', 'TrangThai', 'SoNguoiToiThieu', 'CoTranhHangBa', 'ThoiGianBocTham', 'NguoiBocTham'],
  NguoiChoi: ['MaNguoiChoi', 'MaGiai', 'HoTen', 'SoDienThoai', 'GioiTinh', 'TrinhDo', 'CauLacBo', 'GhiChu', 'TrangThai', 'ThoiGianDangKy', 'DaChuyenKhoan'],
  DoiThiDau: ['MaDoi', 'MaGiai', 'MaNguoiChoi1', 'MaNguoiChoi2', 'ViTriBracket', 'TenHienThi', 'TrangThai', 'BangDau'],
  TranDau: ['MaTran', 'MaGiai', 'Vong', 'ThuTuTran', 'MaDoi1', 'MaDoi2', 'MaDoiThang', 'TySoHiep1', 'TySoHiep2', 'TySoHiep3', 'TrangThai', 'MaTranTiepTheo', 'ViTriVaoTranTiepTheo', 'GhiChu'],
  NguoiDung: ['MaNguoiDung', 'TaiKhoan', 'HoTen', 'VaiTro', 'TrangThai', 'MatKhauHash'],
  NhatKy: ['MaNhatKy', 'MaGiai', 'ThoiGian', 'NguoiThucHien', 'HanhDong', 'NoiDung'],
};
const DATABASE_SCHEMA_VERSION = '2026-08-03.3';
let spreadsheetInstance = null;

const PUBLIC_ACTIONS = new Set([
  'dangNhap', 'layGiaiDauCongKhai', 'dangKyNguoiChoi',
  'layDanhSachNguoiChoiCongKhai', 'layDanhSachDoiCongKhai', 'layBangDauCongKhai',
]);
const WRITE_ACTIONS = new Set([
  'dangKyNguoiChoi', 'luuGiaiDau', 'themNguoiChoi', 'suaNguoiChoi', 'xoaNguoiChoi',
  'capNhatTrangThaiNguoiChoi', 'khoaDangKy', 'moDangKy', 'bocThamGiaiDau',
  'huyKetQuaBocTham', 'capNhatKetQuaTranDau',
]);
const CACHEABLE_ADMIN_ACTIONS = new Set([
  'layDashboardGiaiDau', 'layGiaiDauQuanTri', 'layDanhSachNguoiChoiQuanTri',
  'layDuLieuBocTham', 'layDanhSachTranDauQuanTri',
]);

function doGet() {
  return jsonOutput({ ok: true, data: { service: 'Đấu Trường Cầu Lông API', status: 'healthy', time: new Date().toISOString() } });
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validateSharedSecret(request.sharedSecret);
    ensureDatabase();
    const action = String(request.action || '');
    if (!action) throw apiError('Thiếu action.', 'BAD_REQUEST');
    if (!PUBLIC_ACTIONS.has(action)) request._user = verifySession(request.sessionToken);

    const handlers = {
      dangNhap, xacThucPhien, layGiaiDauCongKhai, dangKyNguoiChoi,
      layDanhSachNguoiChoiCongKhai, layDanhSachDoiCongKhai, layBangDauCongKhai,
      layDashboardGiaiDau, layGiaiDauQuanTri, luuGiaiDau,
      layDanhSachNguoiChoiQuanTri, themNguoiChoi, suaNguoiChoi, xoaNguoiChoi,
      capNhatTrangThaiNguoiChoi, khoaDangKy, moDangKy,
      layDuLieuBocTham, bocThamGiaiDau, huyKetQuaBocTham,
      layDanhSachTranDauQuanTri, capNhatKetQuaTranDau,
    };
    if (!handlers[action]) throw apiError('Action không được hỗ trợ.', 'NOT_FOUND');
    const data = CACHEABLE_ADMIN_ACTIONS.has(action) ? cached('admin:' + action, 20, () => handlers[action](request)) : handlers[action](request);
    if (WRITE_ACTIONS.has(action)) bumpCacheVersion();
    return jsonOutput({ ok: true, data: data === undefined ? {} : data });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput({ ok: false, error: error.message || 'Lỗi hệ thống.', code: error.code || 'SERVER_ERROR' });
  }
}

// ---------- CẤU HÌNH, SCHEMA VÀ XÁC THỰC ----------

function ensureDatabase() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('DATABASE_SCHEMA_VERSION') !== DATABASE_SCHEMA_VERSION) ensureDatabaseSheetsOnly();
  if (props.getProperty('INITIAL_ADMIN_PASSWORD')) ensureInitialAdmin();
}

function getSpreadsheet() {
  if (spreadsheetInstance) return spreadsheetInstance;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw apiError('Chưa cấu hình Script Property SPREADSHEET_ID.', 'CONFIG_ERROR');
  spreadsheetInstance = SpreadsheetApp.openById(id);
  return spreadsheetInstance;
}

function ensureSheet(spreadsheet, name, requiredHeaders) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const lastColumn = sheet.getLastColumn();
  const current = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
  if (!current.some(Boolean)) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    const missing = requiredHeaders.filter(header => current.indexOf(header) === -1);
    if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#14233d').setFontColor('#ffffff');
}

function ensureInitialAdmin() {
  const props = PropertiesService.getScriptProperties();
  const username = String(props.getProperty('INITIAL_ADMIN_USERNAME') || '').trim().toLowerCase();
  const password = String(props.getProperty('INITIAL_ADMIN_PASSWORD') || '');
  const name = String(props.getProperty('INITIAL_ADMIN_NAME') || 'Quản trị viên').trim();
  if (!username || !password) return;
  const users = readRows('NguoiDung');
  if (!users.some(user => String(user.TaiKhoan).toLowerCase() === username)) {
    appendRow('NguoiDung', {
      MaNguoiDung: makeId('USR'), TaiKhoan: username, HoTen: name,
      VaiTro: 'ADMIN', TrangThai: 'HOAT_DONG', MatKhauHash: hashPassword(username, password),
    });
    appendLog('', username, 'TAO_ADMIN_BAN_DAU', 'Tạo tài khoản Admin ban đầu từ Script Properties.');
    // Mật khẩu khởi tạo chỉ dùng một lần, không giữ plaintext trong Script Properties.
    props.deleteProperty('INITIAL_ADMIN_PASSWORD');
  }
}

/**
 * Chỉ chạy thủ công trong Apps Script khi cần khôi phục Admin ban đầu.
 * Đọc INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME từ Script Properties.
 * Nếu user đã tồn tại, hàm đặt lại mật khẩu; nếu chưa có, hàm tạo mới.
 */
function khoiTaoHoacDatLaiAdminTuProperties() {
  const props = PropertiesService.getScriptProperties();
  const username = String(props.getProperty('INITIAL_ADMIN_USERNAME') || '').trim().toLowerCase();
  const password = String(props.getProperty('INITIAL_ADMIN_PASSWORD') || '');
  const name = String(props.getProperty('INITIAL_ADMIN_NAME') || 'Quản trị viên').trim();
  if (!username) throw new Error('Thiếu Script Property INITIAL_ADMIN_USERNAME.');
  if (!password) throw new Error('Thiếu Script Property INITIAL_ADMIN_PASSWORD. Hãy thêm mật khẩu mới rồi chạy lại hàm này.');

  ensureDatabaseSheetsOnly();
  const existing = readRows('NguoiDung').find(user => String(user.TaiKhoan).toLowerCase() === username);
  const record = {
    MaNguoiDung: existing ? existing.MaNguoiDung : makeId('USR'), TaiKhoan: username, HoTen: name,
    VaiTro: 'ADMIN', TrangThai: 'HOAT_DONG', MatKhauHash: hashPassword(username, password),
  };
  if (existing) updateRow('NguoiDung', 'MaNguoiDung', existing.MaNguoiDung, record);
  else appendRow('NguoiDung', record);
  appendLog('', username, existing ? 'DAT_LAI_MAT_KHAU_ADMIN' : 'TAO_ADMIN_THU_CONG', 'Khôi phục Admin từ Script Properties.');
  SpreadsheetApp.flush();
  props.deleteProperty('INITIAL_ADMIN_PASSWORD');
  console.log('Đã ' + (existing ? 'đặt lại mật khẩu' : 'tạo') + ' tài khoản Admin: ' + username);
  return { success: true, username: username, reset: !!existing };
}

function ensureDatabaseSheetsOnly() {
  const spreadsheet = getSpreadsheet();
  Object.keys(SCHEMA).forEach(name => ensureSheet(spreadsheet, name, SCHEMA[name]));
  PropertiesService.getScriptProperties().setProperty('DATABASE_SCHEMA_VERSION', DATABASE_SCHEMA_VERSION);
}

function validateSharedSecret(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('APP_SHARED_SECRET');
  if (!expected || !constantTimeEqual(String(provided || ''), expected)) throw apiError('Yêu cầu không được xác thực.', 'UNAUTHORIZED');
}

function dangNhap(request) {
  const username = String(request.TaiKhoan || '').trim().toLowerCase();
  const password = String(request.MatKhau || '');
  if (!username || !password) throw apiError('Vui lòng nhập tài khoản và mật khẩu.', 'BAD_REQUEST');
  const user = readRows('NguoiDung').find(item => String(item.TaiKhoan).toLowerCase() === username && String(item.TrangThai) === 'HOAT_DONG');
  if (!user || !constantTimeEqual(hashPassword(username, password), String(user.MatKhauHash))) {
    throw apiError('Tài khoản hoặc mật khẩu không đúng.', 'UNAUTHORIZED');
  }
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const token = createSessionToken(user, expiresAt);
  appendLog('', username, 'DANG_NHAP', 'Đăng nhập khu vực quản trị.');
  return { token, expiresAt, user: safeUser(user) };
}

function xacThucPhien(request) { return { user: safeUser(request._user) }; }

function hashPassword(username, password) {
  const pepper = getRequiredProperty('APP_SHARED_SECRET');
  const bytes = Utilities.computeHmacSha256Signature(String(username).toLowerCase() + ':' + String(password), pepper);
  return bytesToHex(bytes);
}

function createSessionToken(user, expiresAt) {
  const payload = { uid: user.MaNguoiDung, usr: user.TaiKhoan, role: user.VaiTro, exp: expiresAt, nonce: Utilities.getUuid() };
  const encoded = Utilities.base64EncodeWebSafe(JSON.stringify(payload)).replace(/=+$/, '');
  const signature = signText(encoded);
  return encoded + '.' + signature;
}

function verifySession(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2 || !constantTimeEqual(signText(parts[0]), parts[1])) throw new Error('bad signature');
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(padBase64(parts[0]))).getDataAsString());
    if (!payload.exp || Number(payload.exp) < Date.now()) throw new Error('expired');
    const cache = CacheService.getScriptCache();
    const cacheKey = 'admin-user:' + String(payload.uid);
    const cachedUser = cache.get(cacheKey);
    const user = cachedUser ? JSON.parse(cachedUser) : readRows('NguoiDung').find(item => String(item.MaNguoiDung) === String(payload.uid));
    if (!user || String(user.TrangThai) !== 'HOAT_DONG' || String(user.VaiTro) !== 'ADMIN') throw new Error('disabled');
    if (!cachedUser) cache.put(cacheKey, JSON.stringify(stripInternal(user)), 300);
    return user;
  } catch (e) { throw apiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'UNAUTHORIZED'); }
}

function signText(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text, getRequiredProperty('APP_SHARED_SECRET'))).replace(/=+$/, '');
}

function safeUser(user) { return pick(user, ['MaNguoiDung', 'TaiKhoan', 'HoTen', 'VaiTro']); }

// ---------- GIẢI ĐẤU VÀ DASHBOARD ----------

function layGiaiDauCongKhai() {
  return cached('tournament-public', 60, () => decorateTournament(requireTournament()));
}

function layGiaiDauQuanTri() { return getTournament() || null; }

function luuGiaiDau(request) {
  const input = request.tournament || {};
  const name = cleanText(input.TenGiai, 150);
  const location = cleanText(input.DiaDiem, 180);
  const start = parseDateRequired(input.NgayBatDau, 'Thời gian bắt đầu');
  const deadline = parseDateRequired(input.HanDangKy, 'Hạn đăng ký');
  if (!name || !location) throw apiError('Tên giải và địa điểm là bắt buộc.', 'VALIDATION_ERROR');
  if (deadline.getTime() >= start.getTime()) throw apiError('Hạn đăng ký phải trước thời gian bắt đầu.', 'VALIDATION_ERROR');
  const existing = getTournament();
  const record = {
    MaGiai: existing ? existing.MaGiai : makeId('GIAI'), TenGiai: name, DiaDiem: location,
    NgayBatDau: start, HanDangKy: deadline,
    TrangThai: existing ? existing.TrangThai : 'DANG_DANG_KY',
    SoNguoiToiThieu: Math.max(6, Number(input.SoNguoiToiThieu) || 32),
    CoTranhHangBa: toBoolean(input.CoTranhHangBa),
    ThoiGianBocTham: existing ? existing.ThoiGianBocTham : '', NguoiBocTham: existing ? existing.NguoiBocTham : '',
  };
  if (existing) updateRow('GiaiDau', 'MaGiai', existing.MaGiai, record); else appendRow('GiaiDau', record);
  appendLog(record.MaGiai, request._user.TaiKhoan, existing ? 'CAP_NHAT_GIAI' : 'TAO_GIAI', name);
  return record;
}

function layDashboardGiaiDau() {
  const tournament = requireTournament();
  const players = rowsForTournament('NguoiChoi', tournament.MaGiai);
  const teams = rowsForTournament('DoiThiDau', tournament.MaGiai);
  const matches = rowsForTournament('TranDau', tournament.MaGiai);
  const playable = matches.filter(match => String(match.TrangThai) !== 'MIEN_DAU');
  return {
    tournament: decorateTournament(tournament), tongNguoiDangKy: players.length,
    soNguoiXacNhan: players.filter(player => String(player.TrangThai) === 'DA_XAC_NHAN').length,
    soDoi: teams.length, soTranHoanThanh: playable.filter(match => String(match.TrangThai) === 'HOAN_THANH' || String(match.TrangThai) === 'BO_CUOC').length,
    tongSoTran: playable.length,
  };
}

function decorateTournament(tournament) {
  const players = rowsForTournament('NguoiChoi', tournament.MaGiai);
  return Object.assign({}, publicTournament(tournament), {
    SoNguoiDangKy: players.length,
    SoNguoiXacNhan: players.filter(player => String(player.TrangThai) === 'DA_XAC_NHAN').length,
  });
}

function publicTournament(tournament) { return pick(tournament, SCHEMA.GiaiDau); }

// ---------- NGƯỜI CHƠI ----------

function dangKyNguoiChoi(request) {
  return withLock(() => {
    const tournament = requireTournament();
    if (String(tournament.TrangThai) !== 'DANG_DANG_KY') throw apiError('Giải đấu hiện không nhận đăng ký.', 'REGISTRATION_CLOSED');
    if (new Date(tournament.HanDangKy).getTime() < Date.now()) throw apiError('Đã quá hạn đăng ký.', 'REGISTRATION_CLOSED');
    if (!toBoolean((request.player || {}).DaChuyenKhoan)) throw apiError('Chỉ người đã chuyển khoản lệ phí mới được đăng ký.', 'PAYMENT_REQUIRED');
    const player = validatePlayer(request.player || {}, tournament.MaGiai, '', false);
    appendRow('NguoiChoi', player);
    appendLog(tournament.MaGiai, player.MaNguoiChoi, 'DANG_KY_CONG_KHAI', player.HoTen);
    return { MaNguoiChoi: player.MaNguoiChoi, TrangThai: player.TrangThai };
  });
}

function layDanhSachNguoiChoiCongKhai() {
  return cached('players-public', 45, () => {
    const tournament = requireTournament();
    const players = rowsForTournament('NguoiChoi', tournament.MaGiai)
      .sort((a, b) => new Date(a.ThoiGianDangKy) - new Date(b.ThoiGianDangKy))
      .map(player => pick(player, ['MaNguoiChoi', 'MaGiai', 'HoTen', 'GioiTinh', 'TrinhDo', 'CauLacBo', 'TrangThai', 'ThoiGianDangKy']));
    return { tournament: publicTournament(tournament), players };
  });
}

function layDanhSachNguoiChoiQuanTri() {
  const tournament = requireTournament();
  return { tournament, players: rowsForTournament('NguoiChoi', tournament.MaGiai).sort((a, b) => new Date(b.ThoiGianDangKy) - new Date(a.ThoiGianDangKy)) };
}

function themNguoiChoi(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  const player = validatePlayer(request.player || {}, tournament.MaGiai, '', true);
  appendRow('NguoiChoi', player);
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'THEM_NGUOI_CHOI', player.HoTen);
  return player;
}

function suaNguoiChoi(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  const id = String((request.player || {}).MaNguoiChoi || '');
  const current = rowsForTournament('NguoiChoi', tournament.MaGiai).find(player => String(player.MaNguoiChoi) === id);
  if (!current) throw apiError('Không tìm thấy người chơi.', 'NOT_FOUND');
  const player = validatePlayer(request.player || {}, tournament.MaGiai, id, true);
  player.MaNguoiChoi = id; player.ThoiGianDangKy = current.ThoiGianDangKy;
  updateRow('NguoiChoi', 'MaNguoiChoi', id, player);
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'SUA_NGUOI_CHOI', id + ' - ' + player.HoTen);
  return player;
}

function xoaNguoiChoi(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  const id = String(request.MaNguoiChoi || '');
  const player = rowsForTournament('NguoiChoi', tournament.MaGiai).find(item => String(item.MaNguoiChoi) === id);
  if (!player) throw apiError('Không tìm thấy người chơi.', 'NOT_FOUND');
  deleteRow('NguoiChoi', 'MaNguoiChoi', id);
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'XOA_NGUOI_CHOI', id + ' - ' + player.HoTen);
  return { success: true };
}

function capNhatTrangThaiNguoiChoi(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  const status = String(request.TrangThai || '');
  if (['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'TU_CHOI'].indexOf(status) === -1) throw apiError('Trạng thái không hợp lệ.', 'VALIDATION_ERROR');
  const player = rowsForTournament('NguoiChoi', tournament.MaGiai).find(item => String(item.MaNguoiChoi) === String(request.MaNguoiChoi || ''));
  if (!player) throw apiError('Không tìm thấy người chơi.', 'NOT_FOUND');
  if (status === 'DA_XAC_NHAN' && !toBoolean(player.DaChuyenKhoan)) throw apiError('Chỉ xác nhận người chơi sau khi đã đối soát chuyển khoản.', 'PAYMENT_REQUIRED');
  updateRow('NguoiChoi', 'MaNguoiChoi', String(request.MaNguoiChoi || ''), { TrangThai: status });
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'CAP_NHAT_TRANG_THAI_NGUOI_CHOI', request.MaNguoiChoi + ' -> ' + status);
  return { success: true };
}

function validatePlayer(input, tournamentId, excludeId, isAdmin) {
  const name = cleanText(input.HoTen, 80);
  const phone = normalizePhone(input.SoDienThoai);
  const gender = cleanText(input.GioiTinh, 20);
  const level = cleanText(input.TrinhDo || 'Chưa phân loại', 30);
  if (name.length < 2) throw apiError('Họ tên phải có ít nhất 2 ký tự.', 'VALIDATION_ERROR');
  if (!/^0\d{9}$/.test(phone)) throw apiError('Số điện thoại Việt Nam không hợp lệ.', 'VALIDATION_ERROR');
  if (['Nam', 'Nữ', 'Khác'].indexOf(gender) === -1) throw apiError('Giới tính không hợp lệ.', 'VALIDATION_ERROR');
  if (['Chưa phân loại', 'Mới chơi', 'Trung bình', 'Khá', 'Nâng cao'].indexOf(level) === -1) throw apiError('Trình độ không hợp lệ.', 'VALIDATION_ERROR');
  const duplicate = rowsForTournament('NguoiChoi', tournamentId).some(player => normalizePhone(player.SoDienThoai) === phone && String(player.MaNguoiChoi) !== excludeId);
  if (duplicate) throw apiError('Số điện thoại này đã đăng ký trong giải.', 'DUPLICATE_PHONE');
  let status = isAdmin ? String(input.TrangThai || 'DA_XAC_NHAN') : 'CHO_XAC_NHAN';
  if (['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'TU_CHOI'].indexOf(status) === -1) status = 'CHO_XAC_NHAN';
  return {
    MaNguoiChoi: excludeId || makeId('NC'), MaGiai: tournamentId, HoTen: name, SoDienThoai: phone,
    GioiTinh: gender, TrinhDo: level, CauLacBo: cleanText(input.CauLacBo, 120),
    GhiChu: cleanText(input.GhiChu, 500), TrangThai: status, ThoiGianDangKy: new Date(), DaChuyenKhoan: isAdmin ? true : toBoolean(input.DaChuyenKhoan),
  };
}

function khoaDangKy(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  const validCount = rowsForTournament('NguoiChoi', tournament.MaGiai).filter(player => String(player.TrangThai) === 'DA_XAC_NHAN').length;
  const minimum = Math.max(6, Number(tournament.SoNguoiToiThieu) || 32);
  if (validCount < minimum) throw apiError('Cần ít nhất ' + minimum + ' người đã xác nhận để khóa đăng ký.', 'DRAW_CONDITION');
  if (validCount % 2 !== 0) throw apiError('Số người hợp lệ phải là số chẵn.', 'DRAW_CONDITION');
  updateRow('GiaiDau', 'MaGiai', tournament.MaGiai, { TrangThai: 'DA_KHOA_DANG_KY' });
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'KHOA_DANG_KY', validCount + ' người hợp lệ.');
  return { success: true };
}

function moDangKy(request) {
  const tournament = requireTournament(); assertRosterEditable(tournament);
  updateRow('GiaiDau', 'MaGiai', tournament.MaGiai, { TrangThai: 'DANG_DANG_KY' });
  appendLog(tournament.MaGiai, request._user.TaiKhoan, 'MO_DANG_KY', 'Mở lại đăng ký.');
  return { success: true };
}

function assertRosterEditable(tournament) {
  if (rowsForTournament('DoiThiDau', tournament.MaGiai).length) throw apiError('Không thể thay đổi danh sách sau khi đã bốc thăm.', 'ROSTER_LOCKED');
}

// ---------- BỐC THĂM VÀ TẠO BRACKET ----------

function layDuLieuBocTham() {
  const tournament = requireTournament();
  const eligiblePlayers = rowsForTournament('NguoiChoi', tournament.MaGiai).filter(player => String(player.TrangThai) === 'DA_XAC_NHAN');
  const teams = rowsForTournament('DoiThiDau', tournament.MaGiai);
  const minimum = Math.max(6, Number(tournament.SoNguoiToiThieu) || 32);
  let reason = '';
  if (teams.length) reason = 'Giải đã có kết quả bốc thăm.';
  else if (String(tournament.TrangThai) !== 'DA_KHOA_DANG_KY') reason = 'Cần khóa đăng ký trước khi bốc thăm.';
  else if (eligiblePlayers.length < minimum) reason = 'Cần ít nhất ' + minimum + ' người hợp lệ.';
  else if (eligiblePlayers.length % 2) reason = 'Số người hợp lệ phải là số chẵn.';
  return { tournament, eligiblePlayers, teams, canDraw: !reason, reason };
}

function bocThamGiaiDau(request) {
  return withLock(() => {
    const tournament = requireTournament();
    if (String(tournament.TrangThai) !== 'DA_KHOA_DANG_KY') throw apiError('Cần khóa đăng ký trước khi bốc thăm.', 'DRAW_CONDITION');
    if (rowsForTournament('DoiThiDau', tournament.MaGiai).length) throw apiError('Giải đã bốc thăm. Hãy hủy kết quả trước khi thực hiện lại.', 'ALREADY_DRAWN');
    const players = rowsForTournament('NguoiChoi', tournament.MaGiai).filter(player => String(player.TrangThai) === 'DA_XAC_NHAN');
    const minimum = Math.max(6, Number(tournament.SoNguoiToiThieu) || 32);
    if (players.length < minimum || players.length % 2) throw apiError('Danh sách phải có ít nhất ' + minimum + ' người hợp lệ và là số chẵn.', 'DRAW_CONDITION');

    fisherYates(players);
    const teams = [];
    for (let i = 0; i < players.length; i += 2) {
      const number = teams.length + 1;
      teams.push({
        MaDoi: 'DOI-' + String(number).padStart(2, '0'), MaGiai: tournament.MaGiai,
        MaNguoiChoi1: players[i].MaNguoiChoi, MaNguoiChoi2: players[i + 1].MaNguoiChoi,
        ViTriBracket: 0, TenHienThi: 'Đội ' + String(number).padStart(2, '0') + ' · ' + players[i].HoTen + ' & ' + players[i + 1].HoTen,
        TrangThai: 'DANG_THI_DAU',
      });
    }
    fisherYates(teams);
    const groupCount = determineGroupCount(teams.length);
    teams.forEach((team, index) => {
      team.BangDau = String.fromCharCode(65 + (index % groupCount));
      team.ViTriBracket = index + 1;
    });
    const matches = createGroupStageMatches(tournament, teams, groupCount);
    replaceRows('DoiThiDau', teams);
    replaceRows('TranDau', matches);
    const now = new Date();
    updateRow('GiaiDau', 'MaGiai', tournament.MaGiai, { TrangThai: 'DA_BOC_THAM', ThoiGianBocTham: now, NguoiBocTham: request._user.HoTen || request._user.TaiKhoan });
    appendLog(tournament.MaGiai, request._user.TaiKhoan, 'BOC_THAM_GIAI_DAU', players.length + ' người, ' + teams.length + ' đội, ' + groupCount + ' bảng vòng tròn.');
    return { playersShuffled: players.length, teamsCreated: teams.length, groupCount, groupMatches: matches.length, bracketSize: groupCount * 2, byes: 0, drawTime: now };
  });
}

function determineGroupCount(teamCount) {
  if (teamCount >= 12) return 4;
  if (teamCount >= 6) return 2;
  if (teamCount >= 3) return 1;
  throw apiError('Cần ít nhất 3 đội để tổ chức vòng bảng.', 'DRAW_CONDITION');
}

function createGroupStageMatches(tournament, teams, groupCount) {
  const matches = [];
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
    const groupCode = String.fromCharCode(65 + groupIndex);
    const groupTeams = teams.filter(team => String(team.BangDau) === groupCode);
    let order = 1;
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          MaTran: 'VB-' + groupCode + '-' + String(order).padStart(2, '0'), MaGiai: tournament.MaGiai,
          Vong: 'VONG_BANG_' + groupCode, ThuTuTran: order,
          MaDoi1: groupTeams[i].MaDoi, MaDoi2: groupTeams[j].MaDoi, MaDoiThang: '',
          TySoHiep1: '', TySoHiep2: '', TySoHiep3: '', TrangThai: 'CHO_THI_DAU',
          MaTranTiepTheo: '', ViTriVaoTranTiepTheo: '', GhiChu: '',
        });
        order++;
      }
    }
  }
  return matches;
}

function distributeTeamsWithByes(teams, bracketSize) {
  const slots = Array(bracketSize).fill(null);
  const pairCount = bracketSize / 2;
  const pairOrder = Array.from({ length: pairCount }, (_, index) => index);
  fisherYates(pairOrder);
  for (let i = 0; i < pairCount; i++) {
    const side = Math.random() < 0.5 ? 0 : 1;
    slots[pairOrder[i] * 2 + side] = teams[i];
  }
  for (let i = pairCount; i < teams.length; i++) {
    const pair = pairOrder[i - pairCount];
    const emptySlot = slots[pair * 2] ? pair * 2 + 1 : pair * 2;
    slots[emptySlot] = teams[i];
  }
  return slots;
}

function createBracketMatches(tournament, slots, bracketSize) {
  const matches = [];
  const totalRounds = Math.log2(bracketSize);
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    for (let order = 1; order <= matchCount; order++) {
      const id = matchId(round, order);
      const nextId = round < totalRounds ? matchId(round + 1, Math.ceil(order / 2)) : '';
      const record = {
        MaTran: id, MaGiai: tournament.MaGiai, Vong: roundCode(bracketSize, round), ThuTuTran: order,
        MaDoi1: '', MaDoi2: '', MaDoiThang: '', TySoHiep1: '', TySoHiep2: '', TySoHiep3: '',
        TrangThai: 'CHO_THI_DAU', MaTranTiepTheo: nextId, ViTriVaoTranTiepTheo: order % 2 ? 1 : 2, GhiChu: '',
      };
      if (round === 1) {
        record.MaDoi1 = slots[(order - 1) * 2] ? slots[(order - 1) * 2].MaDoi : '';
        record.MaDoi2 = slots[(order - 1) * 2 + 1] ? slots[(order - 1) * 2 + 1].MaDoi : '';
        if (!!record.MaDoi1 !== !!record.MaDoi2) {
          record.MaDoiThang = record.MaDoi1 || record.MaDoi2;
          record.TrangThai = 'MIEN_DAU'; record.GhiChu = 'Tự động đi tiếp do suất BYE.';
        }
      }
      matches.push(record);
    }
  }
  // Đưa các đội được BYE vào vòng kế tiếp trước khi lưu.
  matches.filter(match => match.TrangThai === 'MIEN_DAU').forEach(match => propagateWinner(matches, match));
  if (toBoolean(tournament.CoTranhHangBa)) {
    matches.push({
      MaTran: 'T-HANG-BA', MaGiai: tournament.MaGiai, Vong: 'TRANH_HANG_BA', ThuTuTran: 1,
      MaDoi1: '', MaDoi2: '', MaDoiThang: '', TySoHiep1: '', TySoHiep2: '', TySoHiep3: '',
      TrangThai: 'CHO_THI_DAU', MaTranTiepTheo: '', ViTriVaoTranTiepTheo: '', GhiChu: '',
    });
  }
  return matches;
}

function huyKetQuaBocTham(request) {
  if (String(request.NoiDungXacNhan || '') !== 'HUY BOC THAM') throw apiError('Nội dung xác nhận không chính xác.', 'CONFIRMATION_REQUIRED');
  return withLock(() => {
    const tournament = requireTournament();
    replaceRows('DoiThiDau', []); replaceRows('TranDau', []);
    updateRow('GiaiDau', 'MaGiai', tournament.MaGiai, { TrangThai: 'DA_KHOA_DANG_KY', ThoiGianBocTham: '', NguoiBocTham: '' });
    appendLog(tournament.MaGiai, request._user.TaiKhoan, 'HUY_KET_QUA_BOC_THAM', 'Xóa toàn bộ đội và kết quả trận đấu.');
    return { success: true };
  });
}

// ---------- ĐỘI, BRACKET VÀ KẾT QUẢ ----------

function layDanhSachDoiCongKhai() {
  return cached('teams-public', 45, () => {
    const tournament = requireTournament();
    return { tournament: publicTournament(tournament), teams: enrichTeams(rowsForTournament('DoiThiDau', tournament.MaGiai), tournament.MaGiai).sort((a, b) => Number(a.ViTriBracket) - Number(b.ViTriBracket)) };
  });
}

function layBangDauCongKhai() { return cached('bracket-public', 30, () => buildBracketResponse()); }
function layDanhSachTranDauQuanTri() { return cached('matches-admin', 20, () => buildBracketResponse()); }

function buildBracketResponse() {
  const tournament = requireTournament();
  const teams = enrichTeams(rowsForTournament('DoiThiDau', tournament.MaGiai), tournament.MaGiai);
  const teamMap = Object.fromEntries(teams.map(team => [String(team.MaDoi), team]));
  const rawMatches = rowsForTournament('TranDau', tournament.MaGiai);
  const groupRawMatches = rawMatches.filter(isGroupMatch);
  const knockoutRawMatches = rawMatches.filter(match => !isGroupMatch(match) && String(match.Vong) !== 'TRANH_HANG_BA');
  const bracketSize = knockoutRawMatches.filter(match => roundNumber(match) === 1).length * 2;
  const matches = rawMatches.map(match => Object.assign({}, match, {
    SoVong: isGroupMatch(match) ? 0 : roundNumber(match),
    TenVong: isGroupMatch(match) ? 'Bảng ' + groupCodeFromMatch(match) : roundDisplayName(match, bracketSize),
    Doi1: teamMap[String(match.MaDoi1)] || null, Doi2: teamMap[String(match.MaDoi2)] || null,
    LaTranTranhHangBa: String(match.Vong) === 'TRANH_HANG_BA',
  }));
  const groupCodes = Array.from(new Set(teams.map(team => String(team.BangDau || '')).filter(Boolean))).sort();
  const standingsByGroup = calculateGroupStandings(teams, groupRawMatches);
  const groups = groupCodes.map(code => ({
    MaBang: code, TenBang: 'Bảng ' + code,
    standings: standingsByGroup[code] || [],
    matches: matches.filter(match => isGroupMatch(match) && groupCodeFromMatch(match) === code).sort((a, b) => Number(a.ThuTuTran) - Number(b.ThuTuTran)),
  }));
  const roundNumbers = Array.from(new Set(matches.filter(match => !match.LaTranTranhHangBa && !isGroupMatch(match)).map(match => match.SoVong))).sort((a, b) => a - b);
  const rounds = roundNumbers.map(number => ({
    key: 'R' + number, roundNumber: number,
    name: matches.find(match => match.SoVong === number && !match.LaTranTranhHangBa && !isGroupMatch(match)).TenVong,
    matches: matches.filter(match => match.SoVong === number && !match.LaTranTranhHangBa && !isGroupMatch(match)).sort((a, b) => Number(a.ThuTuTran) - Number(b.ThuTuTran)),
  }));
  const groupStageCompleted = groupRawMatches.length > 0 && groupRawMatches.every(isCompletedMatch);
  return { tournament: publicTournament(tournament), bracketSize: bracketSize || 0, groups, groupStageCompleted, rounds, thirdPlaceMatch: matches.find(match => match.LaTranTranhHangBa) || null };
}

function isGroupMatch(match) { return String(match.Vong || '').indexOf('VONG_BANG_') === 0; }
function groupCodeFromMatch(match) { return String(match.Vong || '').replace('VONG_BANG_', ''); }
function isCompletedMatch(match) { return ['HOAN_THANH', 'BO_CUOC', 'MIEN_DAU'].indexOf(String(match.TrangThai)) >= 0; }

function calculateGroupStandings(teams, groupMatches) {
  const result = {};
  const groupCodes = Array.from(new Set(teams.map(team => String(team.BangDau || '')).filter(Boolean)));
  groupCodes.forEach(code => {
    const groupTeams = teams.filter(team => String(team.BangDau) === code);
    const matches = groupMatches.filter(match => groupCodeFromMatch(match) === code);
    const rows = Object.fromEntries(groupTeams.map(team => [String(team.MaDoi), {
      ThuHang: 0, MaDoi: team.MaDoi, Doi: team, SoTran: 0, Thang: 0, Thua: 0,
      HiepThang: 0, HiepThua: 0, HieuSoHiep: 0, DiemThang: 0, DiemThua: 0, HieuSoDiem: 0, DaDuDieuKien: false,
    }]));
    matches.filter(isCompletedMatch).forEach(match => {
      const row1 = rows[String(match.MaDoi1)]; const row2 = rows[String(match.MaDoi2)];
      if (!row1 || !row2) return;
      row1.SoTran++; row2.SoTran++;
      if (String(match.MaDoiThang) === String(match.MaDoi1)) { row1.Thang++; row2.Thua++; }
      else if (String(match.MaDoiThang) === String(match.MaDoi2)) { row2.Thang++; row1.Thua++; }
      [match.TySoHiep1, match.TySoHiep2, match.TySoHiep3].filter(Boolean).forEach(score => {
        const pair = String(score).split('-').map(Number);
        row1.DiemThang += pair[0] || 0; row1.DiemThua += pair[1] || 0;
        row2.DiemThang += pair[1] || 0; row2.DiemThua += pair[0] || 0;
        if (pair[0] > pair[1]) { row1.HiepThang++; row2.HiepThua++; }
        else { row2.HiepThang++; row1.HiepThua++; }
      });
    });
    const groupCompleted = matches.length > 0 && matches.every(isCompletedMatch);
    const sorted = Object.values(rows).map(row => {
      row.HieuSoHiep = row.HiepThang - row.HiepThua; row.HieuSoDiem = row.DiemThang - row.DiemThua; return row;
    }).sort((a, b) => {
      if (b.Thang !== a.Thang) return b.Thang - a.Thang;
      if (b.HieuSoHiep !== a.HieuSoHiep) return b.HieuSoHiep - a.HieuSoHiep;
      if (b.HieuSoDiem !== a.HieuSoDiem) return b.HieuSoDiem - a.HieuSoDiem;
      const direct = matches.find(match => isCompletedMatch(match) && [String(match.MaDoi1), String(match.MaDoi2)].indexOf(String(a.MaDoi)) >= 0 && [String(match.MaDoi1), String(match.MaDoi2)].indexOf(String(b.MaDoi)) >= 0);
      if (direct) return String(direct.MaDoiThang) === String(a.MaDoi) ? -1 : 1;
      return String(a.MaDoi).localeCompare(String(b.MaDoi));
    });
    sorted.forEach((row, index) => { row.ThuHang = index + 1; row.DaDuDieuKien = groupCompleted && index < 2; });
    result[code] = sorted;
  });
  return result;
}

function createKnockoutAfterGroups(tournament, teams, groupMatches) {
  const standings = calculateGroupStandings(teams, groupMatches);
  const codes = Object.keys(standings).sort();
  if (!codes.length || !groupMatches.length || !groupMatches.every(isCompletedMatch)) return [];
  const qualified = {};
  codes.forEach(code => { qualified[code + '1'] = standings[code][0] && standings[code][0].Doi; qualified[code + '2'] = standings[code][1] && standings[code][1].Doi; });
  let seedKeys;
  if (codes.length === 4) seedKeys = ['A1', 'B2', 'C1', 'D2', 'B1', 'A2', 'D1', 'C2'];
  else if (codes.length === 2) seedKeys = ['A1', 'B2', 'B1', 'A2'];
  else seedKeys = ['A1', 'A2'];
  const slots = seedKeys.map(key => qualified[key]).filter(Boolean);
  return createBracketMatches(tournament, slots, slots.length);
}

function capNhatKetQuaTranDau(request) {
  return withLock(() => {
    const tournament = requireTournament();
    let matches = rowsForTournament('TranDau', tournament.MaGiai).map(stripInternal);
    const target = matches.find(match => String(match.MaTran) === String(request.MaTran || ''));
    if (!target) throw apiError('Không tìm thấy trận đấu.', 'NOT_FOUND');
    if (String(target.TrangThai) === 'MIEN_DAU') throw apiError('Không thể nhập kết quả cho trận miễn đấu.', 'VALIDATION_ERROR');
    if (!target.MaDoi1 || !target.MaDoi2) throw apiError('Trận đấu chưa xác định đủ hai đội.', 'MATCH_NOT_READY');
    const winner = String(request.MaDoiThang || '');
    if ([String(target.MaDoi1), String(target.MaDoi2)].indexOf(winner) === -1) throw apiError('Đội thắng không thuộc trận đấu này.', 'VALIDATION_ERROR');
    const forfeit = toBoolean(request.BoCuoc);
    const scores = [cleanScore(request.TySoHiep1), cleanScore(request.TySoHiep2), cleanScore(request.TySoHiep3)];
    if (!forfeit) validateScores(scores, target, winner);

    const groupTarget = isGroupMatch(target);
    const knockoutMatches = matches.filter(match => !isGroupMatch(match));
    if (groupTarget && knockoutMatches.length) {
      const completedKnockout = knockoutMatches.filter(match => isCompletedMatch(match) && String(match.TrangThai) !== 'MIEN_DAU');
      if (completedKnockout.length && !toBoolean(request.XoaKetQuaPhuThuoc)) {
        throw apiError('Vòng loại trực tiếp đã có kết quả phụ thuộc. Cần xác nhận xóa bracket và các kết quả phụ thuộc trước khi sửa vòng bảng.', 'DEPENDENT_RESULTS');
      }
      matches = matches.filter(isGroupMatch);
    }

    const winnerChanged = target.MaDoiThang && String(target.MaDoiThang) !== winner;
    if (!groupTarget && winnerChanged) {
      const dependencies = dependentMatches(matches, target);
      const completed = dependencies.filter(match => ['HOAN_THANH', 'BO_CUOC'].indexOf(String(match.TrangThai)) >= 0);
      if (completed.length && !toBoolean(request.XoaKetQuaPhuThuoc)) {
        throw apiError('Vòng sau đã có kết quả phụ thuộc. Cần xác nhận xóa các kết quả phụ thuộc trước khi sửa đội thắng.', 'DEPENDENT_RESULTS');
      }
      dependencies.forEach(clearMatchResult);
    }

    target.MaDoiThang = winner; target.TySoHiep1 = scores[0]; target.TySoHiep2 = scores[1]; target.TySoHiep3 = scores[2];
    target.TrangThai = forfeit ? 'BO_CUOC' : 'HOAN_THANH'; target.GhiChu = cleanText(request.GhiChu, 500);
    if (groupTarget) {
      const teams = rowsForTournament('DoiThiDau', tournament.MaGiai).map(stripInternal);
      const groupMatches = matches.filter(isGroupMatch);
      matches = groupMatches.concat(createKnockoutAfterGroups(tournament, teams, groupMatches));
    } else rebuildAdvancement(matches);
    replaceRows('TranDau', matches);

    const finalMatch = matches.find(match => String(match.Vong) === 'CHUNG_KET');
    const bronze = matches.find(match => String(match.Vong) === 'TRANH_HANG_BA');
    const finalDone = finalMatch && ['HOAN_THANH', 'BO_CUOC'].indexOf(String(finalMatch.TrangThai)) >= 0;
    const bronzeDone = !bronze || ['HOAN_THANH', 'BO_CUOC'].indexOf(String(bronze.TrangThai)) >= 0;
    updateRow('GiaiDau', 'MaGiai', tournament.MaGiai, { TrangThai: finalDone && bronzeDone ? 'DA_KET_THUC' : 'DANG_THI_DAU' });
    appendLog(tournament.MaGiai, request._user.TaiKhoan, 'CAP_NHAT_KET_QUA', target.MaTran + ' - thắng: ' + winner + (forfeit ? ' (bỏ cuộc)' : ''));
    return { success: true, MaTran: target.MaTran, MaDoiThang: winner };
  });
}

function rebuildAdvancement(matches) {
  const normal = matches.filter(match => String(match.Vong) !== 'TRANH_HANG_BA' && !isGroupMatch(match));
  const bronze = matches.find(match => String(match.Vong) === 'TRANH_HANG_BA');
  normal.filter(match => roundNumber(match) > 1).forEach(match => { match.MaDoi1 = ''; match.MaDoi2 = ''; });
  if (bronze) { bronze.MaDoi1 = ''; bronze.MaDoi2 = ''; }
  normal.sort((a, b) => roundNumber(a) - roundNumber(b) || Number(a.ThuTuTran) - Number(b.ThuTuTran)).forEach(match => {
    if (match.MaDoiThang && [String(match.MaDoi1), String(match.MaDoi2)].indexOf(String(match.MaDoiThang)) === -1) clearMatchResult(match);
    if (match.MaDoiThang && ['MIEN_DAU', 'HOAN_THANH', 'BO_CUOC'].indexOf(String(match.TrangThai)) >= 0) {
      propagateWinner(matches, match);
      if (String(match.Vong) === 'BAN_KET' && bronze) {
        const loser = String(match.MaDoiThang) === String(match.MaDoi1) ? match.MaDoi2 : match.MaDoi1;
        if (Number(match.ThuTuTran) === 1) bronze.MaDoi1 = loser; else bronze.MaDoi2 = loser;
      }
    }
  });
  if (bronze && bronze.MaDoiThang && [String(bronze.MaDoi1), String(bronze.MaDoi2)].indexOf(String(bronze.MaDoiThang)) === -1) clearMatchResult(bronze);
}

function propagateWinner(matches, match) {
  if (!match.MaTranTiepTheo || !match.MaDoiThang) return;
  const next = matches.find(item => String(item.MaTran) === String(match.MaTranTiepTheo));
  if (!next) return;
  if (Number(match.ViTriVaoTranTiepTheo) === 1) next.MaDoi1 = match.MaDoiThang; else next.MaDoi2 = match.MaDoiThang;
}

function dependentMatches(matches, target) {
  const result = []; let nextId = target.MaTranTiepTheo;
  while (nextId) { const next = matches.find(match => String(match.MaTran) === String(nextId)); if (!next) break; result.push(next); nextId = next.MaTranTiepTheo; }
  if (String(target.Vong) === 'BAN_KET') { const bronze = matches.find(match => String(match.Vong) === 'TRANH_HANG_BA'); if (bronze && result.indexOf(bronze) === -1) result.push(bronze); }
  return result;
}

function clearMatchResult(match) {
  match.MaDoiThang = ''; match.TySoHiep1 = ''; match.TySoHiep2 = ''; match.TySoHiep3 = '';
  match.TrangThai = 'CHO_THI_DAU'; match.GhiChu = '';
}

function validateScores(scores, match, winner) {
  const completed = scores.filter(Boolean);
  if (completed.length < 2) throw apiError('Cần nhập ít nhất hai hiệp hoặc đánh dấu bỏ cuộc.', 'VALIDATION_ERROR');
  let wins1 = 0; let wins2 = 0;
  completed.forEach(score => { const pair = score.split('-').map(Number); if (pair[0] === pair[1]) throw apiError('Tỷ số một hiệp không thể hòa.', 'VALIDATION_ERROR'); if (pair[0] > pair[1]) wins1++; else wins2++; });
  const scoreWinner = wins1 > wins2 ? String(match.MaDoi1) : String(match.MaDoi2);
  if (Math.max(wins1, wins2) < 2) throw apiError('Đội thắng phải thắng ít nhất hai hiệp.', 'VALIDATION_ERROR');
  if (scoreWinner !== winner) throw apiError('Đội thắng được chọn không khớp với tỷ số.', 'VALIDATION_ERROR');
}

// ---------- GOOGLE SHEETS HELPERS ----------

function readRows(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const width = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  return values.map((row, index) => {
    const object = { _row: index + 2 };
    headers.forEach((header, column) => { if (header) object[header] = serializeCell(row[column]); });
    return object;
  }).filter(object => headers.some(header => header && object[header] !== '' && object[header] !== null));
}

function appendRow(sheetName, object) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map(header => valueForSheet(object[header])));
}

function appendRows(sheetName, objects) {
  if (!objects || !objects.length) return;
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = objects.map(object => headers.map(header => valueForSheet(object[header])));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}

function updateRow(sheetName, idField, idValue, updates) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const rows = readRows(sheetName); const target = rows.find(row => String(row[idField]) === String(idValue));
  if (!target) throw apiError('Không tìm thấy dữ liệu cần cập nhật trong ' + sheetName + '.', 'NOT_FOUND');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const merged = Object.assign({}, target, updates);
  sheet.getRange(target._row, 1, 1, headers.length).setValues([headers.map(header => valueForSheet(merged[header]))]);
  return merged;
}

function deleteRow(sheetName, idField, idValue) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const target = readRows(sheetName).find(row => String(row[idField]) === String(idValue));
  if (!target) throw apiError('Không tìm thấy dữ liệu cần xóa.', 'NOT_FOUND');
  sheet.deleteRow(target._row);
}

function replaceRows(sheetName, objects) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  if (objects.length) sheet.getRange(2, 1, objects.length, headers.length).setValues(objects.map(object => headers.map(header => valueForSheet(object[header]))));
}

function rowsForTournament(sheetName, tournamentId) { return readRows(sheetName).filter(row => String(row.MaGiai) === String(tournamentId)); }
function getTournament() { return readRows('GiaiDau')[0] || null; }
function requireTournament() { const value = getTournament(); if (!value) throw apiError('Chưa có giải đấu. Admin hãy tạo giải trong trang Cài đặt.', 'NO_TOURNAMENT'); return value; }

function appendLog(tournamentId, actor, action, content) {
  appendRow('NhatKy', { MaNhatKy: makeId('LOG'), MaGiai: tournamentId || '', ThoiGian: new Date(), NguoiThucHien: actor || 'SYSTEM', HanhDong: action, NoiDung: content || '' });
}

// ---------- CACHE VÀ TIỆN ÍCH ----------

function cached(key, seconds, loader) {
  const cache = CacheService.getScriptCache();
  const version = PropertiesService.getScriptProperties().getProperty('CACHE_VERSION') || '1';
  const cacheKey = 'v' + version + ':' + key;
  const hit = cache.get(cacheKey);
  if (hit) return JSON.parse(hit);
  const value = loader();
  const serialized = JSON.stringify(value);
  if (serialized.length < 95000) cache.put(cacheKey, serialized, seconds);
  return value;
}

function bumpCacheVersion() { PropertiesService.getScriptProperties().setProperty('CACHE_VERSION', String(Date.now())); }
function withLock(work) { const lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) throw apiError('Hệ thống đang xử lý một thao tác khác. Vui lòng thử lại.', 'LOCK_TIMEOUT'); try { return work(); } finally { lock.releaseLock(); } }
function getRequiredProperty(name) { const value = PropertiesService.getScriptProperties().getProperty(name); if (!value) throw apiError('Thiếu Script Property ' + name + '.', 'CONFIG_ERROR'); return value; }
function apiError(message, code) { const error = new Error(message); error.code = code || 'BAD_REQUEST'; return error; }
function jsonOutput(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function makeId(prefix) { return prefix + '-' + Utilities.getUuid().split('-')[0].toUpperCase(); }
function stripInternal(object) { const copy = {}; Object.keys(object).forEach(key => { if (key !== '_row') copy[key] = object[key]; }); return copy; }
function pick(object, keys) { const result = {}; keys.forEach(key => { result[key] = object[key] === undefined ? '' : object[key]; }); return result; }
function cleanText(value, maxLength) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength || 500); }
function normalizePhone(value) { let phone = String(value || '').replace(/[^\d+]/g, ''); if (phone.indexOf('+84') === 0) phone = '0' + phone.slice(3); if (phone.indexOf('84') === 0 && phone.length === 11) phone = '0' + phone.slice(2); return phone; }
function parseDateRequired(value, label) { const date = new Date(value); if (isNaN(date.getTime())) throw apiError(label + ' không hợp lệ.', 'VALIDATION_ERROR'); return date; }
function toBoolean(value) { return value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1' || String(value).toUpperCase() === 'CO'; }
function serializeCell(value) { return value instanceof Date ? value.toISOString() : value; }
function valueForSheet(value) { if (value === undefined || value === null) return ''; if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)) { const date = new Date(value); if (!isNaN(date.getTime())) return date; } return value; }
function bytesToHex(bytes) { return bytes.map(byte => ('0' + ((byte < 0 ? byte + 256 : byte).toString(16))).slice(-2)).join(''); }
function constantTimeEqual(a, b) { a = String(a); b = String(b); let mismatch = a.length ^ b.length; const length = Math.max(a.length, b.length); for (let i = 0; i < length; i++) mismatch |= (a.charCodeAt(i % (a.length || 1)) || 0) ^ (b.charCodeAt(i % (b.length || 1)) || 0); return mismatch === 0; }
function padBase64(value) { while (value.length % 4) value += '='; return value; }
function fisherYates(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const temp = array[i]; array[i] = array[j]; array[j] = temp; } return array; }
function nextPowerOfTwo(value) { let result = 1; while (result < value) result *= 2; return Math.max(2, result); }
function matchId(round, order) { return 'T-R' + round + '-' + String(order).padStart(2, '0'); }
function roundNumber(match) { if (String(match.Vong) === 'TRANH_HANG_BA') return 999; const found = String(match.MaTran || '').match(/^T-R(\d+)-/); return found ? Number(found[1]) : 0; }
function roundCode(bracketSize, round) { const teamsInRound = bracketSize / Math.pow(2, round - 1); if (teamsInRound === 2) return 'CHUNG_KET'; if (teamsInRound === 4) return 'BAN_KET'; if (teamsInRound === 8) return 'TU_KET'; return 'VONG_' + teamsInRound; }
function roundDisplayName(match, bracketSize) { if (String(match.Vong) === 'TRANH_HANG_BA') return 'Tranh hạng ba'; const teams = bracketSize / Math.pow(2, roundNumber(match) - 1); if (teams === 2) return 'Chung kết'; if (teams === 4) return 'Bán kết'; if (teams === 8) return 'Tứ kết'; return 'Vòng ' + teams + ' đội'; }
function cleanScore(value) { const text = String(value || '').trim().replace(/[–:]/g, '-'); if (!text) return ''; if (!/^\d{1,2}-\d{1,2}$/.test(text)) throw apiError('Tỷ số hiệp không hợp lệ.', 'VALIDATION_ERROR'); return text; }
function enrichTeams(teams, tournamentId) { const players = rowsForTournament('NguoiChoi', tournamentId); const map = Object.fromEntries(players.map(player => [String(player.MaNguoiChoi), pick(player, ['MaNguoiChoi', 'HoTen', 'TrinhDo'])])); return teams.map(team => Object.assign({}, stripInternal(team), { ThanhVien1: map[String(team.MaNguoiChoi1)] || null, ThanhVien2: map[String(team.MaNguoiChoi2)] || null })); }

/**
 * TEST ONLY — tạo đúng 31 người chơi mẫu sau khi Admin chủ động bấm Run trong Apps Script.
 * Không được gọi bởi API hoặc giao diện production. Mỗi dòng được gắn [TEST-31] để xóa an toàn.
 */
function tao31NguoiChoiMauSauKhiXacNhan() {
  return withLock(() => {
    ensureDatabaseSheetsOnly();
    const tournament = requireTournament();
    if (rowsForTournament('DoiThiDau', tournament.MaGiai).length) throw new Error('Hãy hủy kết quả bốc thăm trước khi tạo dữ liệu test.');
    const existing = rowsForTournament('NguoiChoi', tournament.MaGiai);
    if (existing.length) throw new Error('Giải đã có ' + existing.length + ' người chơi. Để tránh lẫn dữ liệu thật, seed test chỉ chạy khi danh sách đang trống.');

    const names = [
      'Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Hoàng Nam', 'Phạm Thu Hà', 'Vũ Đức Long',
      'Đặng Ngọc Mai', 'Bùi Gia Huy', 'Đỗ Khánh Linh', 'Hoàng Anh Tuấn', 'Ngô Thảo Vy',
      'Dương Thành Đạt', 'Lý Bích Ngọc', 'Mai Quang Huy', 'Tạ Phương Anh', 'Chu Nhật Minh',
      'Hồ Thanh Tâm', 'Cao Mỹ Duyên', 'La Đức Anh', 'Quách Thu Trang', 'Kiều Minh Quân',
      'Tôn Hải Yến', 'Hà Quốc Khánh', 'Lâm Ngọc Anh', 'Vi Trọng Nghĩa', 'Châu Bảo Trâm',
      'Thái Gia Bảo', 'Ninh Khánh Vy', 'Triệu Hoài Nam', 'Sơn Phương Thảo', 'Lưu Minh Đức',
      'Trịnh Ngọc Hân',
    ];
    const levels = ['Mới chơi', 'Trung bình', 'Khá', 'Nâng cao'];
    const now = new Date();
    const players = names.map((name, index) => ({
      MaNguoiChoi: 'TEST-' + String(index + 1).padStart(2, '0'), MaGiai: tournament.MaGiai,
      HoTen: name, SoDienThoai: '090000' + String(index + 1).padStart(4, '0'),
      GioiTinh: index % 2 ? 'Nữ' : 'Nam', TrinhDo: levels[index % levels.length],
      CauLacBo: 'CLB Test', GhiChu: '[TEST-31] Dữ liệu mẫu, có thể xóa bằng hàm xoaNguoiChoiMauSauKhiXacNhan.',
      TrangThai: 'DA_XAC_NHAN', ThoiGianDangKy: now, DaChuyenKhoan: true,
    }));
    appendRows('NguoiChoi', players);
    appendLog(tournament.MaGiai, 'SYSTEM', 'TAO_31_NGUOI_CHOI_TEST', 'Tạo 31 người mẫu đã xác nhận.');
    bumpCacheVersion(); SpreadsheetApp.flush();
    return { success: true, created: players.length };
  });
}

/** TEST ONLY — chỉ xóa dòng được gắn [TEST-31], không xóa người chơi thật. */
function xoaNguoiChoiMauSauKhiXacNhan() {
  return withLock(() => {
    ensureDatabaseSheetsOnly();
    const tournament = requireTournament();
    if (rowsForTournament('DoiThiDau', tournament.MaGiai).length) throw new Error('Hãy hủy kết quả bốc thăm trước khi xóa dữ liệu test.');
    const players = rowsForTournament('NguoiChoi', tournament.MaGiai);
    const samples = players.filter(player => String(player.GhiChu).indexOf('[TEST-31]') === 0);
    if (!samples.length) throw new Error('Không tìm thấy dữ liệu mẫu [TEST-31] để xóa.');
    replaceRows('NguoiChoi', readRows('NguoiChoi').filter(player => String(player.GhiChu).indexOf('[TEST-31]') !== 0).map(stripInternal));
    appendLog(tournament.MaGiai, 'SYSTEM', 'XOA_31_NGUOI_CHOI_TEST', 'Xóa ' + samples.length + ' người mẫu [TEST-31].');
    bumpCacheVersion(); SpreadsheetApp.flush();
    return { success: true, deleted: samples.length };
  });
}
