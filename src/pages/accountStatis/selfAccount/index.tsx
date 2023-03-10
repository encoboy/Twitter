//自有账号统计
import ProTable from '@ant-design/pro-table';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from '@umijs/max';
import { useModel } from 'umi';
import { useRequest } from 'ahooks';
import { gettwitterstatistical } from '@/utils/request';
import img1 from '@/assets/img/1.png';
import styles from './index.less';
const dataList1 = [
  {
    name: '0xUmi',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
  {
    name: 'm2',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
];

const dataList2 = [
  {
    name: '0xUmi2',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
  {
    name: 'm222',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
];
const dataList3 = [
  {
    name: '0xUmi33',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
  {
    name: 'm333',
    B: 5694,
    C: '+56',
    D: '10%',
    E: '100',
    F: '10',
    G: '20',
    H: '23',
    I: '22',
  },
];

const SelfAccount = () => {
  const [btnIndex, setBtnIndex] = useState(0);
  const [dataList, setDataList] = useState(dataList1);
  const { initialState = {}, setInitialState } = useModel('@@initialState');
  const { slefTwitterstatistical = {} } = initialState;
  const intl = useIntl();
  const actionRef = useRef<any>();
  const { run } = useRequest(gettwitterstatistical, {
    manual: true,
    onSuccess: (result: any) => {
      const { data = {} } = result;
      const { list = {} } = data;
      let slefTwitterstatistical = {
        follow_change: list.follow_change,
        follow_count: list.follow_count,
        increase_follow_rate: list.increase_follow_rate,
        like_count: list.like_count,
        re_tweet_count: list.re_tweet_count,
        reply_count: list.reply_count,
      };
      setInitialState((init: any) => ({ ...init, slefTwitterstatistical }));
    },
  });

  useEffect(() => {
    const login_token = sessionStorage.getItem('adminToken');
    if (
      login_token !== null &&
      slefTwitterstatistical.follow_change != 0 &&
      !slefTwitterstatistical.follow_change
    ) {
      run({ user_type: 1, start_time: 1670284800, end_time: 1670457600 });
    }
  }, []);

  const columns: any = [
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.name',
        defaultMessage: '名称',
      }),
      align: 'center' as 'center',
      dataIndex: 'name',
      key: 'name',
      search: false,
      width: 200,
      render: (_: any, { name }: any) => (
        <div className={styles.nameBox}>
          <img src={img1} alt="" />
          <div className={styles.rightBox}>
            <div>{name} Buy & Ell</div>
            <a href="#">@{name}</a>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fensinum',
        defaultMessage: '粉丝数量',
      }),
      align: 'center' as 'center',
      dataIndex: 'B',
      key: 'B',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fenxigaibian',
        defaultMessage: '粉丝变化',
      }),
      align: 'center' as 'center',
      key: 'C',
      dataIndex: 'C',
      search: false,
      render: (_: any, { C }: any) => (
        <div style={{ color: '#3eac4e' }}>{C}</div>
      ),
    },

    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhangfenlv',
        defaultMessage: '涨粉率',
      }),
      align: 'center' as 'center',
      dataIndex: 'D',
      key: 'D',
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.dianzannum',
        defaultMessage: '点赞数量',
      }),
      align: 'center' as 'center',
      dataIndex: 'E',
      key: 'E',
      search: false,
    },

    {
      title: intl.formatMessage({
        id: 'pages.searchTable.pinglunnum',
        defaultMessage: '评论数量',
      }),
      align: 'center' as 'center',
      dataIndex: 'F',
      key: 'F',
      search: false,
    },

    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhuanfanum',
        defaultMessage: '转发数量',
      }),
      align: 'center' as 'center',
      dataIndex: 'H',
      key: 'H',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zanfenbi',
        defaultMessage: '赞粉比',
      }),
      align: 'center' as 'center',
      dataIndex: 'I',
      key: 'I',
      ellipsis: true,
      search: false,
    },
  ];

  const tongjiData = [
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fenxizongliang',
        defaultMessage: '粉丝总量',
      }),
      num: slefTwitterstatistical.follow_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fenxigaibian',
        defaultMessage: '粉丝变化',
      }),
      num: slefTwitterstatistical.follow_change || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhangfenlv',
        defaultMessage: '涨粉率',
      }),
      num: slefTwitterstatistical.increase_follow_rate || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.dianzanliang',
        defaultMessage: '点赞总量',
      }),
      num: slefTwitterstatistical.like_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.pinglunliang',
        defaultMessage: '评论总量',
      }),
      num: slefTwitterstatistical.re_tweet_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhuanfaliang',
        defaultMessage: '转发总量',
      }),
      num: slefTwitterstatistical.reply_count || 0,
    },
  ];

  const riqiBtns = [
    intl.formatMessage({
      id: 'pages.searchTable.ri',
      defaultMessage: '日',
    }),
    intl.formatMessage({
      id: 'pages.searchTable.yue',
      defaultMessage: '月',
    }),
    intl.formatMessage({
      id: 'pages.searchTable.nian',
      defaultMessage: '年',
    }),
  ];

  useEffect(() => {}, []);

  return (
    <div className={styles.container}>
      <div className={styles.headBox}>
        <div className={styles.headMenu}>
          {intl.formatMessage({
            id: 'pages.searchTable.shujutonji',
            defaultMessage: '数据统计',
          })}{' '}
          /{' '}
          {intl.formatMessage({
            id: 'pages.searchTable.zhanghaotongji',
            defaultMessage: '自有账号统计',
          })}
        </div>
        <div className={styles.title}>
          {intl.formatMessage({
            id: 'pages.searchTable.zhanghaotongji',
            defaultMessage: '自有账号统计',
          })}
        </div>
      </div>

      <div className={styles.tongjiBox}>
        {tongjiData.map((item, index) => {
          return (
            <div
              key={index}
              className={classNames(
                styles.itemBox,
                index !== 5 ? styles.borderRight : ''
              )}
            >
              <span>{item.title}</span>
              <div>{item.num}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.tableTitle}>
        <div className={styles.title}>
          Twitter{' '}
          {intl.formatMessage({
            id: 'pages.searchTable.list',
            defaultMessage: '列表',
          })}
        </div>
        <div className={styles.btnsBox}>
          {riqiBtns.map((item, index) => {
            return (
              <div
                key={index}
                onClick={() => {
                  setBtnIndex(index);
                  let data = dataList;
                  if (index === 0) {
                    data = dataList1;
                  } else if (index === 1) {
                    data = dataList2;
                  } else if (index === 2) {
                    data = dataList3;
                  }
                  setDataList(data);
                }}
                className={classNames(
                  styles.notActiveBtn,
                  index === btnIndex ? styles.activeBtn : ''
                )}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`comTablePro ${styles.listView}`}>
        <ProTable
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          options={false}
          debounceTime={100}
          search={false}
          dataSource={dataList}
        />
      </div>
    </div>
  );
};

export default SelfAccount;
