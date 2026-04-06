const { request } = require('../../utils/auth');

Page({
  data: {
    logs: [],
    loading: true
  },

  onLoad() {
    this.loadLogs();
  },

  async loadLogs() {
    try {
      this.setData({ loading: true });
      const res = await request('/admin/login-logs');
      if (res.success) {
        this.setData({
          logs: res.logs || [],
          loading: false
        });
      }
    } catch (e) {
      console.error('loadLogs error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    // login_time已经是 'YYYY-MM-DD HH:MM:SS' 格式
    return timeStr;
  }
});