const { request } = require('../../utils/auth');

Page({
  data: {
    loading: true,
    notifications: []
  },

  onLoad() {
    this.loadNotifications();
  },

  async loadNotifications() {
    this.setData({ loading: true });
    try {
      const res = await request('/notifications');
      this.setData({
        notifications: res.notifications || [],
        loading: false
      });
    } catch (e) {
      console.error('loadNotifications error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async markAllRead() {
    try {
      await request('/notifications/mark_read', {}, 'POST');
      wx.showToast({ title: '已全部标记为已读' });
      this.loadNotifications();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 点击通知跳转
  onNotificationTap(e) {
    const { index } = e.currentTarget.dataset;
    const notification = this.data.notifications[index];
    if (!notification) return;

    const type = notification.type;
    const refId = notification.ref_id;
    const targetName = notification.target_name;
    const mediaType = notification.media_type;

    // 标记为已读
    if (!notification.read) {
      this.markNotificationRead(notification.id);
    }

    // 根据类型跳转
    if (type === 'comment') {
      // 跳转到留言板
      wx.switchTab({ url: '/pages/lyb/lyb' });
    } else if (type === 'like') {
      if (mediaType === 'photo' || mediaType === 'video') {
        // 跳转到相册
        wx.navigateTo({ url: '/pages/gallery/gallery' });
      } else {
        // 跳转到留言板
        wx.switchTab({ url: '/pages/lyb/lyb' });
      }
    } else if (type === 'voice_shout') {
      // 跳转到通讯录
      wx.switchTab({ url: '/pages/txl/txl' });
    }
  },

  // 标记单条通知已读
  async markNotificationRead(notifId) {
    try {
      await request(`/notifications/${notifId}/read`, {}, 'POST');
      // 更新本地状态
      const notifications = this.data.notifications.map(n => {
        if (n.id === notifId) {
          return { ...n, read: true };
        }
        return n;
      });
      this.setData({ notifications });
    } catch (e) {
      console.error('markNotificationRead error:', e);
    }
  }
});
