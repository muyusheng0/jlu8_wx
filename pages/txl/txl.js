const { request } = require('../../utils/auth');

// 头像渐变色配置
const avatarColors = [
  '#2c3e50,#34495e', // 深蓝灰
  '#e74c3c,#f39c12', // 红橙
  '#9b59b6,#8e44ad', // 紫色
  '#3498db,#2980b9', // 蓝色
  '#1abc9c,#16a085', // 青色
  '#27ae60,#2ecc71', // 绿色
  '#f39c12,#e67e22', // 橙色
  '#e91e63,#c2185b', // 粉色
];

Page({
  data: {
    students: [],
    filteredStudents: [],
    searchKey: ''
  },

  onLoad() {
    this.loadStudents();
  },

  async loadStudents() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await request('/txl');
      const students = (res.students || []).map((s, index) => ({
        ...s,
        avatarColor: avatarColors[index % avatarColors.length]
      }));
      this.setData({
        students: students,
        filteredStudents: students
      });
    } catch (e) {
      console.error('loadStudents error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onSearchChange(e) {
    const key = e.detail;
    this.setData({ searchKey: key });
    this.filterStudents(key);
  },

  onSearch(e) {
    const key = e.detail;
    this.filterStudents(key);
  },

  onClearSearch() {
    this.setData({
      searchKey: '',
      filteredStudents: this.data.students
    });
  },

  filterStudents(key) {
    if (!key) {
      this.setData({ filteredStudents: this.data.students });
      return;
    }
    const lowerKey = key.toLowerCase();
    const filtered = this.data.students.filter(s =>
      s.name.toLowerCase().includes(lowerKey) ||
      (s.city && s.city.toLowerCase().includes(lowerKey)) ||
      (s.hometown && s.hometown.toLowerCase().includes(lowerKey)) ||
      (s.company && s.company.toLowerCase().includes(lowerKey))
    );
    this.setData({ filteredStudents: filtered });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/txl-detail/txl-detail?id=${id}` });
  },

  scrollToIndex(e) {
    const index = e.currentTarget.dataset.index;
    // 简单提示
    wx.showToast({
      title: `索引 ${index}`,
      icon: 'none',
      duration: 500
    });
  }
});
