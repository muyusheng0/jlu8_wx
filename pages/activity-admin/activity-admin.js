const { request } = require('../../utils/auth');

Page({
  data: {
    activities: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadActivities();
  },

  onShow() {
    this.loadActivities();
  },

  async loadActivities() {
    try {
      this.setData({ loading: true });
      const res = await request('/activities');
      if (res.success) {
        this.setData({
          activities: res.activities || [],
          loading: false,
          hasMore: false
        });
      }
    } catch (e) {
      console.error('loadActivities error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onDelete(e) {
    const { time, actor } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定删除这条动态？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/activities/${encodeURIComponent(time)}/${encodeURIComponent(actor)}`, {}, 'DELETE');
            wx.showToast({ title: '删除成功' });
            this.loadActivities();
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const d = new Date(timeStr * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
});