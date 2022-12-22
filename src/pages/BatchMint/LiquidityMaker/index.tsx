import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  Fragment,
  useLayoutEffect,
} from 'react';

import { useMemoizedFn } from 'ahooks';

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
import { Button, Col, Row, Space, Modal, message, Input } from 'antd';
import type { InputRef } from 'antd';

import { queryContractConf } from '@/models/contractConf';
import type { ContractConf } from '@/models/contractConf';

import { syncNFTBalance, syncNFTBalance2 } from '@/models/contractAddr';

import randomNum from '@/toolkit/randomNum';
import decryptKey from '@/toolkit/decryptKey';

import getCurrentGasfee from '@/services/getCurrentGasfee';

// import { userTokens } from '@/services/reservoir-api/api';

import {
  getTransactionsForTable,
  TransactionStatus,
  updateTransactionStatus,
} from '@/models/transaction';
import type { TransactionTableItem } from '@/models/transaction';

import {
  // automaticTransactionAndApproved,
  automaticTransactionByOpensea,
  getInfuraProvider,
  sleep,
} from '@/toolkit/sweepNFT';
// import { Utils } from "@/toolkit";
import { NameTableTransaction } from '@/../electronsrc/createTables';

import { getAddresses, syncAddressBalance } from '@/models/address';
import type { AddressItem } from '@/models/address';

import { getContractAddrs } from '@/models/contractAddr';
import showShortAddress from '@/toolkit/showShortAddress';
// import type { ContractAddrItem } from '@/models/contractAddr';

// import { BigNumber, utils as etherUtils } from 'ethers';

// const { Text } = Typography;
const infuraInst = getInfuraProvider();

