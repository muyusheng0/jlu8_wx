const { request } = require('../../utils/auth');

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
      // 获取每个视频的点赞状态
      const videoList = await Promise.all(videos.map(async (v) => {
        try {
          const likeRes = await request(`/media/video/${v.id}/like`);
          return { ...v, likeCount: likeRes.count, liked: likeRes.liked, playing: false };
        } catch {
          return { ...v, likeCount: 0, liked: false, playing: false };
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
      // 使用原生 video 组件在当前页面播放
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

    // 停止其他视频播放
    const videos = this.data.videos.map(v => ({
      ...v,
      playing: v.id === id ? !v.playing : false
    }));
    this.setData({ videos });
  }
});
