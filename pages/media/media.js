const { request } = require('../../utils/auth');

const app = getApp();
const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return app.globalData.apiBase.replace('/api/wx', '') + path;
};

Page({
  data: {
    currentTab: 'photos',
    photoCount: 0,
    videoCount: 0,
    recentPhotos: [],
    news: [],
    darkMode: false,
    musicPlaying: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      darkMode: app.globalData.darkMode,
      musicPlaying: app.globalData.musicPlaying
    });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const [photoRes, videoRes, newsRes] = await Promise.all([
        request('/photos'),
        request('/videos'),
        request('/news')
      ]);

      const photos = photoRes.photos || [];
      const recentPhotos = photos.slice(0, 6).map(p => ({
        ...p,
        url: getFullUrl(`/static/imgs/messages/${p.filename}`)
      }));

      this.setData({
        photoCount: photos.length,
        videoCount: (videoRes.videos || []).length,
        recentPhotos: recentPhotos,
        news: (newsRes.news || []).slice(0, 20)
      });
    } catch (e) {
      console.error('loadData error:', e);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    if (tab === 'news' && this.data.news.length === 0) {
      this.loadNews();
    }
  },

  async loadNews() {
    try {
      const res = await request('/news');
      this.setData({ news: (res.news || []).slice(0, 20) });
    } catch (e) {
      console.error('loadNews error:', e);
    }
  },

  onNewsTap(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.setClipboardData({ data: url });
      wx.showToast({ title: '链接已复制', icon: 'none' });
    }
  },

  goToGallery() {
    wx.navigateTo({ url: '/pages/gallery/gallery' });
  },

  goToVideo() {
    wx.navigateTo({ url: '/pages/video/video' });
  },

  previewPhoto(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.recentPhotos.map(p => p.url)
    });
  },

  toggleDarkMode() {
    const app = getApp();
    const newDarkMode = app.toggleDarkMode();
    this.setData({ darkMode: newDarkMode });
  },

  toggleMusic() {
    const app = getApp();
    if (app.globalData.musicPlaying) {
      app.pauseMusic();
      this.setData({ musicPlaying: false });
    } else {
      if (!app.globalData.musicCurrent) {
        app.playMusic(0);
      } else {
        app.resumeMusic();
      }
      this.setData({ musicPlaying: true });
    }
  },

  onDarkModeChange(darkMode) {
    this.setData({ darkMode });
  }
});
