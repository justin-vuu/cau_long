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

test('14 đội chia đúng 4 bảng 4-4-3-3 và tạo 18 trận vòng tròn', () => {
  const result = evaluate(`(() => {
    const build = count => {
      const teams = Array.from({length:count}, (_, i) => ({MaDoi:'D'+(i+1), MaGiai:'G1'}));
      const groups = determineGroupCount(count);
      teams.forEach((team, index) => team.BangDau = String.fromCharCode(65 + index % groups));
      return {groups, matches:createGroupStageMatches({MaGiai:'G1'}, teams, groups).length};
    };
    const teams = Array.from({length:14}, (_, i) => ({MaDoi:'D'+(i+1), MaGiai:'G1'}));
    const groups = determineGroupCount(teams.length);
    teams.forEach((team, index) => team.BangDau = String.fromCharCode(65 + index % groups));
    const sizes = ['A','B','C','D'].map(code => teams.filter(team => team.BangDau === code).length);
    return {groups, sizes, matches:createGroupStageMatches({MaGiai:'G1'}, teams, groups).length};
  })()`);
  assert.equal(JSON.stringify(result), JSON.stringify({ groups: 4, sizes: [4, 4, 3, 3], matches: 18 }));
});

test('xếp hạng vòng bảng theo điểm thắng rồi hiệu số hiệp và hiệu số điểm', () => {
  const result = evaluate(`(() => {
    const teams = ['A','B','C'].map(id => ({MaDoi:id, BangDau:'A', TenHienThi:'Đội '+id}));
    const matches = [
      {Vong:'VONG_BANG_A', MaDoi1:'A', MaDoi2:'B', MaDoiThang:'A', TySoHiep1:'21-10', TySoHiep2:'21-10', TySoHiep3:'', TrangThai:'HOAN_THANH'},
      {Vong:'VONG_BANG_A', MaDoi1:'B', MaDoi2:'C', MaDoiThang:'B', TySoHiep1:'21-19', TySoHiep2:'21-19', TySoHiep3:'', TrangThai:'HOAN_THANH'},
      {Vong:'VONG_BANG_A', MaDoi1:'C', MaDoi2:'A', MaDoiThang:'C', TySoHiep1:'21-19', TySoHiep2:'21-19', TySoHiep3:'', TrangThai:'HOAN_THANH'},
    ];
    return calculateGroupStandings(teams, matches).A.map(row => ({id:row.MaDoi, diem:row.DiemXepHang, hsHiep:row.HieuSoHiep, hsDiem:row.HieuSoDiem}));
  })()`);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [
    { id: 'A', diem: 1, hsHiep: 0, hsDiem: 18 },
    { id: 'C', diem: 1, hsHiep: 0, hsDiem: 0 },
    { id: 'B', diem: 1, hsHiep: 0, hsDiem: -18 },
  ]);
});

test('28 người -> 14 đội -> 4 bảng 4-4-3-3 -> top 8 -> tứ kết đi tiếp', () => {
  const result = evaluate(`(() => {
    const memory = {
      tournament: {MaGiai:'G1', TenGiai:'Giải test', TrangThai:'DA_KHOA_DANG_KY', SoNguoiToiThieu:28, CoTranhHangBa:false},
      NguoiChoi: Array.from({length:28}, (_, i) => ({MaNguoiChoi:'NC'+(i+1), MaGiai:'G1', HoTen:'Người '+(i+1), TrinhDo:'Chưa phân loại', TrangThai:'DA_XAC_NHAN', DaChuyenKhoan:true})),
      DoiThiDau: [], TranDau: []
    };
    getTournament = () => memory.tournament;
    rowsForTournament = name => memory[name] || [];
    replaceRows = (name, rows) => { memory[name] = rows.map(row => Object.assign({}, row)); };
    updateRow = (name, idField, id, updates) => { if (name === 'GiaiDau') Object.assign(memory.tournament, updates); return memory.tournament; };
    appendLog = () => {};
    withLock = work => work();
    const draw = bocThamGiaiDau({_user:{TaiKhoan:'admin',HoTen:'Admin Test'}});
    const groupIds = memory.TranDau.filter(isGroupMatch).map(match => match.MaTran);
    groupIds.forEach(id => {
      const match = memory.TranDau.find(item => item.MaTran === id);
      capNhatKetQuaTranDau({
        _user:{TaiKhoan:'admin'}, MaTran:id, MaDoiThang:match.MaDoi1,
        TySoHiep1:'21-18', TySoHiep2:'21-17', TySoHiep3:'', GhiChu:'', BoCuoc:false
      });
    });
    const first = memory.TranDau.find(match => !isGroupMatch(match) && roundNumber(match) === 1);
    const winner = first.MaDoi1;
    capNhatKetQuaTranDau({
      _user:{TaiKhoan:'admin'}, MaTran:first.MaTran, MaDoiThang:winner,
      TySoHiep1:'21-18', TySoHiep2:'18-21', TySoHiep3:'21-17', GhiChu:'', BoCuoc:false
    });
    const saved = memory.TranDau.find(match => match.MaTran === first.MaTran);
    const next = memory.TranDau.find(match => match.MaTran === saved.MaTranTiepTheo);
    const nextWinnerSlot = Number(saved.ViTriVaoTranTiepTheo) === 1 ? next.MaDoi1 : next.MaDoi2;
    return {draw, teams:memory.DoiThiDau.length, groupMatches:memory.TranDau.filter(isGroupMatch).length, knockoutMatches:memory.TranDau.filter(m => !isGroupMatch(m)).length, savedStatus:saved.TrangThai, nextWinnerSlot, winner, tournamentStatus:memory.tournament.TrangThai};
  })()`);
  assert.equal(result.draw.teamsCreated, 14);
  assert.equal(result.draw.groupCount, 4);
  assert.equal(result.teams, 14);
  assert.equal(result.groupMatches, 18);
  assert.equal(result.knockoutMatches, 7);
  assert.equal(result.savedStatus, 'HOAN_THANH');
  assert.equal(result.nextWinnerSlot, result.winner);
  assert.equal(result.tournamentStatus, 'DANG_THI_DAU');
});

test('seed test tạo đúng 31 người và tất cả đều có nhãn an toàn', () => {
  assert.match(source, /function appendRows\(/);
  const result = evaluate(`(() => {
    const memory = {players: []};
    ensureDatabaseSheetsOnly = () => {};
    getTournament = () => ({MaGiai:'G1'});
    rowsForTournament = name => name === 'NguoiChoi' ? memory.players : [];
    appendRows = (name, rows) => { if (name === 'NguoiChoi') memory.players.push(...rows); };
    appendLog = () => {};
    bumpCacheVersion = () => {};
    SpreadsheetApp = {flush: () => {}};
    withLock = work => work();
    const output = tao31NguoiChoiMauSauKhiXacNhan();
    return {
      output,
      count: memory.players.length,
      confirmed: memory.players.filter(p => p.TrangThai === 'DA_XAC_NHAN').length,
      tagged: memory.players.filter(p => String(p.GhiChu).startsWith('[TEST-31]')).length,
      paid: memory.players.filter(p => p.DaChuyenKhoan === true).length,
    };
  })()`);
  assert.equal(result.output.created, 31);
  assert.equal(result.count, 31);
  assert.equal(result.confirmed, 31);
  assert.equal(result.tagged, 31);
  assert.equal(result.paid, 31);
});
