export const settings = {
  en: {
    title: 'Baby Profiles',
    description: "Manage your children's profiles",
    edit: 'Edit',
    tabs: {
      baby: 'Baby',
      features: 'Features',
      appearance: 'Appearance',
      system: 'System',
    },
    featuresTitle: 'Feature Visibility',
    featuresSubtitle: 'Toggle features to show/hide them',
    themeTitle: 'Appearance',
    themeSubtitle: 'Choose your app theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageTitle: 'Language',
    languageSubtitle: 'Choose the app language',
    english: 'English',
    vietnamese: 'Tiếng Việt',
  },
  vi: {
    title: 'Hồ sơ em bé',
    description: 'Quản lý hồ sơ các bé của bạn',
    edit: 'Chỉnh sửa',
    tabs: {
      baby: 'Em bé',
      features: 'Tính năng',
      appearance: 'Giao diện',
      system: 'Hệ thống',
    },
    featuresTitle: 'Hiển thị tính năng',
    featuresSubtitle: 'Bật/tắt các tính năng',
    themeTitle: 'Giao diện',
    themeSubtitle: 'Chọn chủ đề ứng dụng',
    themeSystem: 'Hệ thống',
    themeLight: 'Sáng',
    themeDark: 'Tối',
    languageTitle: 'Ngôn ngữ',
    languageSubtitle: 'Chọn ngôn ngữ ứng dụng',
    english: 'English',
    vietnamese: 'Tiếng Việt',
  },
} satisfies Record<
  'en' | 'vi',
  {
    title: string;
    description: string;
    edit: string;
    tabs: {
      baby: string;
      features: string;
      appearance: string;
      system: string;
    };
    featuresTitle: string;
    featuresSubtitle: string;
    themeTitle: string;
    themeSubtitle: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
    languageTitle: string;
    languageSubtitle: string;
    english: string;
    vietnamese: string;
  }
>;
