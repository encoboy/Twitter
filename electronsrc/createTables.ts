import type { SqliteHelper } from './sqliteHelper';

export const NameTableConfig: string = 'app_config';

export const CreateTableConfig: string = `
CREATE TABLE ${NameTableConfig}(
    conf_key TEXT UNIQUE,
    conf_value TEXT,
    created_at INTEGER,
    updated_at INTEGER
);
`;

export const NameTableAddress: string = 'address';

export const CreateTableAddress: string = `
CREATE TABLE ${NameTableAddress}(
    address TEXT UNIQUE,
    pk_hex TEXT,
    balance_wei TEXT,
    balance_ether DECIMAL(20,10),
    available INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);
`;

export const NameTableContractAddress: string = 'contract_address';

export const CreateTableContractAddress: string = `
CREATE TABLE ${NameTableContractAddress}(
    contract_address TEXT,
    address TEXT,
    token_id TEXT,
    amount INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);
`;

export const NameTableTransaction: string = 'bc_transaction';

export const CreateTableTransaction: string = `
CREATE TABLE ${NameTableTransaction}(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT UNIQUE,
    from_addr TEXT,
    to_addr TEXT,
    value_wei TEXT,
    status INTEGER,
    contract TEXT,
    token_id TEXT,
    created_at INTEGER,
    updated_at INTEGER
);
`;

export const NameTableBalanceTransaction: string = 'bl_transaction';

export const CreateTableBalanceTransaction: string = `
CREATE TABLE ${NameTableBalanceTransaction}(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT UNIQUE,
    created_at INTEGER,
    updated_at INTEGER
);
`;

export async function CreateAllTables(dbHelper: SqliteHelper): Promise<Error | null> {
  // create tables
  const tableResult = await dbHelper.tables();
  if (tableResult == null) {
    return new Error('db is not init');
  }
  if (tableResult.err) {
    return new Error(`table result error ${tableResult.err.message}`);
  }

  const tablesMap = new Map<string, string>();
  tablesMap.set(NameTableAddress, CreateTableAddress);
  tablesMap.set(NameTableContractAddress, CreateTableContractAddress);
  tablesMap.set(NameTableConfig, CreateTableConfig);
  tablesMap.set(NameTableTransaction, CreateTableTransaction);
  tablesMap.set(NameTableBalanceTransaction, CreateTableBalanceTransaction);

  for (const [tableName, createTable] of tablesMap) {
    console.log('tableName', tableName);

    if (!tableResult.result.has(tableName)) {
      const myRunResult = await dbHelper.run(createTable);
      if (myRunResult == null) {
        return new Error('db is not init');
      }
      if (myRunResult.err) {
        return new Error(`CreateTable ${tableName} failed ${myRunResult.err.message}`);
      }

      console.log(`table ${tableName} created ^_^`);
    } else {
      console.log(`table ${tableName} exists`);
    }
  }

  return null;
}
