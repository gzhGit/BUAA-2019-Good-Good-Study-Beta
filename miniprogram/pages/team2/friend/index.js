//index.js
const app = getApp()

Page({
  data: {
    friend_code:"aaaa"
  },
  onShow:function () {
    wx.showToast({
      title: '待开发',
      icon: 'loading',
      duration: 3000
    })
  }
})
