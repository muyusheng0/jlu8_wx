const { request } = require('../../utils/auth');

const app = getApp();
// 获取完整的图片URL
const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return app.globalData.apiBase.replace('/api/wx', '') + path;
};

Page({
  data: {
    photos: [],
    loading: true,
    previewUrls: [],
    currentUser: null,
    isAdmin: false
  },

  onLoad() {
    this.loadUserProfile();
    this.loadPhotos();
  },

  async loadUserProfile() {
    try {
      const res = await request('/profile');
      if (res.success) {
        this.setData({
          currentUser: res.profile,
          isAdmin: res.profile.is_admin || res.profile.is_super_admin
        });
      }
    } catch (e) {
      console.error('loadUserProfile error:', e);
    }
  },

  onShow() {
    if (this.data.photos.length > 0) {
      this.refreshLikeStatus();
    }
  },

  async loadPhotos() {
    this.setData({ loading: true });
    try {
      const res = await request('/photos');
      const photos = res.photos || [];
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
      const url = getFullUrl(`/static/imgs/messages/${photo.filename}`);
      return { ...photo, url, likeCount: likeRes.count, liked: likeRes.liked };
    } catch {
      const url = getFullUrl(`/static/imgs/messages/${photo.filename}`);
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
      // 静默失败
    }
  },

  async onLike(e) {
    e.stopPropagation?.();
    const { id } = e.currentTarget.dataset;
    const photos = this.data.photos;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

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
      this.setData({ photos });
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    const photos = this.data.photos;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    wx.showModal({
      title: '提示',
      content: '确定删除这张照片？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/media/photo/${id}`, {}, 'DELETE');
            wx.showToast({ title: '删除成功' });
            this.loadPhotos();
          } catch (e) {
            wx.showToast({ title: e.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onSaveImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.saveImageToPhotosAlbum({
      filePath: url,
      success: () => {
        wx.showToast({ title: '保存成功' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showToast({ title: '请授权保存图片', icon: 'none' });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  onPreview(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls || [url]
    });
  },

  // 选择并上传照片
  onUploadPhoto() {
    wx.chooseImage({
      count: 9, // 最多选择9张
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths;
        wx.showLoading({ title: '上传中...' });

        let successCount = 0;
        for (let i = 0; i < tempFilePaths.length; i++) {
          try {
            await this.uploadSinglePhoto(tempFilePaths[i]);
            successCount++;
          } catch (e) {
            console.error('上传失败:', e);
          }
        }

        wx.hideLoading();
        if (successCount > 0) {
          wx.showToast({ title: `成功上传${successCount}张` });
          this.loadPhotos();
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  uploadSinglePhoto(tempFilePath) {
    return new Promise((resolve, reject) => {
      const token = getApp().globalData.token;
      wx.uploadFile({
        url: `${app.globalData.apiBase.replace('/api/wx', '')}/api/upload_image`,
        filePath: tempFilePath,
        name: 'image',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});
