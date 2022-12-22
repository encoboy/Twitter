import { ethers } from 'ethers';

import type { PrivateKeyType } from '@/toolkit/sweepNFT';

import { chainId, getEthersWallet } from './sweepNFT';
/**
 * 根据环境区分
 * main 主网络
 * Goerli 网络 '0xf5fdc8c2fad9339f9ddc6166113dd55fd2a6e8b3
 */
const contractAddress =
  chainId === 1
    ? '0x6b2066573A2A40e04494003Cf6056D0c1D6a8359'
    : '0xf5fdc8c2fad9339f9ddc6166113dd55fd2a6e8b3';

/**
 * 批量转账
 * @param privateKey 转账私钥
 * @param _to
 * @param _value 转账金额数组，单位为 ETH，例： ['0.1', '0.4', '0.2']
 */
export default async function batchTransferETH(
  privateKey: PrivateKeyType,
  _to: string[],
  _value: string[]
) {
  const ABI = [
    'function transfer(address[] memory recipient, uint256[] memory value) external payable',
  ];

  const wallet = getEthersWallet(privateKey);
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  const weiValue = _value.map(amount =>
    ethers.utils.parseEther(amount).toString()
  );

  const allValue = _value.reduce(
    (previousValue, currentValue) =>
      previousValue.add(ethers.utils.parseEther(currentValue)),
    ethers.utils.parseEther('0')
  );

  const transaction: ethers.ContractTransaction = await contract.transfer(
    _to,
    weiValue,
    {
      value: allValue.toString(),
    }
  );

  await transaction.wait();

  return transaction;
}