const columns: ProColumns<TransactionTableItem>[] = [
  {
    title: 'TX Hash',
    dataIndex: 'tx_hash',
    render: v => (
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://goerli.etherscan.io/tx/${v}`}
      >
        {showShortAddress(v as string)}
      </a>
    ),
  },
  {
    title: 'Value(Ether)',
    dataIndex: 'value_ether',
  },
  {
    title: 'From',
    dataIndex: 'from',
    render: v => (
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://goerli.etherscan.io/address/${v}`}
      >
        {showShortAddress(v as string)}
      </a>
    ),
  },
  {
    title: 'To',
    dataIndex: 'to',
    render: v => (
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://goerli.etherscan.io/address/${v}`}
      >
        {showShortAddress(v as string)}
      </a>
    ),
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

type GasType = {
  FastGasPrice: number;
  ProposeGasPrice: number;
  SafeGasPrice: number;
};

const LiquidityMaker = () => {
  const intl = useIntl();
  const formRef = useRef<ProFormInstance>(null);
  // const [loading, setLoading] = useState('');
  const [code, setCode] = useState('');
  const [contractConf, setContractConf] = useState<ContractConf>({
    address: '',
    type: '',
  });

  const disabled = useMemo(
    () => !contractConf.address || !!code,
    [contractConf.address, code]
  );

  const [txList, setTxList] = useState<TransactionTableItem[]>([]);

  const [gasFee, setgasFee] = useState({
    FastGasPrice: 0,
    ProposeGasPrice: 0,
    SafeGasPrice: 0,
  });

  useEffect(() => {
    const asyncFn = async () => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        message,
        result: { FastGasPrice, ProposeGasPrice, SafeGasPrice },
        status,
      } = await getCurrentGasfee();
      if (message === 'OK' && status === '1') {
        setgasFee({ FastGasPrice, ProposeGasPrice, SafeGasPrice });
      }
    };

    asyncFn();
  }, []);

  useEffect(() => {
    if (!code) {
      formRef.current?.setFieldValue('begin_make', null);
    }
  }, [code]);

  // 获取合约地址
  useEffect(() => {
    const asyncFn = async () => {
      const { err, cc } = await queryContractConf();

      if (err) {
        console.log(`queryContractConf error ${err.message}`);
        return;
      }

      formRef.current?.setFieldValue('contract_addr', cc?.address);
      formRef.current?.setFieldValue('contract_type', cc?.type);
      setContractConf(cc as ContractConf);
    };

    asyncFn();
  }, []);

  const getTxList = useCallback(async () => {
    const { err, tlist } = await getTransactionsForTable();

    if (err) {
      console.log(`queryContractConf error ${err.message}`);
      return;
    }

    setTxList(tlist as TransactionTableItem[]);
  }, []);

  // 获取刷量记录
  useEffect(() => {
    getTxList();
  }, [getTxList]);

  const [getCode, codeDialog] = useCode();

  // 开始刷量
  const handleStart = useCallback(
    async ({ begin_make }: any) => {
      if (!begin_make) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const code = await getCode();
      if (code) {
        setCode(code);
      } else {
        formRef.current?.setFieldValue('begin_make', null);
      }
    },
    [getCode]
  );

  return (
    <PageContainer>
      {codeDialog}
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <ProForm
          layout="horizontal"
          disabled={disabled}
          submitter={false}
          formRef={formRef}
          onValuesChange={handleStart}
          initialValues={{
            contract_addr: '-',
            contract_type: '',
            // 'miner-gas': 2,
            // 'gas-limit': 20,
            gas_check: false,
            gas_max: 12,
            auto_make_num: 0,
            automake_type: 'everyhour',
            num_limit: 100,
            base_price: 0.01,
            float_count: 2,
            make_stg: 10,
            make_time: [
              new Date().setHours(0, 0, 0),
              new Date().setHours(23, 59, 59),
            ],
            begin_make: false,
          }}
        >
          <Row>
            <Col span={1} />
            <Col span={11}>
              <ProFormText
                name="contract_addr"
                width="lg"
                readonly
                label="合约地址"
              />
              <ProFormText
                name="contract_type"
                width="lg"
                readonly
                label="类型"
              />
            </Col>

            <Col>
              <Row>实时 Gasfee:</Row>
              <Row>
                Fast: {gasFee.FastGasPrice} Propose: {gasFee.ProposeGasPrice}{' '}
                Safe: {gasFee.SafeGasPrice}
              </Row>
            </Col>
          </Row>

          {/* <Row>
            <Col span={1} />
            <Col span={11}>
              <ProForm.Group>
                <ProFormText
                  name="miner-gas"
                  addonAfter="Gwei"
                  label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.miner-gas' })}
                />
              </ProForm.Group>
            </Col>
            <Col span={11}>
              <ProForm.Group>
                <ProFormText
                  name="gas-limit"
                  addonAfter="Gwei"
                  label={intl.formatMessage({ id: 'vg.batch-mint.liquidity-maker.gas-limit' })}
                />
              </ProForm.Group>
            </Col>
          </Row> */}

          <Row>
            <Col span={1} />
            <Col span={11}>
              <ProForm.Group>
                <ProFormSwitch
                  name="gas_check"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.gas-check',
                  })}
                />
              </ProForm.Group>
            </Col>
            <Col span={11}>
              <ProForm.Group>
                <ProFormText
                  name="gas_max"
                  addonAfter="Gwei"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.gas-max',
                  })}
                />
              </ProForm.Group>
            </Col>
          </Row>

          <Row>
            <Col span={1} />
            <Col span={11}>
              <ProForm.Group>
                <ProFormText
                  name="auto_make_num"
                  width={'xs'}
                  label="刷单数量"
                />
                <ProFormSelect
                  name="automake_type"
                  width={'xs'}
                  valueEnum={{
                    everyday: intl.formatMessage({
                      id: 'vg.batch-mint.liquidity-maker.auto-everyday',
                    }),
                    everyhour: intl.formatMessage({
                      id: 'vg.batch-mint.liquidity-maker.auto-everyhour',
                    }),
                    // everymin: intl.formatMessage({
                    //   id: 'vg.batch-mint.liquidity-maker.auto-everymin',
                    // }),
                  }}
                />
              </ProForm.Group>
            </Col>
            <Col span={11}>
              <ProForm.Group>
                <ProFormText name="num_limit" label="单日上限" />
              </ProForm.Group>
            </Col>
          </Row>

          <Row>
            <Col span={1} />
            <Col span={11}>
              <ProForm.Group>
                <ProFormText
                  name="base_price"
                  addonAfter="Ether"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.base-price',
                  })}
                />
              </ProForm.Group>
            </Col>
            <Col>
              <ProForm.Group>
                <ProFormText
                  allowClear={false}
                  name="float_count"
                  label="小数点位"
                />
              </ProForm.Group>
            </Col>
          </Row>

          <Row>
            <Col span={1} />
            <Col span={20}>
              <ProForm.Group>
                <ProFormText
                  name="make_stg"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.make-stg',
                  })}
                  addonAfter={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.make-stg-tip',
                  })}
                />
              </ProForm.Group>
            </Col>
          </Row>

          <Row>
            <Col span={1} />
            <Col span={20}>
              <ProForm.Group>
                <ProFormTimePicker.RangePicker
                  name="make_time"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.make-time',
                  })}
                />
              </ProForm.Group>
            </Col>
          </Row>

          <Row>
            <Col span={1} />
            <Col span={20}>
              <ProForm.Group>
                <ProFormSwitch
                  name="begin_make"
                  label={intl.formatMessage({
                    id: 'vg.batch-mint.liquidity-maker.begin-make',
                  })}
                />
                {/* <Button>test make TP</Button> */}
              </ProForm.Group>
            </Col>
          </Row>
        </ProForm>

        <ProTable
          search={false}
          dataSource={txList}
          pagination={{
            showQuickJumper: true,
          }}
          columns={columns}
        />
      </Space>
      {!!code && (
        <ShuaDialog
          onGasChange={setgasFee}
          onCancel={() => setCode('')}
          code={code}
          onRound={getTxList}
          formObj={formRef.current}
        />
      )}
    </PageContainer>
  );
};

