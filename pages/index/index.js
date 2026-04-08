const { request } = require('../../utils/auth');

Page({
  data: {
    studentCount: 0,
    messageCount: 0,
    photoCount: 0,
    recentMessages: [],
    activities: [],
    timeline: [],
    currentSwiper: 0,
    unreadActivityCount: 0
  },

  onLoad() {
    this.checkBind();
  },

  onShow() {
    if (getApp().globalData.isBind) {
      this.loadData();
    }
  },

  checkBind() {
    const app = getApp();
    if (!app.globalData.isBind) {
      wx.navigateTo({ url: '/pages/bind/bind' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [txlRes, msgRes, photoRes, activitiesRes, timelineRes] = await Promise.all([
        request('/txl'),
        request('/messages'),
        request('/photos'),
        request('/activities'),
        request('/timeline')
      ]);

      this.setData({
        studentCount: txlRes.students ? txlRes.students.length : 0,
        messageCount: msgRes.messages ? msgRes.messages.length : 0,
        photoCount: photoRes.photos ? photoRes.photos.length : 0,
        recentMessages: msgRes.messages ? msgRes.messages.slice(0, 3) : [],
        activities: activitiesRes.activities || [],
        timeline: timelineRes.timeline || []
      });
      this.loadUnreadActivityCount();
    } catch (e) {
      console.error('loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async loadUnreadActivityCount() {
    try {
      const res = await request('/notifications/count');
      if (res.success) {
        this.setData({ unreadActivityCount: res.count || 0 });
      }
    } catch (e) {
      console.error('loadUnreadActivityCount error:', e);
    }
  },

  onSwiperChange(e) {
    this.setData({
      currentSwiper: e.detail.current
    });
  },

  goToTXL() {
    wx.switchTab({ url: '/pages/txl/txl' });
  },

  goToLYB() {
    wx.switchTab({ url: '/pages/lyb/lyb' });
  },

  goToGallery() {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goToVideo() {
    wx.navigateTo({ url: '/pages/video/video' });
  },

  // 获取照片URL数组用于预览
  getPhotoUrls(photos) {
    return photos.map(p => p.url).join(',');
  },

  // 预览照片
  previewPhoto(e) {
    const { url, urls } = e.currentTarget.dataset;
    const urlList = urls.split(',');
    wx.previewImage({
      current: url,
      urls: urlList
    });
  },

  // 点击动态卡片跳转
  onActivityTap(e) {
    const { index } = e.currentTarget.dataset;
    const activity = this.data.activities[index];
    if (!activity) return;

    const type = activity.type;
    if (type === 'profile_update') {
      // 跳转到通讯录滚动到该同学
      wx.switchTab({ url: '/pages/txl/txl' });
      // TODO: 传递参数让通讯录滚动到对应同学
    } else if (type === 'message') {
      // 跳转到留言板
      wx.switchTab({ url: '/pages/lyb/lyb' });
    } else if (type === 'photo') {
      // 跳转到相册
      wx.navigateTo({ url: '/pages/gallery/gallery' });
    } else if (type === 'video') {
      // 跳转到视频
      wx.navigateTo({ url: '/pages/video/video' });
    } else if (type === 'voice_shout') {
      // 跳转到通讯录
      wx.switchTab({ url: '/pages/txl/txl' });
    }
  }
});
