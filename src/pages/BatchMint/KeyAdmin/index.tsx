import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  PageContainer,
  ProTable,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';

import {
  Button,
  Space,
  Col,
  Row,
  Modal,
  Spin,
  Typography,
  Input,
  message,
  Form,
  Select,
} from 'antd';

import { useIntl } from '@umijs/max';

import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';

import BigNumber from 'bignumber.js';

import batchTransferETH from '@/toolkit/batchTransferETH';

import { HDWallet } from '@/toolkit/HDWallet';
import {
  NameTableAddress,
  NameTableContractAddress,
  NameTableConfig,
  NameTableBalanceTransaction,
} from '@/../electronsrc/createTables';
import { ConfigKeys } from '@/toolkit/consts';
import { MyProgressBar } from '@/components/MyProgressBar';
import { userTokens } from '@/services/reservoir-api/api';
import { getAllAddrForTable, syncAddressBalance } from '@/models/address';
import type { AddrTableListItem } from '@/models/address';
import { queryContractConf } from '@/models/contractConf';
import type { ContractConf } from '@/models/contractConf';

const { Text } = Typography;

const { TextArea, Password } = Input;

const columns = [
  {
    title: 'Index',
    dataIndex: 'key',
  },
  {
    title: 'Address',
    dataIndex: 'address',
  },
  {
    title: 'Balance(Ether)',
    dataIndex: 'balance',
  },
  {
    title: 'NFT Amount',
    dataIndex: 'nft_num',
  },
  {
    title: 'Available',
    dataIndex: 'available',
  },
];