export default LiquidityMaker;

const LoadingIcon = () => {
  const [letter, setLetter] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setLetter(v => (v === '...' ? '' : `${v}.`));
    }, 180);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return <span>{letter}</span>;
};

type NFTType = {
  from: string;
  fromAddr: string;
  contractConf: ContractConf;
  token_id: string;
};
type addressType = { to: string; toAddr: string; price: string };
type resultTple = NFTType & addressType;

function createPeiDui(
  NFTs: NFTType[],
  addresses: addressType[],
  result: resultTple[]
): resultTple[] {
  if (NFTs.length) {
    const i = randomNum(0, NFTs.length - 1);
    const addrList = addresses.filter(({ to }) => to !== NFTs[i].from);

    if (addrList.length) {
      const j = randomNum(0, addrList.length - 1);
      const newRes = { ...NFTs[i], ...addrList[j] };

      NFTs.splice(i, 1);

      const addrIndex = addresses.findIndex(({ to }) => to === addrList[j].to);
      addresses.splice(addrIndex, 1);

      return createPeiDui(NFTs, addresses, [...result, newRes]);
    }
  }

  return result;
}

const checkTx = async (txHash: string, param: resultTple) => {
  const { fromAddr, toAddr, token_id, contractConf } = param;
  const receipt = await infuraInst.getTransactionReceipt(txHash);
  if (!receipt) {
    setTimeout(async () => {
      return await checkTx(txHash, param);
    }, 3000);
  }

  const txStatus =
    receipt.status === 1 ? TransactionStatus.Success : TransactionStatus.Failed;

  const updateError = await updateTransactionStatus(txStatus, txHash);

  if (updateError) {
    console.log('updateError', updateError);
  }

  sleep(5000);

  const fromRrr = await syncNFTBalance(contractConf, fromAddr, token_id);
  if (fromRrr) {
    console.log('fromRrr', fromRrr);
  }

  // 11. sync NFT hold of to and update DB
  const toRrr = await syncNFTBalance2(contractConf, toAddr, token_id);
  if (toRrr) {
    console.log('toRrr', toRrr);
  }
};

