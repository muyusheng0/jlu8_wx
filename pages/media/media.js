const { request } = require('../../utils/auth');

const app = getApp();
const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return app.globalData.apiBase.replace('/api/wx', '') + path;
};

Page({
  data: {
    photoCount: 0,
    videoCount: 0,
    recentPhotos: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const [photoRes, videoRes] = await Promise.all([
        request('/photos'),
        request('/videos')
      ]);

      const photos = photoRes.photos || [];
      const recentPhotos = photos.slice(0, 6).map(p => ({
        ...p,
        url: getFullUrl(`/static/imgs/messages/${p.filename}`)
      }));

      this.setData({
        photoCount: photos.length,
        videoCount: (videoRes.videos || []).length,
        recentPhotos: recentPhotos
      });
    } catch (e) {
      console.error('loadData error:', e);
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
  }
});