const KeyAdmin = () => {
  const intl = useIntl();
  const [membModalStatus, setMembModalStatus] = useState(false);
  const [contractModalStatus, setContractModalStatus] = useState(false);

  const [addrList, setAddrList] = useState<AddrTableListItem[]>([]);

  const [balanceAmountModalStatus, setBalanceAmountModalStatus] =
    useState(false);
  const [minBalance, setMinBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [progessPercent, setProgessPercent] = useState(0);
  const [contractConf, setContractConf] = useState({
    address: '',
    type: '',
  });

  const [, setAddressCount] = useState(20);

  const contractMsg = contractConf.address.length
    ? `(${contractConf.type})${contractConf.address}`
    : 'contract not set';

  const [queryAddr, setQueryAddr] = useState('');

  const addrResult = useMemo(
    () =>
      queryAddr
        ? addrList.filter(({ address }) => address.indexOf(queryAddr) !== -1)
        : addrList,
    [addrList, queryAddr]
  );

  const handleQueryAddr = useCallback(({ target }) => {
    setQueryAddr(target.value);
  }, []);

  const getContractConf = useCallback(async () => {
    const { err, cc } = await queryContractConf();

    if (err) {
      message.error(`queryContractConf error ${err.message}`);
      console.log(`queryContractConf error ${err.message}`);
      return;
    }

    setContractConf(cc as ContractConf);
  }, []);

  const getNftNumber = useCallback(async () => {
    if (contractConf.address.length == 0) {
      return;
    }

    const getAllResult: {
      err: null | string;
      result: { address: string; amount: number }[];
    } = {
      err: null,
      result: [],
    };

    const results = await SqliteHelper.GetAll(
      'select `address`,amount from `' +
        NameTableContractAddress +
        '` where `contract_address`=?',
      contractConf.address
    );

    if (results == null) {
      return;
    }
    if (results.err) {
      console.log(`getAllResult error ${results.err.message}`);
      return;
    }

    results.result.forEach(result => {
      const item = getAllResult.result.find(
        ({ address: addr }) => addr === result.address
      );
      if (item) {
        item.amount += result.amount;
      } else {
        getAllResult.result.push(result);
      }
    });

    const nftAmountMap = new Map<string, number>();
    for (const item of getAllResult.result) {
      nftAmountMap.set(item.address, item.amount);
    }

    setAddrList(list =>
      list.map(item => ({
        ...item,
        nft_num: nftAmountMap.has(item.address)
          ? (nftAmountMap.get(item.address) as number)
          : 0,
      }))
    );
  }, [contractConf.address]);

  const getAllAddrCallback = useCallback(async () => {
    const { err, tlist } = await getAllAddrForTable();

    if (err) {
      message.error(`getAllAddrForTable error ${err.message}`);
      return;
    }

    setAddrList(tlist as AddrTableListItem[]);
  }, []);

  useEffect(() => {
    const aysncFn = async () => {
      await getContractConf();
      await getAllAddrCallback();
      getNftNumber();
    };

    aysncFn();
  }, [getAllAddrCallback, getContractConf, getNftNumber]);

  const handleLoadFinish = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (addressCount: number) => {
      message.success('导入成功！');
      getAllAddrCallback();
      setAddressCount(addressCount);
      setMembModalStatus(false);
    },
    [getAllAddrCallback]
  );

  const handleSetContractFinish = useCallback(() => {
    message.success('设置成功！');
    getContractConf();
    setContractModalStatus(false);
  }, [getContractConf]);

  /** sync address balance */
  const syncAddrBalance = useCallback(async () => {
    setLoading(true);
    setProgessPercent(0);

    const getAllResult = await SqliteHelper.GetAll(
      'select * from `' + NameTableAddress + '`'
    );
    if (getAllResult == null) {
      message.error('db not connect');
      setLoading(false);
      return;
    }
    if (getAllResult.err) {
      message.error(`getAllResult error ${getAllResult.err.message}`);
      setLoading(false);
      return;
    }

    message.info('begin sync balance');

    const { result } = getAllResult;

    for (let i = 0; i < result.length; i++) {
      const item = result[i];

      let err;
      try {
        err = await syncAddressBalance(item.address);
        if (err) {
          message.error(err.message);
        }
      } catch (e) {
        err = e;
        message.error('Network error');
        console.log(e);
      }

      if (err) {
        setLoading(false);
        return;
      }

      const _percent =
        (((i + 2) / (getAllResult.result.length + 1)) * 100) >> 0;

      setProgessPercent(_percent);
    }

    message.success('sync balance done');

    setProgessPercent(100);
    setLoading(false);

    getAllAddrCallback();
  }, [getAllAddrCallback]);

  const saveNFTDetail = useCallback(
    async (tokens, address) => {
      const now = new Date().getTime();

      for (const ownedToken of tokens) {
        const fields = new Map<string, any>([
          ['contract_address', contractConf.address],
          ['address', address],
          ['token_id', ownedToken.token.tokenId],
          ['amount', ownedToken.ownership.tokenCount],
          ['created_at', now],
          ['updated_at', now],
        ]);

        const saveResult = await SqliteHelper.Save(
          NameTableContractAddress,
          fields
        );
        if (saveResult == null) {
          message.error('db not connect');
          continue;
        }
        if (saveResult.err) {
          message.error(
            `insert into ${NameTableContractAddress} failed ${saveResult.err.message}`
          );
          continue;
        }
      }
    },
    [contractConf]
  );

  /** sync NFT balance */
  const syncNFTBalance = useCallback(async () => {
    setProgessPercent(0);

    const dropResult = await SqliteHelper.Run(
      'delete from `' +
        NameTableContractAddress +
        '` where `contract_address`=?',
      contractConf.address
    );
    if (dropResult == null) {
      message.error('db not connect');
      return;
    }
    if (dropResult.err) {
      message.error(
        `empty all contract address failed ${dropResult.err.message}`
      );
      return;
    }

    // await (async () => {
    const getAllResult = await SqliteHelper.GetAll(
      'select * from `' + NameTableAddress + '`'
    );
    if (getAllResult == null) {
      message.error('db not connect');
      return;
    }
    if (getAllResult.err) {
      message.error(`getAllResult error ${getAllResult.err.message}`);
      return;
    }

    const pageLimit = 20;

    for (const { address } of getAllResult.result) {
      //
      for (let j = 0; j < 100; j++) {
        try {
          const result = await userTokens(
            address,
            contractConf.address,
            j * pageLimit,
            pageLimit
          );

          await saveNFTDetail(result.tokens, address);

          if (result.tokens.length < pageLimit) {
            break;
          }
        } catch (e) {
          message.error('Network error');
          console.error(e);
          break;
        }
      }

      setProgessPercent(
        (v: number) => (v + (1 / getAllResult.result.length) * 100) >> 0
      );
    }

    message.success('sync NFT done');

    getNftNumber();

    setProgessPercent(100);
  }, [contractConf, saveNFTDetail, getNftNumber]);

  const handleBalanceAvailableAmount = useCallback(
    async passwd => {
      const addressList = [...addrList];
      addressList.sort((a, b) => b.balance - a.balance);

      const bytes = AES.decrypt(addressList[0].pk_hex, passwd);
      const key = bytes.toString(CryptoJS.enc.Utf8);

      if (!key) {
        message.error('Wrong password, try again');
        return;
      }

      let bossMoney = addressList[0].balance;

      if (!bossMoney) {
        message.error('余额未同步！');
        return;
      }

      const addList: string[] = [];
      const balanceList: string[] = [];

      addressList.forEach(({ balance, address }) => {
        if (balance < minBalance) {
          const moneyNeed = Number(
            new BigNumber(minBalance).minus(balance).toString()
          );

          if (
            bossMoney >
            Number(
              new BigNumber(minBalance).plus(moneyNeed).plus(0.02).toString()
            )
          ) {
            bossMoney = Number(
              new BigNumber(bossMoney).minus(moneyNeed).toString()
            );
            addList.push(address);
            balanceList.push(moneyNeed.toFixed(18));
          }
        }
      });

      if (!addList.length || !balanceList.length) {
        message.error('余额不足，请充值～');
        return;
      }

      try {
        const { hash } = await batchTransferETH(
          Buffer.from(key, 'hex'),
          addList,
          balanceList
        );

        const now = new Date().getTime();

        const fields = new Map<string, any>([
          ['tx_hash', hash],
          ['created_at', now],
          ['updated_at', now],
        ]);

        const saveTxResult = await SqliteHelper.Save(
          NameTableBalanceTransaction,
          fields
        );

        if (saveTxResult === null) {
          message.error('Fail!');
        } else if (saveTxResult.err) {
          message.error(
            `insert into ${NameTableBalanceTransaction} failed ${saveTxResult.err.message}`
          );
        } else {
          message.success('Success!');
        }

        setBalanceAmountModalStatus(false);
        return await syncAddrBalance();
      } catch (e) {
        console.log('Fail', e);
        message.error('Fail!');
      }
    },
    [addrList, minBalance, syncAddrBalance]
  );

  const processEle = (
    <MyProgressBar
      progressProps={{ percent: progessPercent, size: 'default' }}
      text="progressing, please do not close the window!!"
    />
  );

  return (
    <PageContainer>
      <Spin tip={processEle} spinning={loading}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <ProForm layout="horizontal" submitter={false}>
            <Form.Item
              style={{ width: 500 }}
              label={intl.formatMessage({
                id: 'vg.batch-mint.key-admin.query-addr',
              })}
            >
              <Input
                placeholder="请输入地址"
                name="query-addr"
                allowClear
                onChange={handleQueryAddr}
              />
            </Form.Item>
          </ProForm>

          <ProForm
            onFinish={async ({ min_balance }) => {
              setBalanceAmountModalStatus(true);
              setMinBalance(+min_balance);
            }}
            layout="horizontal"
            submitter={false}
          >
            <ProForm.Group>
              <ProFormText
                name="min_balance"
                label={intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.lowest-balance',
                })}
                rules={[{ required: true, message: 'required!' }]}
                addonAfter={intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.lowest-balance.info',
                })}
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProFormText
                name="rand-config"
                label={intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.rand-conf',
                })}
                addonAfter={intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.rand-conf.info',
                })}
              />
            </ProForm.Group>

            <ProForm.Group>
              <Button type="primary" disabled>
                {intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.rand-chose-addr',
                })}
              </Button>
              <Button
                disabled={!addrList.length}
                type="primary"
                htmlType="submit"
                // onClick={() => setBalanceAmountModalStatus(true)}
              >
                {intl.formatMessage({
                  id: 'vg.batch-mint.key-admin.balance-addr-balance',
                })}
              </Button>
            </ProForm.Group>
          </ProForm>

          <Row>
            <Col span={12}>
              <Space>
                <Button type="primary" onClick={() => setMembModalStatus(true)}>
                  +{' '}
                  {intl.formatMessage({
                    id: 'vg.batch-mint.key-admin.import-mem',
                  })}
                </Button>
                <Button
                  type="primary"
                  onClick={syncAddrBalance}
                  disabled={!addrList.length}
                >
                  {intl.formatMessage({
                    id: 'vg.batch-mint.key-admin.sync-balance',
                  })}
                </Button>
                <Button type="primary" disabled={!addrList.length}>
                  {intl.formatMessage({
                    id: 'vg.batch-mint.key-admin.download-addr',
                  })}
                </Button>
              </Space>
            </Col>
            <Col span={12}>
              <Space style={{ float: 'right' }}>
                <Text>{contractMsg}</Text>
                <Button
                  type="primary"
                  onClick={() => setContractModalStatus(true)}
                >
                  {intl.formatMessage({
                    id: 'vg.batch-mint.key-admin.set-contract',
                  })}
                </Button>
                <Button
                  type="primary"
                  disabled={!contractConf.address.length || !addrList.length}
                  onClick={async () => {
                    setLoading(true);
                    await syncNFTBalance();
                    setLoading(false);
                  }}
                >
                  {intl.formatMessage({
                    id: 'vg.batch-mint.key-admin.sync-contract',
                  })}
                </Button>
              </Space>
            </Col>
          </Row>

          <ProTable
            search={false}
            dataSource={addrResult}
            pagination={{
              showQuickJumper: true,
            }}
            columns={columns}
          />
        </Space>
      </Spin>

      <LoadMembModal
        onConfirm={handleLoadFinish}
        open={membModalStatus}
        onCancel={() => setMembModalStatus(false)}
      />
      <SetContractModal
        open={contractModalStatus}
        onConfirm={handleSetContractFinish}
        onCancel={() => setContractModalStatus(false)}
      />

      <BalanceAmountModal
        open={balanceAmountModalStatus}
        onConfirm={handleBalanceAvailableAmount}
        onCancel={() => setBalanceAmountModalStatus(false)}
      />
    </PageContainer>
  );
};

