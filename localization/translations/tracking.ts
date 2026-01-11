export const tracking = {
  en: {
    loading: 'Loading your dashboard...',
    selectBaby: 'Select baby',
    guestMode: {
      title: 'Start Tracking Your Baby',
      description:
        'Create an account to track feeding, sleep, diapers, and more. Your data syncs across all your devices.',
      createAccount: 'Create Account',
      signIn: 'Sign In',
    },
    noProfile: {
      title: 'Create Baby Profile',
      description: "Set up your baby's profile to start tracking feeding, sleep, and more.",
      createProfile: 'Create Profile',
    },
    tiles: {
      feeding: { label: 'Feeding', sublabel: "See today's feeds & totals" },
      pumping: { label: 'Pumping', sublabel: "See today's output & sides" },
      diaper: { label: 'Diaper', sublabel: "See today's wet/dirty counts" },
      sleep: { label: 'Sleep', sublabel: "See today's sleep totals" },
      easySchedule: { label: 'E.A.S.Y.', sublabel: 'Baby routine' },
      habit: { label: 'Habits', sublabel: 'Daily routines' },
      playtime: { label: 'Playtime', sublabel: 'Tap to log' },
      health: { label: 'Health', sublabel: 'Log meds, symptoms, temps' },
      growth: { label: 'Growth', sublabel: 'Log weight, height, head', add: 'Add' },
      diary: { label: 'Diary', sublabel: 'Save notes & photos' },
    },
  },
  vi: {
    loading: 'Đang tải bảng điều khiển của bạn...',
    selectBaby: 'Chọn bé',
    guestMode: {
      title: 'Bắt đầu theo dõi bé',
      description:
        'Tạo tài khoản để theo dõi bú, ngủ, tã và nhiều hơn nữa. Dữ liệu đồng bộ trên tất cả thiết bị.',
      createAccount: 'Tạo tài khoản',
      signIn: 'Đăng nhập',
    },
    noProfile: {
      title: 'Tạo hồ sơ bé',
      description: 'Thiết lập hồ sơ bé để bắt đầu theo dõi bú, ngủ và nhiều hơn nữa.',
      createProfile: 'Tạo hồ sơ',
    },
    tiles: {
      feeding: { label: 'Cho ăn', sublabel: 'Xem bữa ăn & tổng hôm nay' },
      pumping: { label: 'Hút sữa', sublabel: 'Xem lượng hút & bên hôm nay' },
      diaper: { label: 'Tã', sublabel: 'Xem số tã ướt/bẩn hôm nay' },
      sleep: { label: 'Ngủ', sublabel: 'Xem tổng giờ ngủ hôm nay' },
      easySchedule: { label: 'Lịch E.A.S.Y.', sublabel: 'Lịch sinh hoạt bé' },
      habit: { label: 'Thói quen', sublabel: 'Nếp sinh hoạt hằng ngày' },
      playtime: { label: 'Chơi', sublabel: 'Chạm để ghi lại' },
      health: { label: 'Sức khỏe', sublabel: 'Ghi thuốc, triệu chứng, nhiệt' },
      growth: { label: 'Phát triển', sublabel: 'Ghi cân nặng, chiều cao, vòng đầu', add: 'Thêm' },
      diary: { label: 'Nhật ký', sublabel: 'Lưu ghi chú & ảnh' },
    },
  },
} as const;
