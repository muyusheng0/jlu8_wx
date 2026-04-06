const { request } = require('../../utils/auth');

// 头像渐变色
const avatarColors = [
  '#e74c3c,#f39c12',
  '#9b59b6,#8e44ad',
  '#3498db,#2980b9',
  '#1abc9c,#16a085',
  '#27ae60,#2ecc71',
  '#f39c12,#e67e22',
  '#e91e63,#c2185b',
  '#00bcd4,#0097a7'
];

Page({
  data: {
    profile: null,
    loading: true,
    showEdit: false,
    editForm: {},
    errors: {},
    avatarColor: avatarColors[0],
    unreadCount: 0
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    if (getApp().globalData.isBind) {
      this.loadProfile();
    }
  },

  async loadProfile() {
    try {
      const res = await request('/profile');
      if (res.success && res.profile) {
        // 根据姓名生成固定颜色
        const nameStr = res.profile.name || '';
        const colorIndex = nameStr.charCodeAt(0) % avatarColors.length;
        this.setData({
          profile: res.profile,
          loading: false,
          avatarColor: avatarColors[colorIndex]
        });
      }
      // 加载未读通知数
      this.loadUnreadCount();
    } catch (e) {
      console.error('loadProfile error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async loadUnreadCount() {
    try {
      const res = await request('/notifications/count');
      if (res.success) {
        this.setData({ unreadCount: res.count || 0 });
      }
    } catch (e) {
      console.error('loadUnreadCount error:', e);
    }
  },

  // 上传头像
  onUploadAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  uploadAvatar(tempFilePath) {
    const token = getApp().globalData.token;
    wx.uploadFile({
      url: `${getApp().globalData.apiBase.replace('/api/wx', '')}/api/wx/avatar`,
      filePath: tempFilePath,
      name: 'avatar',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            wx.showToast({ title: '头像上传成功' });
            this.loadProfile();
          } else {
            wx.showToast({ title: data.error || '上传失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },

  onEdit() {
    const { profile } = this.data;
    this.setData({
      showEdit: true,
      editForm: {
        custom_intro: profile.custom_intro || '',
        gender: profile.gender || '',
        birthday: profile.birthday || '',
        phone: profile.phone || '',
        industry: profile.industry || '',
        company: profile.company || '',
        position: profile.position || '',
        hobby: profile.hobby || '',
        dream: profile.dream || '',
        github: profile.github || '',
        douyin: profile.douyin || '',
        xiaohongshu: profile.xiaohongshu || ''
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

    if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone)) {
      errors.phone = '请输入正确的手机号';
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

  goToNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  },

  goToDeleted() {
    wx.navigateTo({ url: '/pages/deleted/deleted' });
  },

  goToActivityAdmin() {
    wx.navigateTo({ url: '/pages/activity-admin/activity-admin' });
  },

  goToLoginLogs() {
    wx.navigateTo({ url: '/pages/login-logs/login-logs' });
  },

  goToAdminSettings() {
    wx.navigateTo({ url: '/pages/admin-settings/admin-settings' });
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