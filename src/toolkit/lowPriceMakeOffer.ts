import { OpenSeaSDK, Network } from '../../libs/opensea-js';
import Web3 from 'web3';
import { ethers } from 'ethers';

import BigNumber from 'bignumber.js';

import { createClient, getClient } from '../../libs/reservoir';
import type { ReservoirClientActions, Execute } from '../../libs/reservoir';
import { parseEther } from 'ethers/lib/utils';

import { getEthersWallet, getSeaport, sleep } from './sweepNFT';

// 1、获取地板价
// 2、逐个每个 nft 最高报价
// 执行策略
// 1、高于最高报价 ‘0.0001’ 并且低于地板价百分之三十（界面可预设）创建 makeoffer 订单

// 同步 NFT 信息
// 获取集合的总数量
// 获取集合所有 tokenid

type BidData = Parameters<ReservoirClientActions['placeBid']>['0']['bids'][0];

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // weth 地址
const openseaApiKey = 'f33a8411e29b4f69b1a1c5e431e9e43d';

export const initReservoidClient = () => {
  if (getClient() === undefined) {
    createClient({
      apiBase: 'https://api.reservoir.tools',
      apiKey: '6f38b711-a24d-5905-8623-bac8286b240f',
      source: 'nftonly.app',
    });
  }
};

/**
 * 只能在浏览器中运行，或者在 UI 线程中运行
 * 注意：目前只看 weth 的报价
 * 授权 weth 在外部进行
 * @param addr 合约地址
 * @param tokenid nft id
 */
export const getAssetByOpenSea = async (addr: string, tokenid: string) => {
  const url = `https://api.opensea.io/api/v1/asset/${addr}/${tokenid}/?include_orders=true`;
  const jsonData = await fetch(url, {
    headers: {
      accept: '*/*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'sec-ch-ua':
        '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
    },
    referrer: 'https://opensea.io/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  }).then(res => res.json());

  return jsonData['seaport_sell_orders']
    .filter(
      el =>
        el['side'] === 'bid' &&
        el['protocol_data']['parameters']['offer'][0]['token'] ===
          wethAddress &&
        el['expiration_time'] > (Date.now() / 1000) >> 0
    ) // 过滤 bid 订单
    .map(el => {
      if (el['protocol_data']['parameters']['orderType'] === 3) {
        el['protocol_data']['parameters']['offer'][0]['startAmount'] =
          new BigNumber(
            el['protocol_data']['parameters']['offer'][0]['startAmount']
          )
            .div(2)
            .toPrecision()
            .toString();
      }

      return el;
    })
    .reduce((a, b) => {
      const amountA = new BigNumber(
        a['protocol_data']['parameters']['offer'][0]['startAmount']
      );
      const amountB = new BigNumber(
        b['protocol_data']['parameters']['offer'][0]['startAmount']
      );

      if (amountA.gt(amountB)) {
        return a;
      }

      return b;
    });
};

export const getOfferMaxPrice = async (slug: string) => {
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'X-API-KEY': openseaApiKey },
  };

  const res = await fetch(
    `https://api.opensea.io/v2/offers/collection/${slug}`,
    options
  ).then(response => response.json());

  const maxOfferInfo = {
    offerer: res['offers'][0]['protocol_data']['parameters']['offerer'],
    token: res['offers'][0]['protocol_data']['parameters']['offer'][0]['token'],
    amount:
      res['offers'][0]['protocol_data']['parameters']['offer'][0][
        'startAmount'
      ],
  };

  console.log(maxOfferInfo);

  return maxOfferInfo;
};

export const getFloorPrice = async (slug: string) => {
  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const res = await fetch(
    `https://api.opensea.io/api/v1/collection/${slug}/stats`,
    options
  ).then(response => response.json());

  console.log(res['stats']['floor_price']); // eth

  const floorPrice = ethers.utils
    .parseEther(res['stats']['floor_price'])
    .toString();

  return floorPrice;
};

export const bidCollectionByReservoir = async (
  privateKey: Buffer,
  collection: string,
  price: string,
  endTime: string
) => {
  const wallet = getEthersWallet(privateKey);

  const client = getClient();

  const bid: BidData = {
    collection,
    quantity: 1,
    weiPrice: parseEther(`${price}`).toString(),
    orderbook: 'reservoir',
    orderKind: 'seaport',
    expirationTime: endTime,
  };

  await client.actions.placeBid({
    signer: wallet,
    bids: [bid],
    onProgress: (steps: Execute['steps']) => {
      console.log(steps);
    },
  });
};

export const bidCollectionBySeaport = async (
  privateKey: Buffer,
  collection: string,
  price: string,
  endTime: string
) => {
  const wallet = getEthersWallet(privateKey, 1);

  const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io');

  const openseaSDK = new OpenSeaSDK(wallet, provider, {
    networkName: Network.Main,
    apiKey: openseaApiKey,
  });

  // The offerer's wallet address:
  const accountAddress = await wallet.getAddress();

  const offer = await openseaSDK.createBuyOrder({
    asset: {
      tokenId: '1292',
      tokenAddress: collection,
    },
    quantity: 5,
    expirationTime: endTime,
    accountAddress,
    // Value of the offer, in units of the payment token (or wrapped ETH if none is specified):
    startAmount: price,
  });

  console.log(offer);
};

