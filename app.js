App({
  globalData: {
    apiBase: 'https://www.muyusheng.com/api/wx',
    token: null,
    userInfo: null,
    isBind: false,
    // 夜间模式
    darkMode: false,
    // 背景音乐
    musicPlaying: false,
    musicCurrentTime: 0,
    musicDuration: 0,
    musicList: [
      { id: 1, name: '光阴的故事', url: '' },
      { id: 2, name: '那些年', url: '' },
      { id: 3, name: '老男孩', url: '' }
    ],
    musicCurrent: null
  },

  onLaunch() {
    // 检查本地存储的登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.isBind = true;
    }

    // 检查夜间模式设置
    const darkMode = wx.getStorageSync('darkMode');
    if (darkMode) {
      this.globalData.darkMode = true;
    }

    // 初始化背景音乐
    this.initMusic();
  },

  // 初始化背景音乐
  initMusic() {
    const bgMusic = wx.getBackgroundAudioManager();
    this.bgMusic = bgMusic;

    bgMusic.onEnded(() => {
      this.playNext();
    });
    bgMusic.onError((err) => {
      console.error('Music error:', err);
      this.globalData.musicPlaying = false;
    });
  },

  // 播放音乐
  playMusic(index = 0) {
    const music = this.globalData.musicList[index];
    if (!music || !music.url) {
      wx.showToast({ title: '暂无音乐', icon: 'none' });
      return;
    }

    this.bgMusic.src = music.url;
    this.bgMusic.title = music.name;
    this.globalData.musicPlaying = true;
    this.globalData.musicCurrent = music;
    this.globalData.musicCurrentIndex = index;
  },

  // 暂停音乐
  pauseMusic() {
    this.bgMusic.pause();
    this.globalData.musicPlaying = false;
  },

  // 继续播放
  resumeMusic() {
    this.bgMusic.play();
    this.globalData.musicPlaying = true;
  },

  // 播放下一首
  playNext() {
    let index = (this.globalData.musicCurrentIndex || 0) + 1;
    if (index >= this.globalData.musicList.length) {
      index = 0;
    }
    this.playMusic(index);
  },

  // 切换夜间模式
  toggleDarkMode() {
    this.globalData.darkMode = !this.globalData.darkMode;
    wx.setStorageSync('darkMode', this.globalData.darkMode);

    // 通知所有页面更新
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.onDarkModeChange) {
        page.onDarkModeChange(this.globalData.darkMode);
      }
    });

    return this.globalData.darkMode;
  },

  // 设置夜间模式
  setDarkMode(enabled) {
    this.globalData.darkMode = enabled;
    wx.setStorageSync('darkMode', enabled);

    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.onDarkModeChange) {
        page.onDarkModeChange(enabled);
      }
    });
  },

  checkAndNavigate() {
    if (this.globalData.isBind) {
      wx.switchTab({ url: '/pages/index/index' });
    } else {
      wx.navigateTo({ url: '/pages/bind/bind' });
    }
  }
});
