const { request } = require('../../utils/auth');

Page({
  data: {
    messages: [],
    newContent: '',
    loading: false,
    // 点赞状态缓存
    likeStatus: {},  // {messageId: {count, liked}}
    // 评论状态
    comments: {},  // {messageId: [comments]}
    showComments: {}  // {messageId: true/false}
  },

  onLoad() {
    this.loadMessages();
  },

  async loadMessages() {
    try {
      const res = await request('/messages');
      this.setData({ messages: res.messages });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onContentInput(e) {
    this.setData({ newContent: e.detail.value });
  },

  async onSubmit() {
    const { newContent } = this.data;
    if (!newContent.trim()) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }

    try {
      await request('/messages', { content: newContent }, 'POST');
      this.setData({ newContent: '' });
      this.loadMessages();
      wx.showToast({ title: '发表成功' });
    } catch (e) {
      wx.showToast({ title: '发表失败', icon: 'none' });
    }
  },

  // 点赞
  async onLike(e) {
    const { id } = e.currentTarget.dataset;
    const status = this.data.likeStatus[id] || {};
    const liked = status.liked;

    try {
      if (liked) {
        await request(`/messages/${id}/like`, { message_id: id }, 'DELETE');
      } else {
        await request(`/messages/${id}/like`, { message_id: id }, 'POST');
      }
      // 更新状态
      const res = await request(`/messages/${id}/like`);
      const newStatus = { ...this.data.likeStatus };
      newStatus[id] = { count: res.count, liked: res.liked };
      this.setData({ likeStatus: newStatus });
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  },

  // 切换评论显示
  async toggleComments(e) {
    const { id } = e.currentTarget.dataset;
    const show = !this.data.showComments[id];
    let comments = this.data.comments[id] || [];

    if (show && comments.length === 0) {
      // 加载评论
      try {
        const res = await request(`/comments/${id}`);
        comments = res.comments || [];
      } catch (e) {
        comments = [];
      }
    }

    this.setData({
      showComments: { ...this.data.showComments, [id]: show },
      comments: { ...this.data.comments, [id]: comments }
    });
  },

  // 发表评论
  async onComment(e) {
    const { id } = e.currentTarget.dataset;
    const content = e.detail.value.trim();
    if (!content) return;

    try {
      await request('/comments', { message_id: id, content }, 'POST');
      wx.showToast({ title: '评论成功' });
      // 刷新评论
      const res = await request(`/comments/${id}`);
      this.setData({
        comments: { ...this.data.comments, [id]: res.comments || [] }
      });
    } catch (e) {
      wx.showToast({ title: e.message || '评论失败', icon: 'none' });
    }
  }
});