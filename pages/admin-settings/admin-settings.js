const { request } = require('../../utils/auth');

Page({
  data: {
    students: [],
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
    this.loadStudents();
  },

  async loadStudents() {
    try {
      this.setData({ loading: true });
      const res = await request('/admin/students');
      if (res.success) {
        this.setData({
          students: res.students || [],
          loading: false
        });
      }
    } catch (e) {
      console.error('loadStudents error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onToggleAdmin(e) {
    const { id } = e.currentTarget.dataset;
    const { students } = this.data;
    const student = students.find(s => s.id === id);
    if (!student) return;

    const newIsAdmin = !student.is_admin;

    wx.showModal({
      title: '提示',
      content: `确定${newIsAdmin ? '授予' : '撤销'}"${student.name}"的管理员权限？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/admin/students/${id}`, { is_admin: newIsAdmin }, 'PUT');
            wx.showToast({ title: '设置成功' });
            this.loadStudents();
          } catch (e) {
            wx.showToast({ title: '设置失败', icon: 'none' });
          }
        }
      }
    });
  },

  async onToggleSuperAdmin(e) {
    const { id } = e.currentTarget.dataset;
    const { students } = this.data;
    const student = students.find(s => s.id === id);
    if (!student) return;

    const newIsSuperAdmin = !student.is_super_admin;

    wx.showModal({
      title: '提示',
      content: `确定${newIsSuperAdmin ? '授予' : '撤销'}"${student.name}"的超管权限？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/admin/students/${id}`, { is_super_admin: newIsSuperAdmin }, 'PUT');
            wx.showToast({ title: '设置成功' });
            this.loadStudents();
          } catch (e) {
            wx.showToast({ title: '设置失败', icon: 'none' });
          }
        }
      }
    });
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