export const bidCollectionByOpenSea = async (
  privateKey: Buffer,
  collection: string,
  slug: string,
  price: string,
  endTime: string,
  creatorAddress: string,
  creatorFee: number
) => {
  const wallet = getEthersWallet(privateKey, 1);
  const offerer = await wallet.getAddress();

  const quantity = '1';

  const buildOptions = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-KEY': openseaApiKey,
    },
    body: JSON.stringify({
      quantity: quantity,
      criteria: { collection: { slug: slug } },
      offerer: offerer,
    }),
  };

  const response = await fetch(
    'https://api.opensea.io/v2/offers/build',
    buildOptions
  ).then(response => response.json());

  console.log(response);

  await sleep(); // opensea api limit

  const seaport = getSeaport(wallet);

  const counter = await seaport.getCounter(offerer);

  const orderParameters = {
    offerer: offerer,
    offer: [
      {
        itemType: 1,
        token: wethAddress,
        identifierOrCriteria: '0',
        startAmount: parseEther(`${price}`).toString(),
        endAmount: parseEther(`${price}`).toString(),
      },
    ],
    consideration: [
      {
        itemType: 4,
        token: collection,
        identifierOrCriteria: response.partialParameters.consideration[0][
          'identifierOrCriteria'
        ] as string,
        startAmount: quantity,
        endAmount: quantity,
        recipient: offerer,
      },
      {
        itemType: 1,
        token: wethAddress,
        identifierOrCriteria: '0',
        startAmount: parseEther(`${Number(price) * 0.025}`).toString(), // 0.25 opensea fee fixed
        endAmount: parseEther(`${Number(price) * 0.025}`).toString(),
        recipient: '0x0000a26b00c1F0DF003000390027140000fAa719', // opensea fee
      },
      {
        itemType: 1,
        token: wethAddress,
        identifierOrCriteria: '0',
        startAmount: parseEther(`${Number(price) * creatorFee}`).toString(),
        endAmount: parseEther(`${Number(price) * creatorFee}`).toString(),
        recipient: creatorAddress, // creator
      },
    ],
    totalOriginalConsiderationItems: 3,
    startTime: (Date.now() / 1000) >> 0,
    endTime: endTime,
    orderType: 2,
    zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
    zoneHash:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: `0x${Buffer.from(ethers.utils.randomBytes(8))
      .toString('hex')
      .padStart(24, '0')}`,
    conduitKey:
      '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
  };

  console.log(orderParameters);

  const orderSign = await seaport.signOrder(orderParameters, counter, offerer);

  console.log(orderSign);

  orderParameters['counter'] = counter;

  const offerParameters = {
    criteria: { collection: { slug: slug } },
    protocol_data: {
      parameters: orderParameters,
      signature: orderSign,
    },
  };

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-KEY': openseaApiKey,
    },
    body: JSON.stringify(offerParameters),
  };

  await fetch('https://api.opensea.io/v2/offers', options)
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(err => console.error(err));
};

let isStart = false;

/**
 * 暂停 offer
 */
export const offAutoBid = () => {
  isStart = false;
};

/**
 * 开始 offer
 * @param privateKey 私钥
 * @param collection 集合地址
 * @param slug slug
 * @param creatorAddress 创作者地址
 * @param creatorFee 创作者费用
 * @param interval 间隔时间，单位分钟
 * @returns
 */
export const autoBidCollection = async (
  privateKey: Buffer,
  collection: string,
  slug: string,
  creatorAddress: string,
  creatorFee: number,
  interval: number // minute
) => {
  if (isStart) return;
  isStart = true;
  const Bn = ethers.BigNumber;
  const wallet = getEthersWallet(privateKey, 1);
  const offerer = await wallet.getAddress();

  const inc = ethers.utils.parseEther('0.0001');
  const percentage = 30;

  for (;;) {
    if (!isStart) return;
    try {
      const floorPrice = await getFloorPrice(slug);
      const lowerFloorPrice = Bn.from(floorPrice).sub(
        Bn.from(floorPrice).mul(Bn.from(percentage)).div(Bn.from(100))
      );

      await sleep();

      const maxOfferInfo = await getOfferMaxPrice(slug);

      const isWeth =
        maxOfferInfo.token.toLocaleLowerCase() ===
        wethAddress.toLocaleLowerCase();

      const isMaxOfferMe =
        offerer.toLocaleLowerCase() ===
        maxOfferInfo.offerer.toLocaleLowerCase();

      if (isWeth && !isMaxOfferMe) {
        const amount = Bn.from(maxOfferInfo.amount);
        const endTime = ((Date.now() / 1000) >> 0) + 24 * 60 * 60;
        if (amount.add(inc).lte(lowerFloorPrice)) {
          await bidCollectionByOpenSea(
            privateKey,
            collection,
            slug,
            amount.toString(),
            endTime.toString(),
            creatorAddress,
            creatorFee
          );

          console.table({
            slug: slug,
            '本次报价:': amount.toString(),
            '结束时间:': endTime.toString(),
          });
        }
      }
    } catch (err) {
      console.log('本次报价失败');
    }

    await sleep(interval * 60 * 1000);
  }
};
