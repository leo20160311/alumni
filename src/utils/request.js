const qcloud = require('../vendor/wafer2-client-sdk/index')
import server from '../server'
import { promisify } from './util'

const app = getApp()
const regHttp = /^(http[s]{0,1}:\/\/)/

const getUserInfo = () => {
  // 优先从global中读取数据
  const { userInfo } = app.global
  if (userInfo) {
    return Promise.resolve(userInfo)
  }
  const session = qcloud.Session.get()
  if (session) {
    // 如果有session，则使用code登录
    return promisify(qcloud.loginWithCode)()
      .then(res => {
        // 将个人信息存储到global
        app.setConfig({ userInfo: res })
        return res
      })
  } else {
    // 无session情况下的登录
    // 需要先判断是否授权
    return promisify(wx.getSetting)()
      .then(
        ({ authSetting }) => {
          if (authSetting['scope.userInfo']) {
            // 进行登录
            return promisify(qcloud.login)()
              .then(res => {
                // 将个人信息存储到global
                app.setConfig({ userInfo: res })
                return res
              })
          }
          return Promise.reject({
            title: '未进行授权',
            code: -1,
          })
        }, () => {
          return Promise.reject({
            title: '获取授权失败',
            code: -1,
          })
        },
      )
  }
}

const _request = (url, params = {}, others = {}) => {
  const _url = `${regHttp.test(url) ? '' : server.service.baseUrl}${url}`
  return promisify(qcloud.request)({
    url: _url,
    data: params,
    ...others,
  }).then(res => {
    if (res.statusCode === 200) {
      return res.data
    }
    return Promise.reject({
      title: '请求失败',
      code: -1,
    })
  }).then(data => {
    // 特殊说明：qqMap接口返回的status为0时为成功
    if (+data.status === 200 || !data.status) {
      return data
    }
    return Promise.reject({
      title: data.message,
      code: data.status,
    })
  }).catch(err => {
    return Promise.reject(err)
  })
}

const _authRequest = (url, params = {}, others = {}) => {
  return getUserInfo().then(({ openId }) => {
    return _request(url, { openid: openId, ...params }, others)
  }).catch(err => {
    return Promise.reject(err)
  })
}

const get = (url, params = {}, custom = {}) => {
  const { noAuth, ..._others } = custom
  if (noAuth) {
    return _request(url, params, _others)
  }
  return _authRequest(url, params, _others)
}

const post = (url, params = {}, custom = {}) => {
  const { header = {}, noAuth, ...others } = custom
  const _others = {
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      ...header,
    },
    ...others,
  }
  if (noAuth) {
    return _request(url, params, _others)
  }
  return _authRequest(url, params, _others)
}

const getLocation = () => {
  return promisify(wx.getLocation)({
    type: 'wgs84',
  }).then(({ latitude, longitude }) => {
    const _url = `${server.service.qqMapHost}/ws/geocoder/v1/`
    return get(_url, {
      location: `${latitude},${longitude}`,
      key: server.qqMapKey,
    }, { noAuth: true }).then((res) => {
      const { address_component: address } = res.result
      return address.city || address.province || address.nation
    })
  }, () => {
    return Promise.reject({
      title: '获取位置失败',
      code: -1,
    })
  })
}

export default {
  getLocation,
  getUserInfo,
  get,
  post,
}
