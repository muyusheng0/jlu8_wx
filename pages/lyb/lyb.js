const { request } = require('../../utils/auth');

Page({
  data: {
    messages: [],
    newContent: '',
    loading: false,
    // 点赞状态缓存
    likeStatus: {},  // {messageId: {count, liked}}
    // 评论弹窗
    commentPopupShow: false,
    currentMessageId: null,
    commentContent: '',
    currentComments: []
  },

  onLoad() {
    this.loadMessages();
  },

  async loadMessages() {
    try {
      const res = await request('/messages');
      this.setData({ messages: res.messages || [] });
      // 加载点赞状态
      this.loadLikeStatus();
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载所有消息的点赞状态
  async loadLikeStatus() {
    const { messages } = this.data;
    const newStatus = { ...this.data.likeStatus };

    for (const msg of messages) {
      try {
        const res = await request(`/messages/${msg.id}/like`);
        newStatus[msg.id] = { count: res.count, liked: res.liked };
      } catch (e) {
        // 忽略错误
      }
    }
    this.setData({ likeStatus: newStatus });
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

  // 打开评论弹窗
  async toggleCommentPopup(e) {
    const { id } = e.currentTarget.dataset;
    const show = !this.data.commentPopupShow;

    if (show) {
      // 加载评论
      try {
        const res = await request(`/comments/${id}`);
        this.setData({
          commentPopupShow: true,
          currentMessageId: id,
          currentComments: res.comments || []
        });
      } catch (e) {
        this.setData({
          commentPopupShow: true,
          currentMessageId: id,
          currentComments: []
        });
        wx.showToast({ title: '加载评论失败', icon: 'none' });
      }
    } else {
      this.setData({ commentPopupShow: false });
    }
  },

  // 关闭评论弹窗
  onCloseCommentPopup() {
    this.setData({
      commentPopupShow: false,
      commentContent: ''
    });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value });
  },

  // 提交评论
  async onSubmitComment() {
    const { commentContent, currentMessageId } = this.data;
    if (!commentContent.trim()) {
      wx.showToast({ title: '评论内容不能为空', icon: 'none' });
      return;
    }

    try {
      await request('/comments', {
        message_id: currentMessageId,
        content: commentContent.trim()
      }, 'POST');

      this.setData({ commentContent: '' });

      // 刷新评论列表
      const res = await request(`/comments/${currentMessageId}`);
      this.setData({
        currentComments: res.comments || []
      });

      // 更新消息列表中的评论数
      const messages = this.data.messages.map(msg => {
        if (msg.id === currentMessageId) {
          return { ...msg, comment_count: (msg.comment_count || 0) + 1 };
        }
        return msg;
      });
      this.setData({ messages });

      wx.showToast({ title: '评论成功' });
    } catch (e) {
      wx.showToast({ title: e.message || '评论失败', icon: 'none' });
    }
  },

  // 图片预览
  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  // 删除评论
  async onDeleteComment(e) {
    const { id, messageId } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定要删除这条评论吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/comments/${id}`, { id }, 'DELETE');

            // 刷新评论列表
            const resp = await request(`/comments/${messageId}`);
            this.setData({
              currentComments: resp.comments || []
            });

            // 更新消息列表中的评论数
            const messages = this.data.messages.map(msg => {
              if (msg.id === messageId) {
                return { ...msg, comment_count: Math.max(0, (msg.comment_count || 1) - 1) };
              }
              return msg;
            });
            this.setData({ messages });

            wx.showToast({ title: '删除成功' });
          } catch (e) {
            wx.showToast({ title: e.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
