const sqlite3 = require('sqlite3').verbose();
const utils = require("./utils");

const CreateTableAddress = `
CREATE TABLE address(
    address TEXT UNIQUE,
    pk_hex TEXT,
    balance_wei TEXT,
    available INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);
`;

const CreateTableContractAddress = `
CREATE TABLE contract_address(
    contract_address TEXT,
    address TEXT,
    token_id TEXT,
    amount INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);
`;

const db = new sqlite3.Database("test.sqlite.db")

// db.
function DbRun(dbInst, sql, ...params) {
  return new Promise(function (resolve, reject) {
    const cbfn = function (err) {
      if (err) {
        resolve(err);
        return;
      }
      // 这里不要使用箭头函数，因为要把函数作用域转交给调用者
      console.log(`run result:`, JSON.stringify(this));
      resolve(null);
    };
    dbInst.run(sql, ...params, cbfn);
  });
}

function DbGetAll(dbInst, sql, ...params) {
  return new Promise(function (resolve, reject) {
    dbInst.all(sql, ...params, (err, rows) => {
      if (err) {
        resolve({
          err: err,
          rows: null
        });
        return;
      }
      resolve({
        err: null,
        rows: rows
      });
    });
  });
}

(async () => {
  let { err, rows } = await DbGetAll(db, "select name from sqlite_master where type='table'");
  if (err) {
    console.log(`error: ${err.message}`);
    return;
  }

  let tables = {};

  rows.forEach(element => {
    tables[element.name] = 1;
  });

  console.log(`tables: `, tables);

  if (!tables["address"]) {
    err = await DbRun(db, CreateTableAddress)
    if (err) {
      console.log(`create table address failed ${err.message}`);
      return;
    } else {
      console.log("create table address done");
    }
  } else {
    let now = new Date().getTime();
    let err = await DbRun(db, "insert into address(address, pk_hex, balance_wei, available, created_at, updated_at) values(?, ?, ?, ?, ?, ?)",
      '0x' + now, '0x000' + now, "0.1", 1, now, now)
    if (err) {
      console.log(`insert into address failed ${err.message}`);
      return;
    } else {
      console.log("insert into address done");
    }

    err = await DbRun(db, "update address set pk_hex=? where address=?",
      '0x000' + now, '0x' + now)
    if (err) {
      console.log(`update address failed ${err.message}`);
      return;
    } else {
      console.log("update address done");
    }

    let rows = [];
    ({ err, rows } = await DbGetAll(db, "select * from `address` where `available`=?", 1));
    if (err) {
      console.log(`select * from address error: ${err.message}`);
      return;
    } else {
      console.log(`address records:`);
      rows.forEach(row => {
        console.log(JSON.stringify(row));
      })
    }
  }

  if (!tables["contract_address"]) {
    err = await DbRun(db, CreateTableContractAddress)
    if (err) {
      console.log(`create table contract_address failed ${err.message}`);
      return;
    } else {
      console.log("create table contract_address done");
    }
  }

})()

utils.consoleWaiting();