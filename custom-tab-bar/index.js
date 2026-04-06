Component({
  data: {
    active: 0,
    list: [
      {
        emoji: '🏠',
        text: '首页',
        path: '/pages/index/index'
      },
      {
        emoji: '👥',
        text: '通讯录',
        path: '/pages/txl/txl'
      },
      {
        emoji: '💬',
        text: '留言板',
        path: '/pages/lyb/lyb'
      },
      {
        emoji: '📷',
        text: '媒体',
        path: '/pages/media/media'
      },
      {
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
      if (pages.length === 0) {
        return
      }
      const currentPage = pages[pages.length - 1]
      if (!currentPage) {
        return
      }
      const route = currentPage.route
      const active = this.data.list.findIndex(item => item.path === `/${route}`)
      if (active !== -1) {
        this.setData({ active })
      }
    },

    onChange(e) {
      const { value } = e.detail
      const item = this.data.list[value]
      if (!item) {
        return
      }
      this.setData({ active: value })
      wx.switchTab({ url: item.path })
    }
  }
})