const trade = async (param: resultTple, passCode: string) =>
  new Promise(async (resolve, reject) => {
    const { from, fromAddr, to, toAddr, token_id, price, contractConf } = param;

    let txInfo;
    try {
      txInfo = await automaticTransactionByOpensea(
        decryptKey(from, passCode) as Buffer,
        decryptKey(to, passCode) as Buffer,
        contractConf.address,
        token_id,
        String(price)
      );
    } catch (e) {
      console.error('e', e);
      return reject(e);
    }

    const txHash = txInfo.hash.toLowerCase();

    const now = new Date().getTime();
    const fields = new Map<string, any>([
      ['tx_hash', txHash],
      ['from_addr', fromAddr], // TODO encrypt with passphrase
      ['to_addr', toAddr],
      ['value_wei', price],
      ['status', TransactionStatus.Sended],
      ['contract', contractConf.address],
      ['token_id', token_id],
      ['created_at', now],
      ['updated_at', 0],
    ]);

    const myRunResult = await SqliteHelper.Save(NameTableTransaction, fields);
    if (myRunResult == null) {
      message.info('db not connect');
      return reject();
    }
    if (myRunResult.err) {
      message.info(
        `insert into ${NameTableTransaction} failed ${myRunResult.err.message}`
      );
      return reject();
    }

    const res = await checkTx(txHash, param);
    resolve(res);
  });

interface ShuaDialogProps {
  code: string;
  formObj: ProFormInstance | null;
  onCancel: () => void;
  onRound: () => void;
  onGasChange: (GasType: GasType) => void;
}

