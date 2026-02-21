import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#6366f1', // Indigo
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f3f4f6', // Light gray background
  },
  components: {
    Layout: {
      siderBg: '#1e1b4b', // Dark indigo
      triggerBg: '#312e81',
    },
    Menu: {
      darkItemBg: '#1e1b4b',
      darkItemSelectedBg: '#4338ca',
      darkItemColor: '#c7d2fe',
      darkItemSelectedColor: '#ffffff',
    },
  },
};
