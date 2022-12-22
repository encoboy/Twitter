import {SqliteHelper, MyRunResult} from "./sqliteHelper";

export const dbHelper = new SqliteHelper("vision-gem.sqlite.db");

export function initHandles():Map<string,any>{
    var handles:Map<string,any> = new Map<string,any>();

    handles.set("SqliteHelper:Run", (sql: string, ...params: any) => dbHelper.run(sql, ...params))
    handles.set("SqliteHelper:Save", (table: string, params: Map<string, any>) => dbHelper.save(table, params))
    handles.set("SqliteHelper:GetAll", (sql: string, ...params: any) => dbHelper.getAll(sql, ...params))
    handles.set("SqliteHelper:GetFirst", (sql: string, ...params: any) => dbHelper.getFirst(sql, ...params))

    return handles;
}

// export default handles;