const { request } = require('../../utils/auth');

const app = getApp();
const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return app.globalData.apiBase.replace('/api/wx', '') + path;
};

Page({
  data: {
    videos: [],
    loading: true
  },

  onLoad() {
    this.loadVideos();
  },

  async loadVideos() {
    try {
      const res = await request('/videos');
      const videos = res.videos || [];
      const videoList = await Promise.all(videos.map(async (v) => {
        try {
          const likeRes = await request(`/media/video/${v.id}/like`);
          return {
            ...v,
            url: getFullUrl(v.url),
            cover: getFullUrl(v.cover),
            likeCount: likeRes.count,
            liked: likeRes.liked,
            playing: false
          };
        } catch {
          return {
            ...v,
            url: getFullUrl(v.url),
            cover: getFullUrl(v.cover),
            likeCount: 0,
            liked: false,
            playing: false
          };
        }
      }));
      this.setData({ videos: videoList, loading: false });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onLike(e) {
    const { id } = e.currentTarget.dataset;
    const videos = this.data.videos;
    const video = videos.find(v => v.id === id);
    if (!video) return;

    try {
      if (video.liked) {
        await request(`/media/video/${id}/like`, { media_type: 'video', media_id: id }, 'DELETE');
      } else {
        await request(`/media/video/${id}/like`, { media_type: 'video', media_id: id }, 'POST');
      }
      const likeRes = await request(`/media/video/${id}/like`);
      const newVideos = videos.map(v =>
        v.id === id ? { ...v, likeCount: likeRes.count, liked: likeRes.liked } : v
      );
      this.setData({ videos: newVideos });
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  },

  onPlay(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      const { id } = e.currentTarget.dataset;
      const videos = this.data.videos.map(v => ({
        ...v,
        playing: v.id === id
      }));
      this.setData({ videos });
    }
  },

  onVideoTap(e) {
    const { url, id } = e.currentTarget.dataset;
    if (!url) return;

    const videos = this.data.videos.map(v => ({
      ...v,
      playing: v.id === id ? !v.playing : false
    }));
    this.setData({ videos });
  },

  // 上传视频
  onUploadVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });

        try {
          const token = getApp().globalData.token;
          const tempFilePath = res.tempFilePath;
          const thumbTempFilePath = res.thumbTempFilePath;
          const duration = res.duration;
          const height = res.height;
          const width = res.width;

          // 生成标题
          const title = `视频_${Date.now()}`;

          const uploadRes = await this.uploadVideoFile(tempFilePath, title, duration);
          wx.hideLoading();

          if (uploadRes.success) {
            wx.showToast({ title: '上传成功' });
            this.loadVideos();
          } else {
            wx.showToast({ title: uploadRes.message || '上传失败', icon: 'none' });
          }
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '上传失败', icon: 'none' });
        }
      }
    });
  },

  uploadVideoFile(tempFilePath, title, duration) {
    return new Promise((resolve, reject) => {
      const token = getApp().globalData.token;
      wx.uploadFile({
        url: `${app.globalData.apiBase.replace('/api/wx', '')}/api/upload_video`,
        filePath: tempFilePath,
        name: 'video',
        formData: {
          title: title,
          duration: duration
        },
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
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
