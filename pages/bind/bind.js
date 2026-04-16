const app = getApp();
const { login, bind } = require('../../utils/auth');

Page({
  data: {
    openid: '',
    name: '',
    studentId: '',
    loading: false,
    darkMode: false,
    musicPlaying: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      darkMode: app.globalData.darkMode,
      musicPlaying: app.globalData.musicPlaying
    });
    this.doLogin();
  },

  async doLogin() {
    try {
      const result = await login();
      if (!result.needBind) {
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        this.setData({ openid: result.openid });
      }
    } catch (e) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onStudentIdInput(e) {
    this.setData({ studentId: e.detail.value });
  },

  async onBind() {
    const { openid, name, studentId } = this.data;

    if (!name || !studentId) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      await bind(openid, name, studentId);
      wx.showToast({ title: '绑定成功' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (e) {
      wx.showToast({ title: e.message || '绑定失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
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
