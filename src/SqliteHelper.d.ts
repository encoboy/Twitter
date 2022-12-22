interface MyRunResult {
  err: Error | null;
  result: RunResult;
}

interface GetAllResult {
  err: Error | null;
  result: any[];
}

interface GetFirstResult {
  err: Error | null;
  result: any;
}

interface GetTableResult {
  err: Error | null;
  result: Map<string, number>;
}

class SqliteHelper {
  static Run(sql: string, ...params: any): Promise<MyRunResult | null>;
  static Save(table: string, params: Map<string, any>): Promise<MyRunResult | null>;
  static GetAll(sql: string, ...params: any): Promise<GetAllResult | null>;
  static GetFirst(sql: string, ...params: any): Promise<GetFirstResult | null>;
}
