import React, { useEffect, useRef, useState } from 'react';

import { MyProgressBar } from '@/components/MyProgressBar';
import {
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTimePicker,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns, ProFormInstance } from '@ant-design/pro-components';

import { useIntl } from '@umijs/max';
import { Button, Card, Col, Row, Space, Spin, Typography } from 'antd';

import { queryContractConf } from '@/models/contractConf';
import type { ContractConf } from '@/models/contractConf';

import {
  getTransactionsForTable,
  TransactionStatus,
  updateTransactionStatus,
} from '@/models/transaction';
import type { TransactionTableItem } from '@/models/transaction';

import { automaticTransactionAndApproved, getInfuraProvider, sleep } from '@/toolkit/sweepNFT';
// import { Utils } from "@/toolkit";
import { NameTableTransaction } from '@/../electronsrc/createTables';

import { getAddresses, syncAddressBalance } from '@/models/address';
import type { AddressItem } from '@/models/address';

import { getContractAddrs, syncNFTBalance } from '@/models/contractAddr';
import type { ContractAddrItem } from '@/models/contractAddr';

import { BigNumber, utils as etherUtils } from 'ethers';
import { isArray } from 'lodash';

const { Text } = Typography;

/**
 *
 * @param param.contractAddr
 * @param param.tokenId
 * @param param.fromPk
 * @param param.from
 * @param param.toPk
 * @param param.to
 * @param param.value wei
 */
async function MakeLP(param: {
  cc: ContractConf;
  tokenId: string;
  fromPk: string;
  from: string;
  toPk: string;
  to: string;
  value: string;
}): Promise<Error | null> {
  // param.from = Utils.prefix0x(param.from);
  // param.to = Utils.prefix0x(param.to);

  const makeLog = `Make LP ${JSON.stringify(param)}`;
  console.log(makeLog);

  let err: Error | null = null;
  const infuraInst = getInfuraProvider();

  // 1. check balance of from (gas)
  // 2. confirm from hold the NFT at last one
  // 3. check balance of to (gas+value)

  // 4. exec
  const fromPkBuf = Buffer.from(param.fromPk, 'hex');
  const toPkBuf = Buffer.from(param.toPk, 'hex');

  const txInfo = await automaticTransactionAndApproved(
    fromPkBuf,
    toPkBuf,
    param.cc.address,
    param.tokenId,
    param.value,
  );

  // 5. record tx
  const txHash = txInfo.hash.toLowerCase();
  const now = new Date().getTime();
  const fields = new Map<string, any>([
    ['tx_hash', txHash],
    ['from_addr', param.from], // TODO encrypt with passphrase
    ['to_addr', param.to],
    ['value_wei', param.value],
    ['status', TransactionStatus.Sended],
    ['contract', param.cc.address],
    ['token_id', param.tokenId],
    ['created_at', now],
    ['updated_at', 0],
  ]);
  const myRunResult = await SqliteHelper.Save(NameTableTransaction, fields);
  if (myRunResult == null) {
    return new Error('db not connect');
  }
  if (myRunResult.err) {
    return new Error(`insert into ${NameTableTransaction} failed ${myRunResult.err.message}`);
  }

  // 6. loop for query tx until it finish, or exec when tx not found on chain
  for (let i = 0; i < 10; i++) {
    const { _err, _done } = await (async function (): Promise<{
      _err: Error | null;
      _done: boolean;
    }> {
      const receipt = await infuraInst.getTransactionReceipt(txHash);
      if (!receipt) {
        console.log(`tx ${txHash} can not get receipt yet, will retry ${i}`);
        return { _err: null, _done: false };
      }

      let txStatus = TransactionStatus.Failed;
      if (receipt.status === 1) {
        txStatus = TransactionStatus.Success;
      }

      // 7. record tx result
      const _e = await updateTransactionStatus(txStatus, txHash);
      if (_e) {
        return { _err: _e, _done: true };
      }

      return { _err: null, _done: true };
    })();

    if (_err) {
      return _err;
    }

    if (_done) {
      break;
    }

    await sleep(5000); // 5 sec , 10 * 5 sec max 50 sec
  }

  // 8. sync balance of from and update DB
  err = await syncAddressBalance(param.from);
  if (err) {
    return err;
  }

  // 9. sync balance of to and update DB
  err = await syncAddressBalance(param.to);
  if (err) {
    return err;
  }

  // 10. sync NFT hold of from and update DB
  err = await syncNFTBalance(param.cc, param.from, param.tokenId);
  if (err) {
    return err;
  }

  // 11. sync NFT hold of to and update DB
  err = await syncNFTBalance(param.cc, param.to, param.tokenId);
  if (err) {
    return err;
  }

  console.log(makeLog + ' done');

  return null;
}

