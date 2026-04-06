const { request } = require('../../utils/auth.js');

Page({
  data: {
    student: null,
    loading: true,
    showPhoneSheet: false,
    phoneActions: [
      { name: '拨打电话', icon: 'phone-o' },
      { name: '复制号码', icon: '复制' }
    ]
  },
  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadStudentDetail(id);
    }
  },
  async loadStudentDetail(studentId) {
    try {
      const res = await request(`/txl/${studentId}`);
      if (res.success && res.student) {
        this.setData({ student: res.student, loading: false });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
  showPhoneAction() {
    this.setData({ showPhoneSheet: true });
  },
  onPhoneSheetClose() {
    this.setData({ showPhoneSheet: false });
  },
  onPhoneActionSelect(event) {
    const { phone } = this.data.student;
    const index = event.detail.index;
    if (index === 0) {
      // 拨打电话
      wx.makePhoneCall({ phoneNumber: phone });
    } else if (index === 1) {
      // 复制号码
      wx.setClipboardData({
        data: phone,
        success: () => {
          wx.showToast({ title: '号码已复制', icon: 'success' });
        }
      });
    }
    this.onPhoneSheetClose();
  },
  openLink(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({ title: '链接已复制', icon: 'success' });
        }
      });
    }
  }
});
