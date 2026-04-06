const { request } = require('../../utils/auth');

Page({
  data: {
    studentCount: 0,
    messageCount: 0,
    photoCount: 0,
    recentMessages: []
  },

  onLoad() {
    this.checkBind();
  },

  onShow() {
    if (getApp().globalData.isBind) {
      this.loadData();
    }
  },

  checkBind() {
    const app = getApp();
    if (!app.globalData.isBind) {
      wx.navigateTo({ url: '/pages/bind/bind' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [txlRes, msgRes, photoRes] = await Promise.all([
        request('/txl'),
        request('/messages'),
        request('/photos')
      ]);

      this.setData({
        studentCount: txlRes.students ? txlRes.students.length : 0,
        messageCount: msgRes.messages ? msgRes.messages.length : 0,
        photoCount: photoRes.photos ? photoRes.photos.length : 0,
        recentMessages: msgRes.messages ? msgRes.messages.slice(0, 5) : []
      });
    } catch (e) {
      console.error('loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goToTXL() {
    wx.switchTab({ url: '/pages/txl/txl' });
  },

  goToLYB() {
    wx.switchTab({ url: '/pages/lyb/lyb' });
  },

  goToGallery() {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goToVideo() {
    wx.navigateTo({ url: '/pages/video/video' });
  }
});