export default KeyAdmin;

const useImportMem = (
  memText: string,
  password: string,
  addressCount: number
) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [finish, setFinish] = useState(false);

  useEffect(() => {
    if (!memText || !password) {
      return;
    }

    setLoading(true);

    const fn = async () => {
      const deleteAddressResult = await SqliteHelper.Run(
        'delete from ' + NameTableAddress
      );

      if (deleteAddressResult == null) {
        setError('db not connect');
        setLoading(false);
        return;
      }
      if (deleteAddressResult.err) {
        setError(`empty all address failed ${deleteAddressResult.err.message}`);
        setLoading(false);
        return;
      }

      const wallet: HDWallet = new HDWallet();
      wallet.initByMnemonic(memText);

      const now = new Date().getTime();

      for (let i = 0; i < addressCount; i++) {
        const _w = wallet.getWallet(i);

        const pkHex = AES.encrypt(
          _w.getPrivateKey().toString('hex'),
          password
        ).toString();

        const fields = new Map<string, any>([
          ['address', _w.getAddress().toLowerCase()],
          ['pk_hex', pkHex],
          ['balance_wei', '0'],
          ['available', 1],
          ['created_at', now],
          ['updated_at', now],
        ]);

        const saveAddressResult = await SqliteHelper.Save(
          NameTableAddress,
          fields
        );

        if (saveAddressResult == null) {
          setError('db not connect');
          continue;
        }
        if (saveAddressResult.err) {
          setError(
            `insert into ${NameTableAddress} failed ${saveAddressResult.err.message}`
          );
          continue;
        }
      }

      setLoading(false);
      setFinish(true);
    };

    fn();
  }, [addressCount, memText, password]);

  return { loading, error, finish };
};

