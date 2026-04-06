const { request } = require('../../utils/auth');

Page({
  data: {
    loading: true,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0
  },

  onLoad() {
    this.loadDeletedItems();
  },

  async loadDeletedItems(page = 1) {
    this.setData({ loading: true });
    try {
      const res = await request(`/deleted?page=${page}`);
      this.setData({
        items: res.items || [],
        page: res.page,
        totalPages: res.total_pages,
        total: res.total,
        loading: false
      });
    } catch (e) {
      console.error('loadDeletedItems error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  onRestore(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定要恢复这条内容吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/deleted/${id}/restore`, {}, 'POST');
            wx.showToast({ title: '恢复成功' });
            this.loadDeletedItems(this.data.page);
          } catch (e) {
            wx.showToast({ title: e.message || '恢复失败', icon: 'none' });
          }
        }
      }
    });
  },

  onPermanentDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '警告',
      content: '彻底删除后无法恢复，确定要彻底删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/deleted/${id}/permanent`, {}, 'POST');
            wx.showToast({ title: '删除成功' });
            this.loadDeletedItems(this.data.page);
          } catch (e) {
            wx.showToast({ title: e.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onPrevPage() {
    if (this.data.page > 1) {
      this.loadDeletedItems(this.data.page - 1);
    }
  },

  onNextPage() {
    if (this.data.page < this.data.totalPages) {
      this.loadDeletedItems(this.data.page + 1);
    }
  }
});
