import * as R from '../../utils/ramda/index'
import { promisifyWxApi } from '../../utils/util'
import request from '../../utils/request'
import wxUtil from '../../utils/wxUtil'
import { DEGREE_TYPE, GENDER_TYPE } from '../../macro'

Page({
  data: {
    isShowAuthModal: false,
    degreeSelect: DEGREE_TYPE,
    genderSelect: GENDER_TYPE,
    basic: {},
    education: {},
    work: {},
  },
  onLoad() {
    request.getUserInfo().then(userInfo => {
      this.setData({
        basic: {
          head_url: userInfo.avatarUrl,
          gender: R.findIndex(R.propEq('id', userInfo.gender))(GENDER_TYPE),
        },
      })
    }, () => {
      // 未授权，显示授权弹窗
      this.setData({
        isShowAuthModal: true,
      })
    })
  },
  handleClickAvatar() {
    promisifyWxApi(wx.chooseImage)({
      count: 1,
    }).then(res => {
      this.setData({
        'basic.head_url': res.tempFilePaths.pop(),
      })
    })
  },
  // 定位
  handleLocation() {
    request.getLocation().then(res => {
      this.setData({ 'basic.city': res })
    })
  },
  handleInputChange(e) {
    const { name } = e.currentTarget.dataset
    this.setData({
      [name]: e.detail.value,
    })
  },
  handleSave() {
    let { basic, education, work } = this.data
    // 处理gender
    const gender = GENDER_TYPE[basic.gender] || {}
    basic = R.assoc('gender', gender.id || 0, basic)

    // 处理degree
    const degree = DEGREE_TYPE[education.background] || {}
    education = R.assoc('background', degree.id || 0, education)
    // 提交数据
    request.getUserInfo().then(({ openId }) => {
      const saveBasic = request.post('/edit/editbase', {
        openid: openId,
        ...basic,
      })
      const saveEducation = request.post('/edit/addeducation', {
        openid: openId,
        ...education,
      })
      const saveWork = request.post('/edit/addwork', {
        openid: openId,
        ...work,
      })
      Promise.all([saveBasic, saveEducation, saveWork]).then(() => {
        wxUtil.showToast('保存成功', 'success').then(() => {
          wxUtil.navigateTo('mine', {}, 'all')
        })
      }, () => {
        wxUtil.showToast('请重试')
      })
    }, () => {})
  },
  handleCloseAuthModal() {
    // 关闭弹窗
    this.setData({
      isShowAuthModal: false,
    })
  },
  handleAuth(e) {
    const { event } = e.detail
    const { userInfo } = event.detail
    this.setData({
      basic: {
        head_url: userInfo.avatarUrl,
        gender: R.findIndex(R.propEq('id', userInfo.gender))(GENDER_TYPE),
      },
      isShowAuthModal: false,
    })
  },
})