interface ModalProps {
  open?: boolean;
  onConfirm: (v: number) => void;
  onCancel: () => void;
}

function LoadMembModal({ open, onConfirm, onCancel }: ModalProps) {
  const [membStr, setMembStr] = useState('');
  const [addressCount, setAddressCount] = useState(20);
  const [password, setPassword] = useState('');
  const { loading, error, finish } = useImportMem(
    membStr,
    password,
    addressCount
  );

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (finish) {
      onConfirm(addressCount);
    }
  }, [addressCount, finish, onConfirm]);

  const handleConfirm = useCallback(
    async ({ memb_str, passwd, address_count }: any) => {
      setAddressCount(address_count);
      setMembStr(memb_str);
      setPassword(passwd);
    },
    []
  );

  return (
    <Modal
      open={open}
      // onOk={handleConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      title="导入助记词"
      centered
      destroyOnClose
      footer=""
    >
      <ProForm onFinish={handleConfirm} autoComplete="off">
        <Form.Item
          label="助记词"
          name="memb_str"
          rules={[{ required: true, message: '助记词不能为空！' }]}
        >
          <TextArea autoFocus placeholder="请填写助记词" rows={3} />
        </Form.Item>

        <Form.Item label="生成地址数量" name="address_count">
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="passwd"
          rules={[{ required: true, message: '密码词不能为空！' }]}
        >
          <Password placeholder="请设置助记词密码" />
        </Form.Item>
      </ProForm>
    </Modal>
  );
}

