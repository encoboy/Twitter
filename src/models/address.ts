import { NameTableAddress } from '@/../electronsrc/createTables';
import { utils as etherUtils } from 'ethers';
import { getInfuraProvider } from '@/toolkit/sweepNFT';

export type AddrTableListItem = {
  key: number;
  address: string;
  pk_hex: string;
  balance: number;
  nft_num: number;
  available: string;
};

export type AddressItem = {
  address: string;
  pk_hex: string;
  balance_wei: string;
  balance_ether: number;
  available: number;
  created_at: number;
  updated_at: number;
};

export async function getAddresses(
  etherGt: number = -1,
): Promise<{ err: Error | null; result: AddressItem[] | null }> {
  let getAllResult: GetAllResult | null;
  if (etherGt >= 0) {
    getAllResult = await SqliteHelper.GetAll(
      'select * from `' + NameTableAddress + '` where balance_ether>?',
      etherGt,
    );
  } else {
    getAllResult = await SqliteHelper.GetAll('select * from `' + NameTableAddress + '`');
  }
  if (getAllResult == null) {
    return { err: new Error('db not connect'), result: null };
  }
  if (getAllResult.err) {
    return { err: new Error(`getAllResult error ${getAllResult.err.message}`), result: null };
  }
  return { err: null, result: getAllResult.result as AddressItem[] };
}

export async function getAllAddrForTable(): Promise<{
  err: Error | null;
  tlist: AddrTableListItem[] | null;
}> {
  console.log(`getAllAddrFn done`);

  const getAllResult = await getAddresses();
  if (getAllResult.err) {
    return { err: getAllResult.err, tlist: null };
  }

  const result = getAllResult.result as AddressItem[];

  const aList = new Array<AddrTableListItem>();
  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    // let _b = etherUtils.formatEther(item.balance_wei);
    aList.push({
      key: i + 1,
      address: item.address,
      pk_hex: item.pk_hex,
      balance: item.balance_ether,
      nft_num: 0,
      available: item.available == 1 ? 'YES' : 'No',
    });
  }

  return { err: null, tlist: aList };
}

export async function syncAddressBalance(addr: string): Promise<Error | null> {
  const infuraInst = getInfuraProvider();
  const now = new Date().getTime();
  const _wei = await infuraInst.getBalance(addr);
  console.log(`balance of ${addr} ${_wei}`);
  const _ether = parseFloat(etherUtils.formatEther(_wei));
  // update
  const _myRunResult = await SqliteHelper.Run(
    'update `' +
      NameTableAddress +
      '` set `balance_wei`=?,`balance_ether`=?,`updated_at`=? where `address`=? ',
    _wei.toString(),
    _ether,
    now,
    addr,
  );
  if (_myRunResult == null) {
    // showMsgInst.Error("db not connect");
    return new Error('db not connect');
  }
  if (_myRunResult.err) {
    return new Error(`update ${NameTableAddress} error ${_myRunResult.err.message}`);
  }

  return null;
}
