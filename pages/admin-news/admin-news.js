const { request } = require('../../utils/auth');

Page({
  data: {
    loading: true,
    saving: false,
    crawling: false,
    config: null,
    lastResult: ''
  },

  onLoad() {
    this.loadConfig();
  },

  async loadConfig() {
    try {
      const res = await request('/admin/news/config');
      if (res.success) {
        this.setData({
          config: {
            crawl_hour: res.crawl_hour,
            crawl_minute: res.crawl_minute,
            keywords: res.keywords
          },
          loading: false
        });
      }
    } catch (e) {
      console.error('loadConfig error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCrawlHourChange(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'config.crawl_hour': Math.max(0, Math.min(23, value))
    });
  },

  onCrawlMinuteChange(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'config.crawl_minute': Math.max(0, Math.min(59, value))
    });
  },

  onKeywordsChange(e) {
    this.setData({
      'config.keywords': e.detail.value
    });
  },

  async onSave() {
    const { config } = this.data;
    this.setData({ saving: true });

    try {
      await request('/admin/news/config', {
        crawl_hour: config.crawl_hour,
        crawl_minute: config.crawl_minute,
        keywords: config.keywords
      }, 'POST');
      wx.showToast({ title: '保存成功' });
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onTriggerCrawl() {
    this.setData({ crawling: true });

    try {
      const res = await request('/admin/news/crawl', {}, 'POST');
      if (res.success) {
        wx.showToast({ title: res.message });
        this.setData({ lastResult: res.message });
      } else {
        wx.showToast({ title: res.error || '爬取失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '爬取失败', icon: 'none' });
      console.error(e);
    } finally {
      this.setData({ crawling: false });
    }
  }
});
