const NOTICE = {
  edited: Symbol('edited'),
  favorited: Symbol('favorited'),
}

App({
  global: {},
  // onLaunch() {
  //   wx.loadFontFace({
  //     family: 'iconfont',
  //     source: 'url("https://at.alicdn.com/t/font_1527314_e7mvie6cm0h.ttf")',
  //     success(res) {
  //       console.log('success:', res.status)
  //     },
  //     fail: function(res) {
  //       console.log('fail:',res.status)
  //     },
  //     complete: function(res) {
  //       console.log('complete:',res.status)
  //     }
  //   });
  // },
  setConfig(conf) {
    Object.assign(this.global, conf)
  },
  /**
   * 设置全局的消息变量
   * @param key
   * @param value 若为undefined，则删除对应键值
   */
  setNotice(key, value) {
    const noticeKey = NOTICE[key]
    if (!noticeKey) {
      return
    }
    if (value === undefined) {
      delete this.global[noticeKey]
      return
    }
    this.setConfig({ [noticeKey]: value })
  },
  /**
   * 根据键值获取对应消息值
   * @param key
   * @returns {*}
   */
  getNotice(key) {
    const noticeKey = NOTICE[key]
    if (!noticeKey) {
      return ''
    }
    return this.global[noticeKey]
  },
  /**
   * 检查键值对应消息值，符合条件则callback并删除对应键值
   * @param key
   * @param value
   * @param callback
   */
  checkNotice(key, value, callback) {
    if (this.getNotice(key) === value) {
      this.setNotice(key)
      typeof callback === 'function' && callback()
    }
  },
})
