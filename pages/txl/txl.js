const { request } = require('../../utils/auth');

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
    try {
      const res = await request('/txl');
      this.setData({
        students: res.students,
        filteredStudents: res.students
      });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
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
      (s.hometown && s.hometown.toLowerCase().includes(lowerKey))
    );
    this.setData({ filteredStudents: filtered });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/txl-detail/txl-detail?id=${id}` });
  }
});
