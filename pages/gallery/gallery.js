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

  onShow() {
    // 每次显示页面时刷新点赞状态
    if (this.data.photos.length > 0) {
      this.refreshLikeStatus();
    }
  },

  async loadPhotos() {
    this.setData({ loading: true });
    try {
      const res = await request('/photos');
      const photos = res.photos || [];
      // 并行获取所有照片的点赞状态
      const photoList = await Promise.all(
        photos.map(p => this.getPhotoLikeStatus(p))
      );
      const previewUrls = photoList.map(p => p.url);
      this.setData({ photos: photoList, previewUrls, loading: false });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async getPhotoLikeStatus(photo) {
    try {
      const likeRes = await request(`/media/photo/${photo.id}/like`);
      // 拼接完整的图片URL
      const url = `/static/imgs/messages/${photo.filename}`;
      return { ...photo, url, likeCount: likeRes.count, liked: likeRes.liked };
    } catch {
      const url = `/static/imgs/messages/${photo.filename}`;
      return { ...photo, url, likeCount: 0, liked: false };
    }
  },

  async refreshLikeStatus() {
    try {
      const photoList = await Promise.all(
        this.data.photos.map(p => this.getPhotoLikeStatus(p))
      );
      this.setData({ photos: photoList });
    } catch (e) {
      // 静默失败，不影响用户操作
    }
  },

  async onLike(e) {
    e.stopPropagation?.();
    const { id } = e.currentTarget.dataset;
    const photos = this.data.photos;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    // 乐观更新 UI
    const newPhotos = photos.map(p =>
      p.id === id
        ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    );
    this.setData({ photos: newPhotos });

    try {
      const method = photo.liked ? 'DELETE' : 'POST';
      await request(`/media/photo/${id}/like`, { media_type: 'photo', media_id: id }, method);
    } catch (e) {
      // 回滚 UI
      this.setData({ photos });
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