function ShuaDialog({
  code,
  formObj,
  onCancel,
  onGasChange,
  onRound,
}: ShuaDialogProps) {
  const [infotext, setInfotext] = useState([<Fragment key={0} />]);
  const [lastInfoText, setLastInfoText] = useState<React.ReactNode>('刷量开始');
  const [, setoldInfoText] = useState<React.ReactNode>('');

  const [autoMakeNum, setAutoMakeNum] = useState(0);
  const [numLimit, setNumLimit] = useState(0);

  const [contractConf, setContractConf] = useState({ address: '', type: '' });
  const [basePrice, setBasePrice] = useState(0);
  const [floatCount, setFloatCount] = useState(0);
  const [makeStg, setmakeStg] = useState(0);

  const [running, setRunning] = useState(false);

  const [passCode, setPassCode] = useState('');
  const [addressList, setaddressList] = useState<AddressItem[]>([]);

  const [stopTrade, setStopTrade] = useState(false);
  const [closeable, setCloseable] = useState(false);
  const [finishedCount, setFinishedCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(
    Number(localStorage.getItem('daylyCount'))
  );
  const [, setToday] = useState(Number(localStorage.getItem('today')));
  const [thisDay, setThisDay] = useState(new Date().getDate());

  // 验证表单
  useEffect(() => {
    const contractAddr = formObj?.getFieldValue('contract_addr');
    const contractType = formObj?.getFieldValue('contract_type');
    const autoNum = formObj?.getFieldValue('auto_make_num');
    const limitNum = formObj?.getFieldValue('num_limit');

    if (!autoNum) {
      message.error('刷单数量不能为零');
      return onCancel();
    }

    setAutoMakeNum(+autoNum);
    setNumLimit(+limitNum);

    if (contractType !== 'erc721') {
      message.error('contract type should be erc721');
      return onCancel();
    }

    if (!contractAddr) {
      message.error('contract address not found');
      return onCancel();
    }

    setContractConf({ address: contractAddr, type: contractType });

    const price = formObj?.getFieldValue('base_price');

    if (!price) {
      message.error('basePrice not set');
      return onCancel();
    }

    setBasePrice(+price);

    const fCount = formObj?.getFieldValue('float_count');

    if (!fCount) {
      message.error('小数点位未设置');
      return onCancel();
    }

    setFloatCount(+fCount);

    const stg = formObj?.getFieldValue('make_stg');

    setmakeStg(+stg);
  }, [formObj, onCancel]);

  useEffect(() => {
    const makeType = formObj?.getFieldValue('automake_type');
    const h = makeType === 'everyhour' ? 1 : 24;

    const timer = setInterval(() => {
      setFinishedCount(0);
    }, h * 60 * 60 * 1000);

    return () => {
      clearInterval(timer);
    };
  }, [formObj]);

  useEffect(() => {
    setToday(today => {
      if (thisDay !== today) {
        setDailyCount(0);
        localStorage.setItem('today', String(thisDay));
        return thisDay;
      }
      return today;
    });
  }, [thisDay]);

  // 获取地址列表并验证密码
  useEffect(() => {
    if (!code) {
      return;
    }

    const asyncFn = async () => {
      const allAddress = await getAddresses();

      if (allAddress.err) {
        message.error(allAddress.err);
        onCancel();
        return;
      }

      if (allAddress.result === null || !allAddress.result.length) {
        message.error('address not exist');
        onCancel();
        return;
      }

      const secretKey = decryptKey(allAddress.result[0].pk_hex, code);
      if (!secretKey) {
        message.error('密码错误');
        setPassCode('');
        onCancel();
        return;
      }
      setaddressList(allAddress.result);
      setPassCode(code);
    };

    asyncFn();
  }, [code, onCancel]);

  useEffect(() => {
    setoldInfoText(v => {
      setInfotext(info => [...info, <div key={info.length}>{v}</div>]);
      return lastInfoText;
    });
  }, [lastInfoText]);

  useEffect(() => {
    if (stopTrade) {
      setLastInfoText('正在等待完成最后一轮交易');
    }
  }, [stopTrade]);

  const startShua = useMemoizedFn(async (pass: string) => {
    setLastInfoText('正在同步地址余额');

    let netErr = false;
    for (const { address } of addressList || []) {
      try {
        const err = await syncAddressBalance(address);
        if (err) {
          setLastInfoText(err.message);
          netErr = true;
          break;
        }
      } catch (e) {
        setLastInfoText('Network error');
        netErr = true;
        break;
      }
    }

    if (netErr) {
      setLastInfoText('将在五分钟后重试！');
      await sleep(5 * 60 * 1000);
      await startShua(pass);
      return;
    }

    // 设置交易需要的总金额,，基本价格，gas费，消费等 TODO
    const tradeCast = basePrice + 0.01;

    const createPrice = () => {
      const pers = randomNum(0, makeStg);
      const price = +((pers / 100) * basePrice + basePrice).toFixed(floatCount);
      return price;
    };

    // 根据余额列表筛选出余额足够购买的用户列表
    const addresses = addressList
      .filter(
        ({ available, balance_ether }) => available && balance_ether > tradeCast
      )
      .map(({ pk_hex, address }) => ({
        to: pk_hex,
        price: createPrice(),
        toAddr: address,
      }));

    if (!addresses.length) {
      setLastInfoText('余额不足');
      setStopTrade(true);
      return;
    }

    // 获取 NFT 列表
    setLastInfoText('正在获取 NFT 列表');
    const allNFT = await getContractAddrs(contractConf.address, true);

    if (allNFT.err) {
      message.error(allNFT.err);
      setLastInfoText(allNFT.err);
      setStopTrade(true);
      return;
    }

    if (allNFT.result === null || !allNFT.result?.length) {
      message.error('NFT not exist');
      setLastInfoText('NFT not exist');
      setStopTrade(true);
      return;
    }

    const AllNFTList = allNFT.result.map(({ address: fromAddr, token_id }) => {
      const from = addressList.find(
        ({ address: toAddr }) => toAddr === fromAddr
      )?.pk_hex;

      return {
        from,
        fromAddr,
        contractConf,
        token_id,
      };
    });

    const NFTList: {
      from: string;
      fromAddr: string;
      contractConf: ContractConf;
      token_id: string;
    }[] = [];

    // 验证 NFT 列表
    for (const NFT of AllNFTList) {
      const { fromAddr, token_id } = NFT;
      let fromErr;
      try {
        fromErr = await syncNFTBalance(contractConf, fromAddr, token_id);
      } catch (e) {
        fromErr = e;
      }

      if (!fromErr) {
        NFTList.push(NFT);
      } else {
        setLastInfoText(
          <span style={{ color: 'red' }}>
            地址：{showShortAddress(fromAddr)} 上不存在 NFT：{token_id}，请查证
          </span>
        );
      }
    }

    // 生成 NFT/地址对
    setLastInfoText('正在生成 NFT/地址对');

    const peiDuiList = createPeiDui(NFTList, addresses, []);

    if (!peiDuiList.length) {
      message.info('没有可进行的交易');
      setLastInfoText('没有可进行的交易');
      setStopTrade(true);
      return;
    }

    console.log('已生成 NFT/地址对');

    const lengthLimit = Math.min(
      autoMakeNum - finishedCount,
      numLimit - dailyCount
    );

    const result = await Promise.allSettled(
      peiDuiList.slice(0, lengthLimit).map(
        async (tradeItem, index) =>
          new Promise(async (resolve, reject) => {
            await sleep(index * 11 * 1000);

            setLastInfoText(
              <span style={{ color: 'blue' }}>
                开始进行 [from: {showShortAddress(tradeItem.fromAddr)}, to:{' '}
                {showShortAddress(tradeItem.toAddr)}, tokenId:{' '}
                {tradeItem.token_id}] 交易
              </span>
            );
            try {
              const res = await trade(tradeItem, pass);

              setLastInfoText(
                <span style={{ backgroundColor: 'green', color: '#fff' }}>
                  交易 from: {showShortAddress(tradeItem.fromAddr)}, to:{' '}
                  {showShortAddress(tradeItem.toAddr)}, tokenId:{' '}
                  {tradeItem.token_id} 完成
                </span>
              );
              resolve(res);
            } catch (e) {
              setLastInfoText(
                <span style={{ color: 'red' }}>
                  交易 [from: {showShortAddress(tradeItem.fromAddr)}, to:
                  {showShortAddress(tradeItem.toAddr)}, tokenId:{' '}
                  {showShortAddress(tradeItem.token_id)}] 失败
                </span>
              );

              return reject(e);
            }
          })
      )
    );
    const successCount = result.filter(
      ({ status }) => status === 'fulfilled'
    ).length;

    setFinishedCount(v => v + successCount);
    setDailyCount(v => {
      const count = v + successCount;
      localStorage.setItem('daylyCount', String(count));
      return count;
    });
  });

  const asyncGasfee: () => Promise<boolean> = useMemoizedFn(async () => {
    setLastInfoText('正在更新实时 GasFee');
    const {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      message,
      result: { FastGasPrice, ProposeGasPrice, SafeGasPrice },
      status,
    } = await getCurrentGasfee();

    if (closeable) {
      return true;
    }

    if (message === 'OK' && status === '1') {
      onGasChange({ FastGasPrice, ProposeGasPrice, SafeGasPrice });

      const gasCheck = formObj?.getFieldValue('gas_check');
      const gasMax = formObj?.getFieldValue('gas_max');

      if (gasCheck && Number(ProposeGasPrice) > Number(gasMax)) {
        setLastInfoText('GasFee 过高，10 秒后重试');
        await sleep(10 * 1000);
        return await asyncGasfee();
      }
    } else {
      setLastInfoText(
        <span style={{ color: 'red' }}>更新 GasFee 失败，15 秒后重试</span>
      );
      await sleep(15 * 1000);
      return await asyncGasfee();
    }

    return false;
  });

  useEffect(() => {
    if (!passCode) {
      return;
    }

    // 是否正在刷量
    if (running) {
      return;
    }

    if (stopTrade) {
      message.info('刷量停止');
      setLastInfoText('刷量停止');
      setCloseable(true);
      return;
    }

    const makeTime = formObj?.getFieldValue('make_time');
    const nowTime = new Date().getTime();
    let sleepTime = 0;

    // 设置等待开始
    if (makeTime[0] > nowTime) {
      setLastInfoText(
        `未到刷量开始时间，将等待 ${(makeTime[0] - nowTime) / 1000} 秒`
      );
      sleepTime = makeTime[0] - nowTime;
    }

    if (makeTime[1] <= nowTime) {
      setLastInfoText('已到结束时间，静等明天');
      sleepTime = makeTime[0] + 24 * 60 * 60 * 1000;
    }

    if (finishedCount >= autoMakeNum) {
      setLastInfoText('本轮刷单已完成，等待下一轮');
      return;
    }

    if (dailyCount >= numLimit) {
      setLastInfoText('今日已达刷量上限，等待明日');
      return;
    }

    const fn = async () => {
      await sleep(sleepTime);
      const err = await asyncGasfee();
      if (err) {
        return;
      }
      setRunning(true);
      await startShua(passCode);
      onRound();
      setRunning(false);
    };

    setThisDay(new Date().getDate());
    fn();
  }, [
    asyncGasfee,
    autoMakeNum,
    dailyCount,
    finishedCount,
    formObj,
    numLimit,
    onRound,
    passCode,
    running,
    startShua,
    stopTrade,
  ]);

  const handleCancel = useCallback(() => {
    if (closeable) {
      onCancel();
    }
  }, [closeable, onCancel]);

  // useLayoutEffect

  useLayoutEffect(() => {
    let modal = document.querySelector('.ant-modal-content') as HTMLElement;
    let modalHeader = document.querySelector(
      '.ant-modal-header'
    ) as HTMLElement;

    let dragable = false;
    let startPosition = [0, 0];
    let endPosition = [0, 0];

    const dragStart = ({ pageX, pageY }: { pageX: number; pageY: number }) => {
      startPosition = [pageX, pageY];
      dragable = true;
    };

    const dragEnd = ({ pageX, pageY }: { pageX: number; pageY: number }) => {
      dragable = false;
      endPosition = [
        endPosition[0] + pageX - startPosition[0],
        endPosition[1] + pageY - startPosition[1],
      ];
    };

    const handleDrag = ({ pageX, pageY }: { pageX: number; pageY: number }) => {
      if (dragable) {
        const deltaX = pageX - startPosition[0];
        const deltaY = pageY - startPosition[1];

        modal.style.transform = `translate(${deltaX + endPosition[0]}px, ${
          deltaY + endPosition[1]
        }px)`;
      }
    };

    const asyncFn = async () => {
      await sleep(3 * 1000);
      modal = document.querySelector('.ant-modal-content') as HTMLElement;
      modalHeader = document.querySelector('.ant-modal-header') as HTMLElement;

      modalHeader.addEventListener('mousedown', dragStart);
      document.body.addEventListener('mouseup', dragEnd);
      document.body.addEventListener('mousemove', handleDrag);

      modalHeader.style.cursor = 'move';
    };

    asyncFn();

    return () => {
      modalHeader.removeEventListener('mousedown', dragStart);
      document.body.removeEventListener('mouseup', dragEnd);
      document.body.removeEventListener('mousemove', handleDrag);
    };
  }, []);

  return (
    <Modal
      width={680}
      onCancel={handleCancel}
      title="刷量进度"
      open={!!passCode}
      footer=""
    >
      <div>
        <div style={{ padding: 8, fontWeight: 'bold' }}>
          本轮成功交易 {finishedCount}/{autoMakeNum} 次， 今日成功交易{' '}
          {dailyCount}/{numLimit} 次
        </div>
      </div>
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(0,0,0,.1)',
          maxHeight: 400,
          overflowY: 'scroll',
          lineHeight: 1.75,
          fontSize: 14,
          padding: 8,
          display: 'flex',
          flexDirection: 'column-reverse',
        }}
      >
        <div>
          {infotext}
          <div>
            <span>{lastInfoText}</span>
            {closeable || <LoadingIcon />}
          </div>
        </div>
      </div>

      <Button
        disabled={closeable}
        loading={stopTrade && !closeable}
        onClick={() => setStopTrade(true)}
        block
        type="primary"
      >
        停止刷量
      </Button>
    </Modal>
  );
}

