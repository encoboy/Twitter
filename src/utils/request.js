import { request as req } from 'umi';
import { notification } from 'antd';

const server = 'https://testapi221020.nftonly.app';

const isDev = process.env.NODE_ENV === 'development';

const API = isDev ? '/api' : server;

const openNotification = msg => {
  notification.error({
    message: '请求错误',
    description: msg.toString(),
    duration: null,
  });
};

const fd = data => {
  const formData = new FormData();
  Object.keys(data).map(key => formData.append(key, data[key]));
  return formData;
};

export const request = async (url, options) => {
  try {
    const res = await req(`${API}/${url}`, options);
    if (res?.code !== 200) {
      openNotification(res?.msg);
    }
    return res;
  } catch (e) {
    openNotification(e);
  }
  return undefined;
};

/** 登录接口 POST /index/ctrllogin */
export const login = async data => {
  return request(`index/ctrllogin`, {
    data: fd({ ...data }),
    method: 'POST',
  });
};

/** 获取统计数据 */
export const gettwitterstatistical = async data => {
  return request(`security/admin/gettwitterstatistical`, {
    data: fd({ ...data, login_token: sessionStorage.getItem('adminToken') }),
    method: 'POST',
  });
};
