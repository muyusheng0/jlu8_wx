const { request } = require('../../utils/auth.js');

Page({
  data: {
    student: null,
    loading: true,
    showPhoneSheet: false,
    showVoiceSheet: false,
    voiceShouts: [],
    recording: false,
    recordingTime: 0,
    phoneActions: [
      { name: '拨打电话', icon: 'phone-o' },
      { name: '复制号码', icon: '复制' }
    ]
  },
  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadStudentDetail(id);
    }
  },
  async loadStudentDetail(studentId) {
    try {
      const res = await request(`/txl/${studentId}`);
      if (res.success && res.student) {
        const app = getApp();
        const baseUrl = app.globalData.apiBase.replace('/api/wx', '');
        let avatar = res.student.avatar || '';
        if (avatar && !avatar.startsWith('http')) {
          avatar = baseUrl + avatar;
        }
        const student = { ...res.student, avatar };
        this.setData({ student, loading: false });
        this.loadVoiceShouts(student.name);
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
  async loadVoiceShouts(targetName) {
    try {
      const res = await request(`/voice_shout/${encodeURIComponent(targetName)}`);
      if (res.success && res.shouts) {
        this.setData({ voiceShouts: res.shouts });
      }
    } catch (e) {
      console.error('loadVoiceShouts error:', e);
    }
  },
  showPhoneAction() {
    this.setData({ showPhoneSheet: true });
  },
  onPhoneSheetClose() {
    this.setData({ showPhoneSheet: false });
  },
  onPhoneActionSelect(event) {
    const { phone } = this.data.student;
    const index = event.detail.index;
    if (index === 0) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else if (index === 1) {
      wx.setClipboardData({
        data: phone,
        success: () => {
          wx.showToast({ title: '号码已复制', icon: 'success' });
        }
      });
    }
    this.onPhoneSheetClose();
  },
  openLink(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({ title: '链接已复制', icon: 'success' });
        }
      });
    }
  },
  onVoiceShout() {
    this.setData({ showVoiceSheet: true });
  },
  onVoiceSheetClose() {
    this.setData({ showVoiceSheet: false });
    if (this.recorderManager) {
      this.recorderManager.stop();
    }
  },
  startRecord() {
    const recorderManager = wx.getRecorderManager();
    this.recorderManager = recorderManager;

    recorderManager.onStart(() => {
      this.setData({ recording: true, recordingTime: 0 });
      this.recordingTimer = setInterval(() => {
        this.setData({ recordingTime: this.data.recordingTime + 1 });
        if (this.data.recordingTime >= 4) {
          this.stopRecord();
        }
      }, 1000);
    });

    recorderManager.onStop((res) => {
      clearInterval(this.recordingTimer);
      this.setData({ recording: false });
      if (res.duration > 1000) {
        this.uploadVoice(res.tempFilePath);
      } else {
        wx.showToast({ title: '录音太短', icon: 'none' });
      }
    });

    recorderManager.onError(() => {
      clearInterval(this.recordingTimer);
      this.setData({ recording: false });
    });

    recorderManager.start({
      duration: 5000,
      format: 'wav'
    });
  },
  stopRecord() {
    if (this.recorderManager) {
      this.recorderManager.stop();
    }
  },
  uploadVoice(tempFilePath) {
    wx.showLoading({ title: '上传中...' });
    const token = getApp().globalData.token;
    wx.uploadFile({
      url: `${getApp().globalData.apiBase}/voice_shout`,
      filePath: tempFilePath,
      name: 'file',
      formData: { to_name: this.data.student.name },
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            wx.showToast({ title: '喊话成功' });
            this.onVoiceSheetClose();
            this.loadVoiceShouts(this.data.student.name);
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
  playVoice(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      const audio = wx.createInnerAudioContext();
      audio.src = url;
      audio.play();
      audio.onPlay(() => {
        wx.showToast({ title: '播放中', icon: 'none' });
      });
      audio.onError(() => {
        wx.showToast({ title: '播放失败', icon: 'none' });
      });
    }
  },
  async deleteVoiceShout(e) {
    const shoutId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这条喊话吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/voice_shout/${shoutId}`, {}, 'DELETE');
            wx.showToast({ title: '删除成功' });
            this.loadVoiceShouts(this.data.student.name);
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
