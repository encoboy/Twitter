import { NameTableTransaction } from '@/../electronsrc/createTables';

export enum TransactionStatus {
  Sended = 'sended',
  Success = 'success',
  Failed = 'failed',
}

export const TransactionStatusShow = new Map<TransactionStatus, string>([
  [TransactionStatus.Sended, 'sended'],
  [TransactionStatus.Success, 'success'],
  [TransactionStatus.Failed, 'failed'],
]);

export type TransactionItem = {
  id: number;
  tx_hash: string;
  from_addr: string;
  to_addr: string;
  value_wei: string; // ether
  status: TransactionStatus;
  contract: string;
  token_id: string;
  created_at: number;
  updated_at: number;
};

export type TransactionTableItem = {
  key: number;
  tx_hash: string;
  from: string;
  to: string;
  value_ether: string;
  status: string;
  contract: string;
  token_id: string;
  created_at: string;
  updated_at: string;
};

export async function getTransactions(): Promise<{
  err: Error | null;
  result: TransactionItem[] | null;
}> {
  const getAllResult = await SqliteHelper.GetAll(
    'select * from `' + NameTableTransaction + '` order by created_at desc',
  );

  console.log('getAllResult', getAllResult);

  if (getAllResult == null) {
    return { err: new Error('db not connect'), result: null };
  }
  if (getAllResult.err) {
    // console.log(`getAllResult error ${getAllResult.err.message}`);
    return { err: new Error(`getAllResult error ${getAllResult.err.message}`), result: null };
  }

  return { err: null, result: getAllResult.result as TransactionItem[] };
}

export async function getTransactionsForTable(): Promise<{
  err: Error | null;
  tlist: TransactionTableItem[] | null;
}> {
  const getAllResult = await getTransactions();
  if (getAllResult.err) {
    return { err: getAllResult.err, tlist: null };
  }

  const result = getAllResult.result as TransactionItem[];

  const aList = new Array<TransactionTableItem>();
  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    // console.log('addd', item.status, TransactionStatusShow[item.status as TransactionStatus]);
    aList.push({
      key: item.id,
      tx_hash: item.tx_hash,
      from: item.from_addr,
      to: item.to_addr,
      value_ether: item.value_wei,
      // status: TransactionStatusShow[item.status],
      status: item.status,
      contract: item.contract,
      token_id: item.token_id,
      created_at: new Date(item.created_at).toLocaleString(),
      updated_at: new Date(item.updated_at).toLocaleString(),
    });
  }

  return { err: null, tlist: aList };
}

export async function updateTransactionStatus(
  status: TransactionStatus,
  txHash: string,
): Promise<Error | null> {
  const now = new Date().getTime();
  // update
  const _myRunResult = await SqliteHelper.Run(
    'update `' + NameTableTransaction + '` set `status`=?,`updated_at`=? where `tx_hash`=? ',
    status,
    now,
    txHash,
  );
  if (_myRunResult == null) {
    return new Error('db not connect');
  }
  if (_myRunResult.err) {
    return new Error(`update ${NameTableTransaction} error ${_myRunResult.err.message}`);
  }

  return null;
}
