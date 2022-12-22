import { Seaport } from '@opensea/seaport-js';
import { OPENSEA_CONDUIT_ADDRESS } from '@opensea/seaport-js/lib/constants';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';

import { ethers } from 'ethers';

import type { BytesLike } from 'ethers';
import type { SigningKey } from 'ethers/lib/utils';
import type { ExternallyOwnedAccount } from '@ethersproject/abstract-signer';

import { OpenSeaSDK, Network } from '../../libs/opensea-js';

import Web3 from 'web3';

type IChainId = 1 | 5;

export const chainId: IChainId = 1; // 1 || 5 Goerli, 根据环境变量区分

const infuraApiKey = 'c3b382aba353411385b0d2edf92faf7f';
export const getInfuraProvider = (_chainId = chainId) =>
  new ethers.providers.InfuraProvider(_chainId, infuraApiKey);

export const infuraUrl = {
  1: 'https://mainnet.infura.io',
  5: 'https://goerli.infura.io',
}[chainId];

export type PrivateKeyType = BytesLike | ExternallyOwnedAccount | SigningKey;
export const getEthersWallet = (
  privateKey: PrivateKeyType,
  _chainId = chainId
) => new ethers.Wallet(privateKey, getInfuraProvider(_chainId));

export const getSeaport = (wallet: ethers.Wallet) => new Seaport(wallet);

export const sleep = (t = 500) =>
  new Promise(resolve => setTimeout(resolve, t));

/**
 * 查询授权
 * @param NFTAddress NFT 合约地址
 * @param ownerAddress NFT 拥有者地址
 * @param operatorAddress 操作者地址
 * @returns {boolean} 是否已授权
 *
 */
export const isApprovedForAll = async (
  NFTAddress: string,
  ownerAddress: string,
  operatorAddress: string
) => {
  const ABI = [
    'function isApprovedForAll(address owner, address operator) external view returns (bool)',
  ];

  const infuraProvider = getInfuraProvider();

  const NFTContract = new ethers.Contract(NFTAddress, ABI, infuraProvider);

  const isApproved = (await NFTContract.isApprovedForAll(
    ownerAddress,
    operatorAddress
  )) as boolean;

  return isApproved;
};

/**
 * 授权
 * @param NFTAddress NFT 合约地址
 * @param operatorAddress 操作者地址
 * @param privateKey 私钥
 */
export const setApprovalForAll = async (
  NFTAddress: string,
  operatorAddress: string,
  wallet: ethers.Wallet
) => {
  const ABI = [
    'function setApprovalForAll(address operator, bool _approved) external',
  ];

  const NFTContract = new ethers.Contract(NFTAddress, ABI, wallet);

  const transaction: ethers.ContractTransaction =
    await NFTContract.setApprovalForAll(operatorAddress, true);

  await transaction.wait();

  return transaction;
};

/**
 * 自动授权, 外部主要使用这个方法
 * @param privateKey 私钥
 * @param NFTAddress NFT 合约地址
 * @param operatorAddress 操作者地址
 */
export const autoApprovalForAll = async (
  privateKey: Buffer,
  NFTAddress: string,
  operatorAddress: string = OPENSEA_CONDUIT_ADDRESS
) => {
  const wallet = getEthersWallet(privateKey);

  const ownerAddress = await wallet.getAddress();

  const isApproved = await isApprovedForAll(
    NFTAddress,
    ownerAddress,
    operatorAddress
  );

  console.log('isApprovedForAll>>>', isApproved);

  if (!isApproved) {
    await setApprovalForAll(NFTAddress, operatorAddress, wallet);
  }
};

/**
 * 创建订单
 * @param privateKey 私钥
 * @param NFTAddress NFT 合约地址
 * @param tokenId tokenId
 * @param amount 金额
 */
