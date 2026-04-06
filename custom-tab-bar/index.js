Component({
  data: {
    active: 0,
    list: [
      { text: '首页', path: '/pages/index/index' },
      { text: '通讯录', path: '/pages/txl/txl' },
      { text: '留言板', path: '/pages/lyb/lyb' },
      { text: '媒体', path: '/pages/media/media' },
      { text: '我的', path: '/pages/profile/profile' }
    ]
  },

  attached() {
    this.setActive()
  },

  methods: {
    setActive() {
      const pages = getCurrentPages()
      if (pages.length === 0) return
      const currentPage = pages[pages.length - 1]
      if (!currentPage || !currentPage.route) return
      const active = this.data.list.findIndex(item => item.path === `/${currentPage.route}`)
      if (active !== -1) {
        this.setData({ active })
      }
    },

    onTabChange(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]
      if (!item) return
      this.setData({ active: index })
      wx.switchTab({ url: item.path })
    }
  }
})
