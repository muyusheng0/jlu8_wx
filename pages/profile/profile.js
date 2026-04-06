const { request } = require('../../utils/auth');

Page({
  data: {
    profile: null,
    loading: true,
    showEdit: false,
    editForm: {}
  },

  onLoad() {
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const res = await request('/profile');
      if (res.success && res.profile) {
        this.setData({ profile: res.profile, loading: false });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onEdit() {
    const { profile } = this.data;
    this.setData({
      showEdit: true,
      editForm: {
        phone: profile.phone || '',
        wechat: profile.wechat || '',
        qq: profile.qq || '',
        email: profile.email || '',
        company: profile.company || '',
        position: profile.position || '',
        hobby: profile.hobby || '',
        dream: profile.dream || ''
      }
    });
  },

  onEditField(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      editForm: { ...this.data.editForm, [field]: value }
    });
  },

  async onSave() {
    const { editForm } = this.data;

    try {
      await request('/profile', editForm, 'PUT');
      wx.showToast({ title: '保存成功' });
      this.setData({ showEdit: false });
      this.loadProfile();
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  onCancel() {
    this.setData({ showEdit: false });
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          getApp().globalData = { isBind: false, token: null, userInfo: null };
          wx.reLaunch({ url: '/pages/bind/bind' });
        }
      }
    });
  }
});