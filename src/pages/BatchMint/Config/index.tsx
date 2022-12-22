import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import { useIntl } from '@umijs/max';
import React from 'react';
// import {SqliteHelper} from "../../../../electronsrc/sqliteHelper";
// import {CreateTableAddress} from "../../../../electronsrc/createTables";

const Config: React.FC = () => {
  const intl = useIntl();

  // (async () => {
  //   const dbHelperInst = new SqliteHelper("test333.sqlite.db");
  //   await dbHelperInst.init();
  //   let tableResult = await dbHelperInst.tables();
  //   if (tableResult==null){
  //     return ;
  //   }
  //   if (tableResult.err) {
  //     console.log(`error: ${tableResult.err.message}`);
  //     return;
  //   }

  //   let tables = tableResult.result;

  //   // result.forEach(element => {
  //   //   tables[element.name] = 1;
  //   // });

  //   console.log(`tables: `, tables);

  //   if (!tables.has("address")) {
  //     let myRunResult = await dbHelperInst.run(CreateTableAddress)
  //     if (myRunResult==null){
  //       return ;
  //     }
  //     if (myRunResult.err) {
  //       console.log(`create table address failed ${myRunResult.err.message}`);
  //       return;
  //     } else {
  //       console.log("create table address done");
  //     }
  //   } else {
  //     let now = new Date().getTime();
  //     const fields = new Map<string, any>([
  //       ['address', '0x' + now],
  //       ['pk_hex', '0x000' + now],
  //       ['balance_wei', "0.1"],
  //       ['available', 1],
  //       ['created_at', now],
  //       ['updated_at', now]
  //     ]);

  //     let myRunResult = await dbHelperInst.save("address", fields);
  //     if (myRunResult==null){
  //       return ;
  //     }
  //     if (myRunResult.err) {
  //       console.log(`insert into address failed ${myRunResult.err.message}`);
  //       return;
  //     } else {
  //       console.log("insert into address done", myRunResult.result.changes);
  //     }

  //     let singleRes = await dbHelperInst.getFirst("select * from `address` where address=?", '0x' + now)
  //     if (singleRes==null){
  //       return ;
  //     }
  //     if (singleRes.err) {
  //       console.log(`select * from address error: ${singleRes.err.message}`);
  //       return;
  //     } else {
  //       console.log(`address record 1:`);
  //       console.log(JSON.stringify(singleRes.result));
  //     }

  //     myRunResult = await dbHelperInst.run("update address set pk_hex=? where address=?",
  //       '0x000' + now, '0x' + now)
  //     if (myRunResult==null){
  //       return ;
  //     }
  //     if (myRunResult.err) {
  //       console.log(`update address failed ${myRunResult.err.message}`);
  //       return;
  //     } else {
  //       console.log("update address done", myRunResult.result.changes);
  //     }

  //     let batchFields = new Array();
  //     for (let i=0; i<5; i++) {
  //       batchFields.push(new Map<string, any>([
  //         ['address', '0x' + i + now],
  //         ['pk_hex', '0x000' + i + now],
  //         ['balance_wei', "0.111"],
  //         ['available', 1],
  //         ['created_at', now],
  //         ['updated_at', now]
  //       ]));
  //     }
  //     myRunResult = await dbHelperInst.batchSave('address', batchFields);
  //     if (myRunResult==null){
  //       return ;
  //     }
  //     if (myRunResult.err) {
  //       console.log(`batch insert into address failed ${myRunResult.err.message}`);
  //       return;
  //     } else {
  //       console.log("batch insert into address done", myRunResult.result.changes);
  //     }

  //     let allResult = await dbHelperInst.getAll("select * from `address` where `available`=?", 1);
  //     if (allResult==null){
  //       return ;
  //     }
  //     if (allResult.err) {
  //       console.log(`select * from address error: ${allResult.err.message}`);
  //       return;
  //     } else {
  //       console.log(`address records:`);
  //       allResult.result.forEach(row => {
  //         console.log(JSON.stringify(row));
  //       })
  //     }
  //   }

  // })()

  return (
    <PageContainer
      content={intl.formatMessage({
        id: 'vg.batch-mint.key-admin.tip',
      })}
    >
      <Card> Hello World </Card>
    </PageContainer>
  );
};

export default Config;
