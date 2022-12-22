import { sleep } from '@/toolkit/sweepNFT';

const request = async (resource, ops = { timeout: 5000 }) => {
  const { timeout, ...options } = ops;
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });

  clearTimeout(timer);
  return response;
};

export default async function getCurrentGasfee() {
  try {
    const API_SERVER =
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=FH6RAKFJ99V1PZNBBQF376CQ1UN7W3UXKB';
    const response = await request(API_SERVER, { timeout: 15 * 1000 });
    const result = await response.json();

    return result;
  } catch (error) {
    return { ...error, result: {} };
  }
}
