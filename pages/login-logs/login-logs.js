const { request } = require('../../utils/auth');

Page({
  data: {
    logs: [],
    loading: true,
    darkMode: false,
    musicPlaying: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      darkMode: app.globalData.darkMode,
      musicPlaying: app.globalData.musicPlaying
    });
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
  },

  toggleDarkMode() {
    const app = getApp();
    const newDarkMode = !app.globalData.darkMode;
    app.globalData.darkMode = newDarkMode;
    this.setData({ darkMode: newDarkMode });
    this.onDarkModeChange(newDarkMode);
  },

  toggleMusic() {
    const app = getApp();
    const newMusicPlaying = !app.globalData.musicPlaying;
    app.globalData.musicPlaying = newMusicPlaying;
    this.setData({ musicPlaying: newMusicPlaying });
    if (app.globalData.audioContext) {
      if (newMusicPlaying) {
        app.globalData.audioContext.play();
      } else {
        app.globalData.audioContext.pause();
      }
    }
  },

  onDarkModeChange(darkMode) {
    if (darkMode) {
      wx.setBackgroundColor({ backgroundColor: '#1a1a2e' });
      wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#1a1a2e' });
    } else {
      wx.setBackgroundColor({ backgroundColor: '#f5f5f5' });
      wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#f5f5f5' });
    }
  }
});