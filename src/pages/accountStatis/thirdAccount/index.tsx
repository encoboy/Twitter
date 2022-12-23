// 第三方账号统计
import ProTable from '@ant-design/pro-table';
import classNames from 'classnames';
import { useRef, useState, useEffect } from 'react';
import { useIntl } from '@umijs/max';
import { useRequest } from 'ahooks';
import { gettwitterstatistical } from '@/utils/request';
import img1 from '@/assets/img/1.png';
import styles from './index.less';
import { useModel } from 'umi';

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
    J: '33',
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
    J: '33',
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
    J: '33',
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
    J: '33',
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
    J: '33',
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
    J: '33',
  },
];

const ThirdAccount = () => {
  const actionRef = useRef<any>();
  const [dataList, setDataList] = useState(dataList1);
  const intl = useIntl();
  const [btnIndex, setBtnIndex] = useState(0);
  const { initialState = {}, setInitialState } = useModel('@@initialState');
  const { twitterstatistical = {} } = initialState;
  const { run } = useRequest(gettwitterstatistical, {
    manual: true,
    onSuccess: async (result, params) => {
      const { data = {} } = result;
      const { list = {} } = data;
      let twitterstatistical = {
        follow_change: list.follow_change,
        follow_count: list.follow_count,
        increase_follow_rate: list.increase_follow_rate,
        like_count: list.like_count,
        re_tweet_count: list.re_tweet_count,
        reply_count: list.reply_count,
      };
      setInitialState((init: any) => ({ ...init, twitterstatistical }));
    },
  });

  useEffect(() => {
    const login_token = localStorage.getItem('login_token');
    if (
      login_token !== null &&
      twitterstatistical.follow_change != 0 &&
      !twitterstatistical.follow_change
    ) {
      run({ login_token, user_type: 2 });
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
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.tuiwennum',
        defaultMessage: '推文数量',
      }),
      align: 'center' as 'center',
      dataIndex: 'J',
      key: 'J',
      search: false,
    },

    {
      title: intl.formatMessage({
        id: 'pages.searchTable.titleOption',
        defaultMessage: '操作',
      }),
      align: 'center',
      width: 100,
      render: (_: any, { id }: any) => {
        return (
          <div className={styles.delete}>
            {' '}
            {intl.formatMessage({
              id: 'pages.searchTable.del',
              defaultMessage: '删除',
            })}{' '}
          </div>
        );
      },
    },
  ];

  const tongjiData = [
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fenxizongliang',
        defaultMessage: '粉丝总量',
      }),
      num: twitterstatistical.follow_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.fenxigaibian',
        defaultMessage: '粉丝变化',
      }),
      num: twitterstatistical.follow_change || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhangfenlv',
        defaultMessage: '涨粉率',
      }),
      num: twitterstatistical.increase_follow_rate || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.dianzanliang',
        defaultMessage: '点赞总量',
      }),
      num: twitterstatistical.like_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.pinglunliang',
        defaultMessage: '评论总量',
      }),
      num: twitterstatistical.re_tweet_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.searchTable.zhuanfaliang',
        defaultMessage: '转发总量',
      }),
      num: twitterstatistical.reply_count || 0,
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
            id: 'pages.searchTable.sanfangtongji',
            defaultMessage: '第三方账号统计',
          })}
        </div>
        <div className={styles.title}>
          {intl.formatMessage({
            id: 'pages.searchTable.sanfangtongji',
            defaultMessage: '第三方账号统计',
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
          <div className={styles.btnsBox}>
            {riqiBtns.map((item, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    let data = dataList;
                    if (index === 0) {
                      data = dataList1;
                    } else if (index === 1) {
                      data = dataList2;
                    } else if (index === 2) {
                      data = dataList3;
                    }
                    setDataList(data);
                    setBtnIndex(index);
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
      </div>
      <div className={styles.addBox}>
        <div className={styles.addItem}>
          <span>
            +{' '}
            {intl.formatMessage({
              id: 'pages.searchTable.add',
              defaultMessage: '添加',
            })}
          </span>
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

export default ThirdAccount;
