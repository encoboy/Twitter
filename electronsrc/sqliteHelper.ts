import { Database, RunResult } from "sqlite3";

export interface MyRunResult {
  err: Error | null;
  result: RunResult;
}

/**
 * result is [] empty array if record not found
 */
export interface GetAllResult {
  err: Error | null;
  result: any[];
}

/**
 * result is undefined if record not found
 */
export interface GetFirstResult {
  err: Error | null;
  result: any;
}

export interface GetTableResult {
  err: Error|null;
  result: Map<string,number>;
}

// -- 写一堆这玩意，后来感觉没太有必要，过于约束反而会破环程序的易读性
// export interface AddressResult {
//   address:string;
//   pk_hex:string;
//   balance_wei:string;
//   available:number;
//   created_at:number;
//   updated_at:number;
// }
// export class GetAllTables{
//   result:string[] = new Array<string>();
//   err:Error|null = null;
//   setResult(result: any[]):void{
//     result.forEach(ele=>{
//       this.result.push(ele.name);
//     })
//   }
//   setError(err:Error){
//     this.err = err;
//   }
// }
// export class GetAllAddress{
//   result:AddressResult[] = new Array<AddressResult>();
//   err:Error|null = null;
//   setResult(result: any[]):void{
//     result.forEach(ele=>{
//       this.result.push(ele as AddressResult);
//     })
//   }
//   setError(err:Error){
//     this.err = err;
//   }
// }

export class SqliteHelper {
  private dbInst: Database | null = null;
  private dbPath: string;

  /**
   * 
   * @param dbPath the same with sqlite3
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * init database instance, must invoke before other operation
   * @returns 
   */
  init(): Promise<Error | null> {
    return new Promise((resole) => {
      this.dbInst = new Database(this.dbPath, (err: Error | null) => {
        if (err) {
          resole(err);
          return;
        }
        resole(null);
      })
    })
  }

  /**
   * run a sql
   * @param sql the sql to run
   * @param params bind with sql
   * @returns 
   */
  run(sql: string, ...params: any): Promise<MyRunResult | null> {
    return new Promise((resolve) => {
      if (this.dbInst == null) {
        console.log("db not inst");
        resolve(null);
        return;
      }
      this.dbInst.run(sql, ...params, function (this: RunResult, err: Error | null) {
        resolve({
          err: err,
          result: this
        });
      });
    });
  }

  /**
   * save single item to table
   * @param table the name of the table
   * @param params key is field name, value is the value to save
   * @returns 
   */ 
  async save(table: string, params: Map<string, any>): Promise<MyRunResult | null>{
    let keys = new Array<string>();
    let holders = new Array<string>();
    let values = new Array<any>();
    for (let [k, v] of params) {
      keys.push('`'+k+'`');
      holders.push("?");
      values.push(v)
    }
    let kStr = keys.join(',');
    let hStr = holders.join(',');
    const sql = `insert into ${table}(${kStr}) values(${hStr})`;
    return await this.run(sql, ...values);
  }

  /**
   * batch save items to table
   * @param table the name of the table
   * @param params the array of field=>value 
   * @returns 
   */
  async batchSave(table: string, params: Array<Map<string, any>>): Promise<MyRunResult | null>{
    let keys = new Array<string>();
    let holders = new Array<string>();
    let values = new Array<any>();
    for (let item of params) {
      let pushKeys = false;
      if (keys.length==0){
        pushKeys = true;
      }
      let _hs = new Array<string>();
      for (let [k, v] of item) {
        if (pushKeys){
          keys.push('`'+k+'`');
        }
        _hs.push("?");
        values.push(v)
      }
      holders.push('('+_hs.join(',')+')');
    }

    let kStr = keys.join(',');
    let hStr = holders.join(',');
    const sql = `insert into ${table}(${kStr}) values${hStr}`;
    return await this.run(sql, ...values);
  }
  
  /**
   * get the first queried item, suggest to use 'limit 1', but it is not necessary. 
   * @param sql the sql to query
   * @param params params bind with the sql
   * @returns 
   */
  getFirst(sql: string, ...params: any): Promise<GetFirstResult | null> {
    return new Promise((resolve) => {
      if (this.dbInst == null) {
        console.log("db not inst");
        resolve(null);
        return;
      }
      this.dbInst.get(sql, ...params, (err: Error | null, row: any) => {
        resolve({
          err: err,
          result: row
        });
      });
    });
  }

  /**
   * get all records which matched the where condition. 
   * @param sql the sql to query
   * @param params params bind with the sql
   * @returns 
   */
  getAll(sql: string, ...params: any): Promise<GetAllResult | null> {
    return new Promise((resolve) => {
      if (this.dbInst == null) {
        console.log("db not inst");
        resolve(null);
        return;
      }
      this.dbInst.all(sql, ...params, (err: Error | null, rows: any[]) => {
        resolve({
          err: err,
          result: rows
        });
      });
    });
  }

  tables(): Promise<GetTableResult|null> {
    return new Promise((resolve) => {
      if (this.dbInst == null) {
        console.log("db not inst");
        resolve(null);
        return;
      }
      this.dbInst.all("select name from sqlite_master where type='table'", (err: Error | null, rows: any[]) => {
        let tables = new Map<string,number>();
        rows.forEach(element => {
          tables.set(element.name, 1)
        });
        
        resolve({
          err: err,
          result: tables
        });
      });
    });
  }
}