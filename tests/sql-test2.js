const sqliteHelper = require('../electrondist/sqliteHelper');
const createTables = require('../electrondist/createTables');
const utils = require("./utils");

(async () => {
  const dbHelperInst = new sqliteHelper.SqliteHelper("test2.sqlite.db");
  await dbHelperInst.init();
  let { err, result } = await dbHelperInst.getAll("select name from sqlite_master where type='table'");
  if (err) {
    console.log(`error: ${err.message}`);
    return;
  }

  let tables = {};

  result.forEach(element => {
    tables[element.name] = 1;
  });

  console.log(`tables: `, tables);

  if (!tables["address"]) {
    let myRunResult = await dbHelperInst.run(createTables.CreateTableAddress)
    if (myRunResult.err) {
      console.log(`create table address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("create table address done");
    }
  } else {
    let now = new Date().getTime();
    let myRunResult = await dbHelperInst.run("insert into address(address, pk_hex, balance_wei, available, created_at, updated_at) values(?, ?, ?, ?, ?, ?)",
      '0x' + now, '0x000' + now, "0.1", 1, now, now)
    if (myRunResult.err) {
      console.log(`insert into address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("insert into address done", myRunResult.result.changes);
    }

    let singleRes = await dbHelperInst.getFirst("select * from `address` where address=?", '0x' + now)
    if (singleRes.err) {
      console.log(`select * from address error: ${singleRes.err.message}`);
      return;
    } else {
      console.log(`address record 1:`);
      console.log(JSON.stringify(singleRes.result));
    }

    myRunResult = await dbHelperInst.run("update address set pk_hex=? where address=?",
      '0x000' + now, '0x' + now)
    if (myRunResult.err) {
      console.log(`update address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("update address done", myRunResult.result.changes);
    }

    let {err, result} = await dbHelperInst.getAll("select * from `address` where `available`=?", 1);
    if (err) {
      console.log(`select * from address error: ${err.message}`);
      return;
    } else {
      console.log(`address records:`);
      result.forEach(row => {
        console.log(JSON.stringify(row));
      })
    }
  }

  if (!tables["contract_address"]) {
    let myRunResult = await dbHelperInst.run(createTables.CreateTableContractAddress)
    if (myRunResult.err) {
      console.log(`create table contract_address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("create table contract_address done");
    }
  }

})()

utils.consoleWaiting();