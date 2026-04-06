const { request } = require('../../utils/auth');

Page({
  data: {
    loading: true,
    notifications: []
  },

  onLoad() {
    this.loadNotifications();
  },

  async loadNotifications() {
    this.setData({ loading: true });
    try {
      const res = await request('/notifications');
      this.setData({
        notifications: res.notifications || [],
        loading: false
      });
    } catch (e) {
      console.error('loadNotifications error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async markAllRead() {
    try {
      await request('/notifications/mark_read', {}, 'POST');
      wx.showToast({ title: '已全部标记为已读' });
      this.loadNotifications();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  }
});
