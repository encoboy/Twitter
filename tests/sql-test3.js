const sqliteHelper = require('../electrondist/sqliteHelper');
const createTables = require('../electrondist/createTables');
const utils = require("./utils");

(async () => {
  const dbHelperInst = new sqliteHelper.SqliteHelper("test3.sqlite.db");
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
    const fields = new Map([
      ['address', '0x' + now],
      ['pk_hex', '0x000' + now],
      ['balance_wei', "0.1"],
      ['available', 1],
      ['created_at', now],
      ['updated_at', now]
    ]);
    
    let myRunResult = await dbHelperInst.save("address", fields);
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
      console.log(JSON.stringify(singleRes));
      console.log(JSON.stringify(singleRes.result));
    }

    // singleRes = await dbHelperInst.getFirst("select * from `address` where address=?", '0x' + now+'1111')
    // if (singleRes.err) {
    //   console.log(`select * from address error: ${singleRes.err.message}`);
    //   return;
    // } else {
    //   // not exist
    //   console.log(`address record 2:`);
    //   console.log(JSON.stringify(singleRes));
    //   console.log(JSON.stringify(singleRes.result));
    // }

    myRunResult = await dbHelperInst.run("update address set pk_hex=? where address=?",
      '0x000' + now, '0x' + now)
    if (myRunResult.err) {
      console.log(`update address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("update address done", myRunResult.result.changes);
    }

    let batchFields = new Array();
    for (let i=0; i<5; i++) {
      batchFields.push(new Map([
        ['address', '0x' + i + now],
        ['pk_hex', '0x000' + i + now],
        ['balance_wei', "0.111"],
        ['available', 1],
        ['created_at', now],
        ['updated_at', now]
      ]));
    }
    myRunResult = await dbHelperInst.batchSave('address', batchFields)
    if (myRunResult.err) {
      console.log(`batch insert into address failed ${myRunResult.err.message}`);
      return;
    } else {
      console.log("batch insert into address done", myRunResult.result.changes);
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


    let rrr = await dbHelperInst.getAll("select * from `address` where `available`=?", 100);
    err = rrr.err;
    result = rrr.result;
    if (err) {
      console.log(`select * from address error: ${err.message}`);
      return;
    } else {
      console.log(`address records:`);
      console.log(result);
      // result.forEach(row => {
      //   console.log(JSON.stringify(row));
      // })
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