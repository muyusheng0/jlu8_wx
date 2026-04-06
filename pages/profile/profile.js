const { request } = require('../../utils/auth');

Page({
  data: {
    profile: null,
    loading: true,
    showEdit: false,
    editForm: {},
    errors: {}
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
      },
      errors: {}
    });
  },

  onEditField(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      editForm: { ...this.data.editForm, [field]: value },
      errors: { ...this.data.errors, [field]: '' }
    });
  },

  validateForm() {
    const { editForm } = this.data;
    const errors = {};
    let isValid = true;

    // 手机号验证（可选，如果填写则验证格式）
    if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone)) {
      errors.phone = '请输入正确的手机号';
      isValid = false;
    }

    // 邮箱验证（可选，如果填写则验证格式）
    if (editForm.email && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editForm.email)) {
      errors.email = '请输入正确的邮箱';
      isValid = false;
    }

    // QQ验证（可选，如果填写则验证格式，5-11位数字）
    if (editForm.qq && !/^[1-9]\d{4,10}$/.test(editForm.qq)) {
      errors.qq = '请输入正确的QQ号';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  async onSave() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请检查输入格式', icon: 'none' });
      return;
    }

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
    this.setData({ showEdit: false, errors: {} });
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