const LiquidityMaker: React.FC = () => {
  const intl = useIntl();
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(false);
  const [progessPercent, setProgessPercent] = useState(0);
  const [contractConf, setContractConf] = useState<ContractConf>({
    address: '',
    type: '',
  });
  const contractConfRef = useRef<ContractConf>();
  const [txList, setTxList] = useState<TransactionTableItem[]>([]);
  const [makeInfo, setMakeInfo] = useState<string>('');
  const [loopMakeLPTimmer, setLoopMakeLPTimmer] = useState<NodeJS.Timeout>();
  const [getAllTxFnTimmer, setGetAllTxFnTimmer] = useState<NodeJS.Timeout>();

  const getAllTxFn = async function () {
    console.log(`get all tx`);

    const { err, tlist } = await getTransactionsForTable();
    if (err) {
      console.log(`getTransactionsForTable error ${err.message}`);
      return;
    }

    setTxList(tlist as TransactionTableItem[]);
  };

  const getContractConf = async function () {
    const { err, cc } = await queryContractConf();

    if (err) {
      console.log(`queryContractConf error ${err.message}`);
      return;
    }

    setContractConf(cc as ContractConf);
  };

  // cause the Function use state var contractConf to get contract address
  // so it must use useCallback to make the FN change when contract address changes
  const execMakeLP = async (): Promise<Error | null> => {
    const minerGas = parseInt(formRef.current?.getFieldValue('miner-gas') as string);
    if (!minerGas || minerGas <= 0) {
      return new Error(`error miner-gas (${minerGas})`);
    }

    const gasLimit = parseInt(formRef.current?.getFieldValue('gas-limit') as string);
    if (!gasLimit || gasLimit <= 0) {
      return new Error(`error gas-limit (${gasLimit})`);
    }

    const gasCheck = formRef.current?.getFieldValue('gas-check') as boolean;

    const gasMax = parseInt(formRef.current?.getFieldValue('gas-max') as string);
    if (!gasMax || gasMax <= 0) {
      return new Error(`error gas-max (${gasMax})`);
    }

    const autoMakeNum = parseInt(formRef.current?.getFieldValue('auto-make-num') as string);
    if (!autoMakeNum || autoMakeNum <= 0) {
      return new Error(`error auto-make-num (${autoMakeNum})`);
    }

    const autoMakeType = formRef.current?.getFieldValue('auto-make-type') as string;

    const numLimit = parseInt(formRef.current?.getFieldValue('num-limit') as string);
    if (!numLimit || numLimit <= 0) {
      return new Error(`error num-limit (${numLimit})`);
    }

    const basePrice = parseFloat(formRef.current?.getFieldValue('base-price') as string);
    // const basePrice = formRef.current?.getFieldValue('base-price') as number ;
    if (!basePrice || basePrice <= 0) {
      return new Error(`error base-price (${basePrice})`);
    }

    // base price will mul this value/100+1; ex 20 will be price*1.2
    const makeStg = parseInt(formRef.current?.getFieldValue('make-stg') as string);
    if (!makeStg || makeStg < 0 || makeStg > 100) {
      return new Error(`error make-stg (${makeStg})`);
    }

    const makeTime = formRef.current?.getFieldValue('make-time');

    let beginMake = formRef.current?.getFieldValue('begin-make') as boolean;

    if (!contractConfRef.current) {
      return new Error('contract not set');
    }

    const ccType = contractConfRef.current.type;
    const ccAddr = contractConfRef.current.address;

    const infuraInst = getInfuraProvider();
    const bnZero = BigNumber.from(0);
    const gasPriceNow = await infuraInst.getGasPrice(); // wei
    if (!gasPriceNow || gasPriceNow.lte(bnZero)) {
      return new Error(`wrong gasPrice ${gasPriceNow}`);
    }

    // Maker at least has
    // Gas Limit of setApprovalForAll 46,326
    const makerBalanceLimit = parseFloat(
      etherUtils.formatEther(gasPriceNow.mul(Math.floor(46326 * 1.5))),
    );

    let txValueEther = basePrice;
    if (makeStg > 0) {
      const percent = Math.floor((Math.random() * 100000) % makeStg) + 1;
      txValueEther *= percent / 100 + 1;
    }

    // Taker at least has
    // Gas Limit of fulfillBasicOrder 135,007
    // + value
    const takerBalanceLimit =
      txValueEther + parseFloat(etherUtils.formatEther(gasPriceNow.mul(Math.floor(135007 * 1.5))));

    const showMap = new Map<string, any>([
      ['contract-addr', `(${ccType})${ccAddr}`],
      ['miner-gas', minerGas],
      ['gas-limit', gasLimit],
      ['gas-check', gasCheck],
      ['gas-max', gasMax],
      ['auto-make-num', `(${autoMakeType})${autoMakeNum}`],
      ['num-limit', numLimit],
      ['base-price', basePrice],
      ['make-stg', makeStg],
      ['make-time', makeTime],
      ['begin-make', beginMake],
    ]);

    const mmm = makerBalanceLimit.toString();
    const gasPriceGwei = parseFloat(etherUtils.formatUnits(gasPriceNow, 'gwei'));
    let showText = `[${new Date().toLocaleString()}] gasPrice [${gasPriceGwei}(Gwei)] nftPrice[${txValueEther}] balanceLimit [${mmm}, ${takerBalanceLimit} (ether)]`;
    for (const [k, v] of showMap) {
      if (showText.length > 0) {
        showText += ' ';
      }
      const _name = intl.formatMessage({ id: `vg.batch-mint.liquidity-maker.${k}` });
      if (k == 'make-time') {
        const _beginAt = isArray(v) && v.length > 0 ? v[0].toLocaleString() : '-';
        const _endAt = isArray(v) && v.length > 1 ? v[1].toLocaleString() : '-';

        showText += `${_name} [${_beginAt},${_endAt}]`;
      } else {
        showText += `${_name} [${v}]`;
      }
    }

    if (gasCheck && gasMax < gasPriceGwei) {
      showText += ' MSG [gas check open, gas price now greater then gas price limit]';
      beginMake = false;
    }

    setMakeInfo(showText);

    // console.log(`minerGas ${minerGas} gasLimit ${gasLimit} gasCheck ${gasCheck} gasMax ${gasMax} basePrice ${basePrice} beginMake ${beginMake}`);
    // console.log(`makeTime ${makeTime}`,);

    if (!beginMake) {
      return null;
    }

    // get all address which has nft
    const addrHasNft = await getContractAddrs(ccAddr, true);
    if (addrHasNft.err) {
      return addrHasNft.err;
    }
    if (!addrHasNft.result || addrHasNft.result.length == 0) {
      return new Error('addr has nft null');
    }

    // get all maker addresses which ether greater then makerBalanceLimit
    const addrHasValue = await getAddresses(makerBalanceLimit);
    if (addrHasValue.err) {
      return addrHasValue.err;
    }
    if (!addrHasValue.result || addrHasValue.result.length == 0) {
      return new Error('addr has value null');
    }

    // make a mapping of [ address => address info ]
    const addrValueMapper = new Map<string, AddressItem>();
    for (let v of addrHasValue.result) {
      addrValueMapper.set(v.address, v);
    }

    // make list both has nft and balance
    const nftHoldersHasBalance = new Array<ContractAddrItem>();
    for (const item of addrHasNft.result) {
      if (addrValueMapper.has(item.address)) {
        nftHoldersHasBalance.push(item);
      }
    }
    if (nftHoldersHasBalance.length <= 0) {
      console.log('can not find any Holder who has balance');
      return null;
    }

    const nftInfo =
      nftHoldersHasBalance[Math.floor(Math.random() * 100000) % nftHoldersHasBalance.length];
    const fromInfo = addrValueMapper.get(nftInfo.address) as AddressItem;

    const tokenId: string = nftInfo.token_id;
    const fromPk: string = fromInfo.pk_hex;
    const fromAddr: string = fromInfo.address;
    let toPk: string = '';
    let toAddr: string = '';
    const value: string = '0.01'; //etherUtils.parseEther("0.01").toString() // == etherUtils.parseUnits("0.01", "ether");

    // fetch a taker
    const takerHasValue = await getAddresses(takerBalanceLimit);
    if (takerHasValue.err) {
      return takerHasValue.err;
    }
    if (!takerHasValue.result || takerHasValue.result.length == 0) {
      return new Error('taker has value null');
    }

    const takers = new Array<AddressItem>();

    // filtering takers
    for (const item of takerHasValue.result) {
      if (item.address == fromAddr) {
        continue;
      }
      // TODO other conditions

      takers.push(item);
    }
    if (takers.length == 0) {
      return new Error('can not find a taker');
    }

    const taker = takers[Math.floor(Math.random() * 100000) % takers.length];
    toPk = taker.pk_hex;
    toAddr = taker.address;

    return await MakeLP({
      cc: contractConfRef.current,
      tokenId: tokenId,
      fromPk: fromPk,
      from: fromAddr,
      toPk: toPk,
      to: toAddr,
      value: value,
    });
  };

  const loopMakeLP = async () => {
    // console.log('loopMakeLP', new Date().toLocaleString());
    try {
      const err = await execMakeLP();
      if (err) {
        console.error(`execMakeLP error ${err.message}`);
      }
    } catch (e) {
      console.error(`execMakeLP exception`);
      console.error(e);
    }

    setLoopMakeLPTimmer((loopMakeLPTimmer) => {
      clearTimeout(loopMakeLPTimmer);
      return setTimeout(() => {
        loopMakeLP();
      }, 3000);
    });
  };

  // reset timmer handler when the timmer changes
  // and regist cleanup callback
  // it will be invoked, when the component destroy
  useEffect(() => {
    return () => clearTimeout(loopMakeLPTimmer);
  }, [loopMakeLPTimmer]);

  useEffect(() => {
    return () => clearInterval(getAllTxFnTimmer);
  }, [getAllTxFnTimmer]);

  useEffect(() => {
    console.log('init datas');
    getContractConf();
    loopMakeLP();

    getAllTxFn();
    setGetAllTxFnTimmer(() => {
      return setInterval(getAllTxFn, 3000);
    });
  }, []);

  // TODO just for test
  const testMakeLP = async () => {
    // execMakeLP();
    // let balance = await NFTOper.balanceOf('erc721',
    // '0x9c7be9db775d3ff1c67787c4eac29cf46f3ffbfa',
    // '0xbAea55dcB4E21B33197E2714493F8735D8c621dD',
    // '212');
    // console.log(`721 balance ${balance}`);
    // balance = await NFTOper.balanceOf('erc721',
    // '0x9c7be9db775d3ff1c67787c4eac29cf46f3ffbfa',
    // '0xB2262669B7E738Ec6aC9bB0b4D2fB1215743fAB2',
    // '212');
    // console.log(`721 balance 2 ${balance}`);
    // balance = await NFTOper.balanceOf('erc1155',
    //   '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
    //   '0xB2262669B7E738Ec6aC9bB0b4D2fB1215743fAB2',
    //   '80579092352805842563293154043070663051165501619538554390845198387660118304528');
    // console.log(`1155 balance ${balance}`);
    // balance = await NFTOper.balanceOf('erc1155',
    //   '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
    //   '0x20A51c2693f6192040155C19434FaF1D76f80E8c',
    //   '80579092352805842563293154043070663051165501619538554390845198387660118304528');
    // console.log(`1155 balance 2 ${balance}`);
    // balance = await NFTOper.balanceOf('erc11',
    //   '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
    //   '0x20A51c2693f6192040155C19434FaF1D76f80E8c',
    //   '80579092352805842563293154043070663051165501619538554390845198387660118304528');
    // console.log(`erc11 balance 2 ${balance}`);
  };

  const formChange = (values: any) => {
    // console.log(`begin: ${values['make-time-start']}`); // true/false
    // console.log('data type', typeof values['make-time-start']);
  };

  // var contractMsg = useMemo<string>(() => {
  //   if (contractConf.address.length == 0) {
  //     return "-";
  //   }
  //   return `(${contractConf.type})${contractConf.address}`;
  // }, [contractConf])

  useEffect(() => {
    let v = '-';
    if (contractConf.address.length > 0) {
      v = `(${contractConf.type})${contractConf.address}`;
    }
    formRef.current?.setFieldValue('contract-addr', v);
    contractConfRef.current = contractConf;
  }, [contractConf]);

  const processEle = (
    <MyProgressBar
      progressProps={{ percent: progessPercent, size: 'default' }}
      text="progressing, please do not close the window!!"
    />
  );

  const columns: ProColumns<TransactionTableItem>[] = [
    {
      title: 'TX Hash',
      dataIndex: 'tx_hash',
    },
    {
      title: 'Value(Ether)',
      dataIndex: 'value_ether',
    },
    {
      title: 'From',
      dataIndex: 'from',
    },
    {
      title: 'To',
      dataIndex: 'to',
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
    },
  ];

  const spanBegin = 2;
  const spanTwoCol = 7;
  const spanOneCol = 20;
  const gasUnit = 'Gwei';
  const priceUnit = 'Ether';

  const mtStart = new Date();
  mtStart.setHours(10, 0, 0);

  const mtEnd = new Date();
  mtEnd.setHours(11, 0, 0);

  return (
    <PageContainer>
      <Spin tip={processEle} spinning={loading}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <ProForm
            layout="horizontal"
            submitter={false}
            formRef={formRef}
            onValuesChange={formChange}
            initialValues={{
              'contract-addr': '-',
              'miner-gas': 2,
              'gas-limit': 20,
              'gas-check': false,
              'gas-max': 12,
              'auto-make-num': 100,
              'auto-make-type': 'everyday',
              'num-limit': 100,
              'base-price': 0.01,
              'make-stg': 10,
              'make-time': [mtStart, mtEnd],
              'begin-make': false,
            }}
          >
            <Row>
              <Col span={spanBegin} />
              <Col span={spanOneCol}>
                <ProForm.Group>
                  <ProFormText
                    name="contract-addr"
                    width="lg"
                    disabled
                    label={intl.formatMessage({
                      id: 'vg.batch-mint.liquidity-maker.contract-addr',
                    })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormText
                    name="miner-gas"
                    addonAfter={gasUnit}
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.miner-gas' })}
                  />
                </ProForm.Group>
              </Col>
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormText
                    name="gas-limit"
                    addonAfter={gasUnit}
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.gas-limit' })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormSwitch
                    name="gas-check"
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.gas-check' })}
                  />
                </ProForm.Group>
              </Col>
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormText
                    name="gas-max"
                    addonAfter={gasUnit}
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.gas-max' })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormText
                    name="auto-make-num"
                    width={'xs'}
                    label={intl.formatMessage({
                      id: 'vg.batch-mint.liquidity-maker.auto-make-num',
                    })}
                  />
                  <ProFormSelect
                    name="auto-make-type"
                    width={'xs'}
                    valueEnum={{
                      everyday: intl.formatMessage({
                        id: 'vg.batch-mint.liquidity-maker.auto-everyday',
                      }),
                      everyhour: intl.formatMessage({
                        id: 'vg.batch-mint.liquidity-maker.auto-everyhour',
                      }),
                      everymin: intl.formatMessage({
                        id: 'vg.batch-mint.liquidity-maker.auto-everymin',
                      }),
                    }}
                  />
                </ProForm.Group>
              </Col>
              <Col span={spanTwoCol}>
                <ProForm.Group>
                  <ProFormText
                    name="num-limit"
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.num-limit' })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanOneCol}>
                <ProForm.Group>
                  <ProFormText
                    name="base-price"
                    addonAfter={priceUnit}
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.base-price' })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanOneCol}>
                <ProForm.Group>
                  <ProFormText
                    name="make-stg"
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.make-stg' })}
                    addonAfter={intl.formatMessage({
                      id: 'vg.batch-mint.liquidity-maker.make-stg-tip',
                    })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanOneCol}>
                <ProForm.Group>
                  <ProFormTimePicker.RangePicker
                    name="make-time"
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.make-time' })}
                  />
                </ProForm.Group>
              </Col>
            </Row>

            <Row>
              <Col span={spanBegin} />
              <Col span={spanOneCol}>
                <ProForm.Group>
                  <ProFormSwitch
                    name="begin-make"
                    label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.begin-make' })}
                  />
                  <Button onClick={testMakeLP}>test make TP</Button>
                </ProForm.Group>
              </Col>
            </Row>
          </ProForm>

          <Card title="Make Info">
            <Text>{makeInfo}</Text>
          </Card>

          <ProTable<TransactionTableItem>
            search={false}
            dataSource={txList}
            pagination={{
              showQuickJumper: true,
            }}
            columns={columns}
          />
        </Space>
      </Spin>
    </PageContainer>
  );
};

export default LiquidityMaker;
