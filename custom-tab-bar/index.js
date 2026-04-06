Component({
  data: {
    active: 0,
    list: [
      {
        icon: 'wap-home',
        selectedIcon: 'wap-home',
        emoji: '🏠',
        text: '首页',
        path: '/pages/index/index'
      },
      {
        icon: 'friends',
        selectedIcon: 'friends',
        emoji: '👥',
        text: '通讯录',
        path: '/pages/txl/txl'
      },
      {
        icon: 'comment-o',
        selectedIcon: 'comment',
        emoji: '💬',
        text: '留言板',
        path: '/pages/lyb/lyb'
      },
      {
        icon: 'photo-o',
        selectedIcon: 'photo',
        emoji: '📷',
        text: '媒体',
        path: '/pages/media/media'
      },
      {
        icon: 'user-o',
        selectedIcon: 'user',
        emoji: '👤',
        text: '我的',
        path: '/pages/profile/profile'
      }
    ]
  },

  attached() {
    this.setActive()
  },

  methods: {
    setActive() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route
      const active = this.data.list.findIndex(item => item.path === `/${route}`)
      this.setData({ active: active !== -1 ? active : 0 })
    },

    onChange(e) {
      const { value } = e.detail
      const item = this.data.list[value]
      this.setData({ active: value })
      wx.switchTab({ url: item.path })
    }
  }
})