export const createOrder = async (
  privateKey: Buffer,
  NFTAddress: string,
  tokenId: string,
  amount: string
) => {
  const wallet = getEthersWallet(privateKey);

  const seaport = getSeaport(wallet);

  const offerer = await wallet.getAddress();

  const { executeAllActions } = await seaport.createOrder(
    {
      offer: [
        {
          itemType: 2,
          token: NFTAddress,
          identifier: tokenId,
        },
      ],
      consideration: [
        {
          amount: ethers.utils.parseEther(amount).toString(),
          recipient: offerer,
        },
      ],
      fees: [
        // {
        //   recipient: '0x0000a26b00c1F0DF003000390027140000fAa719', // opensea fee
        //   basisPoints: 250,
        // },
        // {
        //   recipient: '0x09F7901B9Cd59340c09Ae0FCB09903dC47E0A282', // Creator fee
        //   basisPoints: 500,
        // },
      ],
    },
    offerer
  );

  const order = await executeAllActions();

  return order;
};

/**
 * 吃单
 * @param privateKey 私钥
 * @param order 订单
 */
export const fulfillOrder = async (
  privateKey: Buffer,
  order: OrderWithCounter
) => {
  const wallet = getEthersWallet(privateKey);

  const seaport = getSeaport(wallet);

  const fulfiller = await wallet.getAddress();

  const { executeAllActions } = await seaport.fulfillOrder({
    order,
    accountAddress: fulfiller,
  });

  const transaction = await executeAllActions();

  return transaction;
};

/**
 * 对敲, 创建订单后自动成交
 * @param makerPrivateKey 创建订单的私钥
 * @param takerPrivateKey 吃掉订单的私钥
 * @param NFTAddress NFT 合约地址
 * @param tokenId tokenId
 * @param amount 金额
 */
export const automaticTransaction = async (
  makerPrivateKey: Buffer,
  takerPrivateKey: Buffer,
  NFTAddress: string,
  tokenId: string,
  amount: string
) => {
  const order = await createOrder(makerPrivateKey, NFTAddress, tokenId, amount);

  const transaction = await fulfillOrder(takerPrivateKey, order);

  await transaction.wait();

  return transaction;
};

/**
 * 自动成交并检查授权
 * @param makerPrivateKey 创建订单的私钥
 * @param takerPrivateKey 吃掉订单的私钥
 * @param NFTAddress NFT 合约地址
 * @param tokenId tokenId
 * @param amount 金额,ether
 */
export const automaticTransactionAndApproved = async (
  makerPrivateKey: Buffer,
  takerPrivateKey: Buffer,
  NFTAddress: string,
  tokenId: string,
  amount: string
) => {
  await autoApprovalForAll(makerPrivateKey, NFTAddress);

  await sleep(); // sleep

  const transaction = await automaticTransaction(
    makerPrivateKey,
    takerPrivateKey,
    NFTAddress,
    tokenId,
    amount
  );

  console.log(transaction);

  return transaction;
};

/**
 * 自动成交并检查授权，由 opensea-js 提供，魔改 libs/opensea-js 源码
 * @param makerPrivateKey 创建订单的私钥
 * @param takerPrivateKey 吃掉订单的私钥
 * @param NFTAddress NFT 合约地址
 * @param tokenId tokenId
 * @param amount 金额,ether
 */
export const automaticTransactionByOpensea = async (
  makerPrivateKey: Buffer,
  takerPrivateKey: Buffer,
  NFTAddress: string,
  tokenId: string,
  amount: string
) => {
  const makerWallet = getEthersWallet(makerPrivateKey);
  const makerAccount = await makerWallet.getAddress();

  const makerProvider = new Web3.providers.HttpProvider(infuraUrl);

  const makerOpenseaSDK = new OpenSeaSDK(makerWallet, makerProvider, {
    networkName: chainId === 1 ? Network.Main : Network.Goerli,
    apiKey: chainId === 1 ? 'f33a8411e29b4f69b1a1c5e431e9e43d' : undefined,
  });

  let order = null;
  try {
    order = await makerOpenseaSDK.api.getOrder({
      side: 'ask',
      assetContractAddress: NFTAddress,
      tokenId,
    });
  } catch (err) {
    console.log('>>>尝试请求老的订单不存在');

    await sleep(1000);

    const expirationTime = Math.round(Date.now() / 1000 + 60 * 16); // 16 min

    order = await makerOpenseaSDK.createSellOrder({
      asset: {
        tokenId,
        tokenAddress: NFTAddress,
      },
      accountAddress: makerAccount,
      startAmount: amount,
      expirationTime,
    });
  }

  const transaction = await fulfillOrder(takerPrivateKey, order.protocolData);

  await transaction.wait();

  console.log(transaction);

  return transaction;
};
