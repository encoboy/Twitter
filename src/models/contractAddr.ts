import { NameTableContractAddress } from '@/../electronsrc/createTables';
import type { ContractConf } from './contractConf';
import { NFTOper } from '@/toolkit/nftOper';
import { sleep } from '@/toolkit/sweepNFT';

export type ContractAddrItem = {
  contract_address: string;
  address: string;
  token_id: string;
  amount: number;
  created_at: number;
  updated_at: number;
};

export async function getContractAddrs(
  contract: string,
  hasNft: boolean = false,
): Promise<{ err: Error | null; result: ContractAddrItem[] | null }> {
  let getAllResult: GetAllResult | null;
  if (hasNft) {
    getAllResult = await SqliteHelper.GetAll(
      'select * from `' + NameTableContractAddress + '` where `contract_address`=? and amount>0',
      contract,
    );
  } else {
    getAllResult = await SqliteHelper.GetAll(
      'select * from `' + NameTableContractAddress + '` where `contract_address`=?',
      contract,
    );
  }

  if (getAllResult == null) {
    return { err: new Error('db not connect'), result: null };
  }
  if (getAllResult.err) {
    return { err: new Error(`getAllResult error ${getAllResult.err.message}`), result: null };
  }

  return { err: null, result: getAllResult.result as ContractAddrItem[] };
}

export async function saveNftBalance(item: ContractAddrItem): Promise<Error | null> {
  const cAddr = item.contract_address.toLowerCase();
  const oAddr = item.address.toLowerCase();
  // find or create
  const getFirstResult = await SqliteHelper.GetFirst(
    'select * from `' +
      NameTableContractAddress +
      '` where `contract_address`=? and `address`=? and `token_id`=? limit 1',
    cAddr,
    oAddr,
    item.token_id,
  );
  if (!getFirstResult) {
    return new Error('db not connect');
  }
  if (getFirstResult.err) {
    return new Error(`getFirstResult error ${getFirstResult.err.message}`);
  }
  if (!getFirstResult.result) {
    // not exist
    if (item.amount > 0) {
      // insert
      const fields = new Map<string, any>([
        ['contract_address', cAddr],
        ['address', oAddr],
        ['token_id', item.token_id],
        ['amount', item.amount],
        ['created_at', item.created_at],
        ['updated_at', item.updated_at],
      ]);

      const myRunResult = await SqliteHelper.Save(NameTableContractAddress, fields);
      if (myRunResult == null) {
        return new Error('db not connect');
      }
      if (myRunResult.err) {
        return new Error(
          `insert into ${NameTableContractAddress} failed ${myRunResult.err.message}`,
        );
      }
    }
  } else {
    // update
    const _myRunResult = await SqliteHelper.Run(
      'update `' +
        NameTableContractAddress +
        '` set `amount`=?,`updated_at`=? where `contract_address`=? and `address`=? and `token_id`=? ',
      item.amount,
      item.updated_at,
      cAddr,
      oAddr,
      item.token_id,
    );
    console.log(
      'update `' +
        NameTableContractAddress +
        '` set `amount`=?,`updated_at`=? where `contract_address`=? and `address`=? and `token_id`=? ',
      item.amount,
      item.updated_at,
      cAddr,
      oAddr,
      item.token_id,
    );
    if (_myRunResult == null) {
      return new Error('db not connect');
    }
    if (_myRunResult.err) {
      return new Error(`update ${NameTableContractAddress} error ${_myRunResult.err.message}`);
    }
  }

  return null;
}

export async function syncNFTBalance(
  cc: ContractConf,
  addr: string,
  tid: string,
): Promise<Error | null> {
  const nftBalance = await NFTOper.balanceOf(cc.type, cc.address, addr, tid);
  console.log(`(${cc.type}:${cc.address}) balance of ${addr}:${tid} ${nftBalance}`);
  const now = new Date().getTime();
  const ccModel: ContractAddrItem = {
    contract_address: cc.address,
    address: addr,
    token_id: tid,
    amount: nftBalance,
    created_at: now,
    updated_at: now,
  };
  const err = await saveNftBalance(ccModel);
  return err;
}

export async function syncNFTBalance2(
  cc: ContractConf,
  addr: string,
  tid: string,
): Promise<Error | null> {
  const nftBalance = await NFTOper.balanceOf(cc.type, cc.address, addr, tid);

  if (nftBalance < 1) {
    await sleep(10000);
    return await syncNFTBalance2(cc, addr, tid);
  }

  console.log(`(${cc.type}:${cc.address}) balance of ${addr}:${tid} ${nftBalance}`);
  const now = new Date().getTime();
  const ccModel: ContractAddrItem = {
    contract_address: cc.address,
    address: addr,
    token_id: tid,
    amount: nftBalance,
    created_at: now,
    updated_at: now,
  };
  const err = await saveNftBalance(ccModel);
  return err;
}
