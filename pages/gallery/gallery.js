const { request } = require('../../utils/auth');

Page({
  data: {
    photos: [],
    loading: true,
    previewUrls: []
  },

  onLoad() {
    this.loadPhotos();
  },

  async loadPhotos() {
    try {
      const res = await request('/photos');
      const photos = res.photos || [];
      // 获取每张照片的点赞状态
      const photoList = await Promise.all(photos.map(async (p) => {
        try {
          const likeRes = await request(`/media/photo/${p.id}/like`);
          return { ...p, likeCount: likeRes.count, liked: likeRes.liked };
        } catch {
          return { ...p, likeCount: 0, liked: false };
        }
      }));
      // 生成预览URL列表
      const previewUrls = photoList.map(p => p.url);
      this.setData({ photos: photoList, previewUrls, loading: false });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onLike(e) {
    const { id } = e.currentTarget.dataset;
    const photos = this.data.photos;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    try {
      if (photo.liked) {
        await request(`/media/photo/${id}/like`, { media_type: 'photo', media_id: id }, 'DELETE');
      } else {
        await request(`/media/photo/${id}/like`, { media_type: 'photo', media_id: id }, 'POST');
      }
      // 更新状态
      const likeRes = await request(`/media/photo/${id}/like`);
      const newPhotos = photos.map(p =>
        p.id === id ? { ...p, likeCount: likeRes.count, liked: likeRes.liked } : p
      );
      this.setData({ photos: newPhotos });
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  },

  onPreview(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls || [url]
    });
  }
});
