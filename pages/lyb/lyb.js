const { request } = require('../../utils/auth');

const app = getApp();

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
    currentComments: [],
    // 用户信息
    currentUser: null,
    isAdmin: false,
    // 上传中的图片
    uploadingImage: false,
    newImageUrl: '',
    // 语音录制
    isRecording: false,
    recordingDuration: 0,
    recordingTimer: null,
    tempVoicePath: '',
    // 正在播放的语音
    playingVoiceId: null,
    audioContext: null
  },

  onLoad() {
    this.loadMessages();
    this.loadUserProfile();
  },

  onUnload() {
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer);
    }
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
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

  async loadMessages() {
    try {
      const res = await request('/messages');
      const app = getApp();
      const baseUrl = app.globalData.apiBase.replace('/api/wx', '');
      const messages = (res.messages || []).map(m => ({
        ...m,
        avatar: m.avatar ? (m.avatar.startsWith('http') ? m.avatar : baseUrl + m.avatar) : '',
        image: m.image ? (m.image.startsWith('http') ? m.image : baseUrl + m.image) : '',
        voice: m.voice ? (m.voice.startsWith('http') ? m.voice : baseUrl + m.voice) : ''
      }));
      this.setData({ messages });
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

  // 选择图片
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ uploadingImage: true });
        this.uploadMessageImage(tempFilePath);
      }
    });
  },

  // 上传留言图片
  uploadMessageImage(tempFilePath) {
    const token = getApp().globalData.token;
    wx.uploadFile({
      url: `${app.globalData.apiBase.replace('/api/wx', '')}/api/wx/messages/image`,
      filePath: tempFilePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            this.setData({
              uploadingImage: false,
              newImageUrl: data.url
            });
            wx.showToast({ title: '图片上传成功' });
          } else {
            this.setData({ uploadingImage: false });
            wx.showToast({ title: data.error || '上传失败', icon: 'none' });
          }
        } catch (e) {
          this.setData({ uploadingImage: false });
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ uploadingImage: false });
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },

  // 删除已选择的图片
  onRemoveImage() {
    this.setData({ newImageUrl: '' });
  },

  // 开始录音
  onStartRecord() {
    if (this.data.isRecording) return;

    wx.startRecord({
      success: (res) => {
        this.setData({
          tempVoicePath: res.tempFilePath,
          isRecording: true,
          recordingDuration: 0
        });

        // 开始计时
        const timer = setInterval(() => {
          this.setData({
            recordingDuration: this.data.recordingDuration + 1
          });
          // 最多录制60秒
          if (this.data.recordingDuration >= 60) {
            this.onStopRecord();
          }
        }, 1000);
        this.setData({ recordingTimer: timer });
      },
      fail: (err) => {
        wx.showToast({ title: '录音失败，请检查权限', icon: 'none' });
      }
    });

    // 监听录音中断
    wx.onVoiceRecordEnd({
      complete: (res) => {
        this.setData({
          tempVoicePath: res.tempFilePath,
          isRecording: false
        });
        if (this.data.recordingTimer) {
          clearInterval(this.data.recordingTimer);
        }
        // 自动发送
        this.uploadVoiceMessage(res.tempFilePath);
      }
    });
  },

  // 停止录音
  onStopRecord() {
    if (!this.data.isRecording) return;

    wx.stopRecord();
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer);
    }
    this.setData({
      isRecording: false,
      recordingTimer: null
    });

    // 上传录音
    if (this.data.tempVoicePath) {
      this.uploadVoiceMessage(this.data.tempVoicePath);
    }
  },

  // 取消录音
  onCancelRecord() {
    if (!this.data.isRecording) return;

    wx.stopRecord();
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer);
    }
    this.setData({
      isRecording: false,
      recordingDuration: 0,
      tempVoicePath: '',
      recordingTimer: null
    });
  },

  // 上传语音留言
  uploadVoiceMessage(tempFilePath) {
    const token = getApp().globalData.token;
    wx.showLoading({ title: '上传中...' });

    wx.uploadFile({
      url: `${app.globalData.apiBase.replace('/api/wx', '')}/api/wx/messages/voice`,
      filePath: tempFilePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            wx.showToast({ title: '语音留言成功' });
            this.setData({ tempVoicePath: '', recordingDuration: 0 });
            this.loadMessages();
          } else {
            wx.showToast({ title: data.error || '上传失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },

  // 播放语音留言
  onPlayVoice(e) {
    const { url, id } = e.currentTarget.dataset;

    // 如果正在播放同一个语音，则停止
    if (this.data.playingVoiceId === id) {
      wx.stopVoice();
      this.setData({ playingVoiceId: null });
      return;
    }

    // 停止之前的播放
    if (this.data.playingVoiceId) {
      wx.stopVoice();
    }

    wx.playVoice({
      filePath: url,
      success: () => {
        this.setData({ playingVoiceId: id });
      },
      fail: () => {
        wx.showToast({ title: '播放失败', icon: 'none' });
      }
    });

    // 监听播放结束
    wx.onVoicePlayEnd(() => {
      this.setData({ playingVoiceId: null });
    });
  },

  async onSubmit() {
    if (!getApp().globalData.isBind) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const { newContent, newImageUrl } = this.data;
    if (!newContent.trim()) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }

    try {
      await request('/messages', {
        content: newContent,
        image: newImageUrl
      }, 'POST');
      this.setData({ newContent: '', newImageUrl: '' });
      this.loadMessages();
      wx.showToast({ title: '发表成功' });
    } catch (e) {
      wx.showToast({ title: '发表失败', icon: 'none' });
    }
  },

  // 点赞
  async onLike(e) {
    if (!getApp().globalData.isBind) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
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

  // 删除留言
  onDeleteMessage(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定删除这条留言？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/messages/${id}`, {}, 'DELETE');
            wx.showToast({ title: '删除成功' });
            this.loadMessages();
          } catch (e) {
            wx.showToast({ title: e.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 打开评论弹窗
  async toggleCommentPopup(e) {
    if (!getApp().globalData.isBind) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
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
    if (!getApp().globalData.isBind) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
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