import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const context = vm.createContext({ console, Math, Date, JSON, Set, Array, Object, String, Number, Boolean, Error, RegExp });
vm.runInContext(source, context);

function evaluate(expression) { return vm.runInContext(expression, context); }

test('18 đội tạo bracket 32 và đúng 14 suất BYE, không có cặp BYE-BYE', () => {
  const result = evaluate(`(() => {
    const teams = Array.from({length: 18}, (_, i) => ({MaDoi: 'D' + (i + 1), MaGiai: 'G1'}));
    const slots = distributeTeamsWithByes(teams, 32);
    const matches = createBracketMatches({MaGiai: 'G1', CoTranhHangBa: false}, slots, 32);
    return {
      teamSlots: slots.filter(Boolean).length,
      totalMatches: matches.length,
      byes: matches.filter(m => m.TrangThai === 'MIEN_DAU').length,
      emptyFirstRound: matches.filter(m => roundNumber(m) === 1 && !m.MaDoi1 && !m.MaDoi2).length
    };
  })()`);
  assert.equal(result.teamSlots, 18);
  assert.equal(result.totalMatches, 31);
  assert.equal(result.byes, 14);
  assert.equal(result.emptyFirstRound, 0);
});

test('32 người thành 16 đội, đội thắng tự xuất hiện ở vòng tiếp theo', () => {
  const result = evaluate(`(() => {
    const teams = Array.from({length: 16}, (_, i) => ({MaDoi: 'D' + (i + 1), MaGiai: 'G1'}));
    const slots = distributeTeamsWithByes(teams, 16);
    const matches = createBracketMatches({MaGiai: 'G1', CoTranhHangBa: true}, slots, 16);
    const first = matches.find(m => roundNumber(m) === 1);
    first.MaDoiThang = first.MaDoi1;
    first.TySoHiep1 = '21-18'; first.TySoHiep2 = '18-21'; first.TySoHiep3 = '21-17'; first.TrangThai = 'HOAN_THANH';
    rebuildAdvancement(matches);
    const next = matches.find(m => m.MaTran === first.MaTranTiepTheo);
    return { normalMatches: matches.filter(m => m.Vong !== 'TRANH_HANG_BA').length, hasBronze: matches.some(m => m.Vong === 'TRANH_HANG_BA'), winner: first.MaDoiThang, nextSlot: Number(first.ViTriVaoTranTiepTheo) === 1 ? next.MaDoi1 : next.MaDoi2 };
  })()`);
  assert.equal(result.normalMatches, 15);
  assert.equal(result.hasBronze, true);
  assert.equal(result.nextSlot, result.winner);
});

test('kiểm tra tỷ số từ chối đội thắng không khớp', () => {
  assert.throws(() => evaluate(`validateScores(['21-18','18-21','21-17'], {MaDoi1:'A', MaDoi2:'B'}, 'B')`), /không khớp/);
});

test('luồng nghiệp vụ 32 đăng ký -> bốc thăm -> lưu tỷ số -> đi tiếp', () => {
  const result = evaluate(`(() => {
    const memory = {
      tournament: {MaGiai:'G1', TenGiai:'Giải test', TrangThai:'DA_KHOA_DANG_KY', SoNguoiToiThieu:32, CoTranhHangBa:false},
      NguoiChoi: Array.from({length:32}, (_, i) => ({MaNguoiChoi:'NC'+(i+1), MaGiai:'G1', HoTen:'Người '+(i+1), TrinhDo:'Chưa phân loại', TrangThai:'DA_XAC_NHAN', DaChuyenKhoan:true})),
      DoiThiDau: [], TranDau: []
    };
    getTournament = () => memory.tournament;
    rowsForTournament = name => memory[name] || [];
    replaceRows = (name, rows) => { memory[name] = rows.map(row => Object.assign({}, row)); };
    updateRow = (name, idField, id, updates) => { if (name === 'GiaiDau') Object.assign(memory.tournament, updates); return memory.tournament; };
    appendLog = () => {};
    withLock = work => work();
    const draw = bocThamGiaiDau({_user:{TaiKhoan:'admin',HoTen:'Admin Test'}});
    const first = memory.TranDau.find(match => roundNumber(match) === 1);
    const winner = first.MaDoi1;
    capNhatKetQuaTranDau({
      _user:{TaiKhoan:'admin'}, MaTran:first.MaTran, MaDoiThang:winner,
      TySoHiep1:'21-18', TySoHiep2:'18-21', TySoHiep3:'21-17', GhiChu:'', BoCuoc:false
    });
    const saved = memory.TranDau.find(match => match.MaTran === first.MaTran);
    const next = memory.TranDau.find(match => match.MaTran === saved.MaTranTiepTheo);
    const nextWinnerSlot = Number(saved.ViTriVaoTranTiepTheo) === 1 ? next.MaDoi1 : next.MaDoi2;
    return {draw, teams:memory.DoiThiDau.length, matches:memory.TranDau.length, savedStatus:saved.TrangThai, nextWinnerSlot, winner, tournamentStatus:memory.tournament.TrangThai};
  })()`);
  assert.equal(result.draw.teamsCreated, 16);
  assert.equal(result.teams, 16);
  assert.equal(result.matches, 15);
  assert.equal(result.savedStatus, 'HOAN_THANH');
  assert.equal(result.nextWinnerSlot, result.winner);
  assert.equal(result.tournamentStatus, 'DANG_THI_DAU');
});
