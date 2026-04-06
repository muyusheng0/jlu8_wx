const { request } = require('../../utils/auth.js');

Page({
  data: {
    student: null,
    loading: true
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
  onCall() {
    const { phone } = this.data.student;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  }
});
