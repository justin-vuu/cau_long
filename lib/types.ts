export type TournamentStatus = 'DANG_DANG_KY' | 'DA_KHOA_DANG_KY' | 'DA_BOC_THAM' | 'DANG_THI_DAU' | 'DA_KET_THUC';
export type PlayerStatus = 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'TU_CHOI';

export interface Tournament {
  MaGiai: string;
  TenGiai: string;
  DiaDiem: string;
  NgayBatDau: string;
  HanDangKy: string;
  TrangThai: TournamentStatus;
  SoNguoiToiThieu: number;
  CoTranhHangBa: boolean;
  ThoiGianBocTham?: string;
  NguoiBocTham?: string;
  SoNguoiDangKy?: number;
  SoNguoiXacNhan?: number;
}

export interface Player {
  MaNguoiChoi: string;
  MaGiai: string;
  HoTen: string;
  SoDienThoai?: string;
  GioiTinh: string;
  TrinhDo: string;
  CauLacBo: string;
  GhiChu?: string;
  TrangThai: PlayerStatus;
  ThoiGianDangKy: string;
  DaChuyenKhoan?: boolean;
}

export interface TeamMember {
  MaNguoiChoi: string;
  HoTen: string;
  TrinhDo: string;
}

export interface Team {
  MaDoi: string;
  MaGiai: string;
  MaNguoiChoi1: string;
  MaNguoiChoi2: string;
  ViTriBracket: number;
  TenHienThi: string;
  TrangThai: string;
  BangDau?: string;
  ThanhVien1?: TeamMember;
  ThanhVien2?: TeamMember;
}

export interface GroupStanding {
  ThuHang: number;
  MaDoi: string;
  Doi: Team;
  SoTran: number;
  Thang: number;
  Thua: number;
  DiemXepHang: number;
  HiepThang: number;
  HiepThua: number;
  HieuSoHiep: number;
  DiemThang: number;
  DiemThua: number;
  HieuSoDiem: number;
  DaDuDieuKien: boolean;
}

export interface TournamentGroup {
  MaBang: string;
  TenBang: string;
  standings: GroupStanding[];
  matches: Match[];
}

export interface Match {
  MaTran: string;
  MaGiai: string;
  Vong: string;
  TenVong: string;
  SoVong: number;
  ThuTuTran: number;
  MaDoi1: string;
  MaDoi2: string;
  Doi1?: Team | null;
  Doi2?: Team | null;
  MaDoiThang: string;
  TySoHiep1: string;
  TySoHiep2: string;
  TySoHiep3: string;
  TrangThai: string;
  MaTranTiepTheo: string;
  ViTriVaoTranTiepTheo: number;
  GhiChu: string;
  LaTranTranhHangBa?: boolean;
}

export interface BracketRound { key: string; name: string; roundNumber: number; matches: Match[] }
export interface BracketData { tournament: Tournament; bracketSize: number; groups: TournamentGroup[]; rounds: BracketRound[]; thirdPlaceMatch?: Match | null; groupStageCompleted?: boolean }

export interface DashboardData {
  tournament: Tournament;
  tongNguoiDangKy: number;
  soNguoiXacNhan: number;
  soDoi: number;
  soTranHoanThanh: number;
  tongSoTran: number;
}

export interface AdminUser { MaNguoiDung: string; TaiKhoan: string; HoTen: string; VaiTro: string }

export interface ApiResponse<T> { ok: boolean; data?: T; error?: string; code?: string }