export function useCode() {
  const [{ open }, setStatus] = useState({
    open: false,
    canceled: false,
    result: '',
  });

  const inputRef = useRef<InputRef>(null);

  const handleOk = useCallback(() => {
    const result = inputRef.current?.input?.value;
    if (!result) {
      return;
    }

    setStatus(obj => ({ ...obj, result }));
  }, []);

  const promise = useCallback(
    async () =>
      new Promise(resolve => {
        setStatus(obj => ({ ...obj, open: true }));

        const timer = setInterval(() => {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          setStatus(({ open, canceled, result }) => {
            if (result) {
              clearInterval(timer);
              resolve(result);
              return { open: false, canceled: false, result: '' };
            }
            if (canceled) {
              clearInterval(timer);
              resolve(undefined);
              return { open: false, canceled: false, result: '' };
            }

            return { open, canceled, result };
          });
        }, 100);
      }),
    []
  );

  const dialog = (
    <>
      {open && (
        <Modal
          title="确认密码"
          onCancel={() => setStatus(obj => ({ ...obj, canceled: true }))}
          onOk={handleOk}
          open={open}
          centered
        >
          <Input
            ref={inputRef}
            required
            autoFocus
            type="password"
            placeholder="请输入密码"
          />
        </Modal>
      )}
    </>
  );

  return [promise, dialog];
}
