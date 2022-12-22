// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { chainId } from '@/toolkit/sweepNFT';

// todo configure
const ReservoirEndpoint =
  chainId === 1
    ? 'https://api.reservoir.tools'
    : 'https://api-goerli.reservoir.tools';

export async function userTokens(
  owner: string,
  contract: string,
  offset: number,
  limit: number
) {
  const rUrl = `${ReservoirEndpoint}/users/${owner}/tokens/v5`;
  return request<API.OwnedTokens>(rUrl, {
    method: 'GET',
    params: {
      contract: contract,
      offset: offset,
      limit: limit,
    },
    // other axios options
    // skipErrorHandler: false, // 当你的某个请求想要跳过错误处理时，可以通过将skipErrorHandler设为 true 来实现
    // getResponse: false, // request 默认返回的是你后端的数据，如果你想要拿到 axios 完整的 response 结构，可以通过传入 { getResponse: true } 来实现。
    // requestInterceptors: [],
    // responseInterceptors: [],
  });
}
