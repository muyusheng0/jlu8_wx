const app = getApp();

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error('No code'));
          return;
        }

        try {
          const response = await request('/login', {
            code: res.code
          }, 'POST');

          if (response.need_bind) {
            app.globalData.isBind = false;
            resolve({ needBind: true, openid: response.openid });
          } else {
            app.globalData.token = response.token;
            app.globalData.userInfo = response.user;
            app.globalData.isBind = true;
            wx.setStorageSync('token', response.token);
            wx.setStorageSync('userInfo', response.user);
            resolve({ needBind: false, user: response.user });
          }
        } catch (e) {
          reject(e);
        }
      },
      fail: reject
    });
  });
}

function bind(openid, name, studentId) {
  return new Promise((resolve, reject) => {
    request('/bind', {
      openid,
      name,
      student_id: studentId
    }, 'POST').then(response => {
      app.globalData.token = response.token;
      app.globalData.userInfo = response.user;
      app.globalData.isBind = true;
      wx.setStorageSync('token', response.token);
      wx.setStorageSync('userInfo', response.user);
      resolve(response.user);
    }).catch(reject);
  });
}

function request(url, data, method = 'GET') {
  const app = getApp();
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + url,
      data,
      method,
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: (res) => {
        if (res.data.success) {
          resolve(res.data);
        } else if (res.data.error === 'Invalid token' || res.data.error === 'Token过期') {
          // Token无效，清除本地存储并跳转登录
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = null;
          app.globalData.userInfo = null;
          app.globalData.isBind = false;
          reject(new Error(res.data.error));
        } else {
          reject(new Error(res.data.error || 'Request failed'));
        }
      },
      fail: reject
    });
  });
}

module.exports = { login, bind, request };
