import { request } from '@umijs/max';

/** 获取统计数据 */
export async function gettwitterstatistical(
  body: API.StatisticalParams,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>(
    `api/security/admin/gettwitterstatistical?login_token=${body.login_token}&user_type=${body.user_type}&start_time=1670284800&end_time=1670457600&page=1&limit=10`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    }
  );
}