type ContractModalProps = ModalProps & { onConfirm: () => void };

function SetContractModal({ open, onCancel, onConfirm }: ContractModalProps) {
  const handleConfirm = useCallback(
    async ({
      contract_addr,
      contract_type: cType,
    }: {
      contract_addr: string;
      contract_type: string;
    }) => {
      const cAddr = contract_addr.toLowerCase();

      const now = new Date().getTime();
      const myRunResult = await SqliteHelper.Run(
        'replace into `' +
          NameTableConfig +
          '`(`conf_key`,`conf_value`,`updated_at`) values(?,?,?),(?,?,?)',
        ConfigKeys.NFTContractAddress,
        cAddr,
        now,
        ConfigKeys.NFTContractType,
        cType,
        now
      );
      if (myRunResult == null) {
        message.error('db not connect');
      } else if (myRunResult.err) {
        message.error(`empty all address failed ${myRunResult.err.message}`);
      }

      onConfirm();
    },
    [onConfirm]
  );

  return (
    <Modal
      footer=""
      title="设置 NFT 合约"
      open={open}
      onCancel={onCancel}
      centered
    >
      <ProForm onFinish={handleConfirm}>
        <Form.Item
          rules={[
            { required: true, message: 'please enter address!' },
            {
              pattern: /^0x[a-zA-Z0-9]{40}$/,
              message: 'wrong address format!',
            },
          ]}
          label="合约地址"
          name="contract_addr"
        >
          <Input placeholder="please enter address" autoFocus />
        </Form.Item>

        <Form.Item
          name="contract_type"
          label="合约类型"
          rules={[{ required: true, message: 'Please select a type!' }]}
        >
          <Select
            options={[
              { value: 'erc721', label: 'erc721' },
              { value: 'erc1155', label: 'erc1155' },
            ]}
            placeholder="Please select a type"
          />
        </Form.Item>
      </ProForm>
    </Modal>
  );
}

function BalanceAmountModal({ open, onCancel, onConfirm }: ModalProps) {
  const handleConfirm = useCallback(
    async ({ passwd }) => {
      await onConfirm(passwd);
    },
    [onConfirm]
  );

  return (
    <Modal
      title="Confirm Password"
      open={open}
      footer=""
      onCancel={onCancel}
      centered
      destroyOnClose
    >
      <ProForm onFinish={handleConfirm}>
        <Form.Item
          rules={[{ required: true, message: 'please enter your password!' }]}
          label="Password"
          name="passwd"
        >
          <Password placeholder="password" autoFocus />
        </Form.Item>
      </ProForm>
    </Modal>
  );
}
