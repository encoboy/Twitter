import { useCallback, useEffect, useMemo, useState } from 'react';

export default () => {
  const [addrList, setAddrList] = useState<Array<string>>([]);
  const [memText, setMemText] = useState('');
  const [username, setUsername] = useState('');

  const testFn = async () => {
    memoFuncTest();
  };

  const memTextChange = (e: any) => {
    setMemText(e.target.value);
  };

  const usernameChange = (e: any) => {
    setUsername(e.target.value);
  };

  var addrEleList: JSX.Element[] = [];
  for (let i in addrList) {
    addrEleList.push(<p key={i + 1}>{addrList[i]}</p>);
  }

  useEffect(() => {
    console.log(`set addr list`);
    let addrs = new Array<string>();
    addrs.push('0x000000001');
    addrs.push('0x000000002');
    addrs.push('0x000000003');
    setAddrList(addrs);
  }, []); // deps 设置为 [] 仅执行一次

  const memoTest = useMemo(() => {
    console.log(`calc memoTest`);
    return `mnemonic is ${memText} username is ${username}`;
  }, [memText, username]); // memText 或 username 发生改变时都会重新计算 memoTest 的值
  //}, [memText]); // 仅在 memText 发生改变时重新计算 memoTest 的值，username 发生改变时不会重新计算

  const memoFuncTest = useCallback(() => {
    console.log(`memoFuncTest invoked memTest is ${memText}`);
  }, [memText]); // "memoFuncTest invoked memTest is 11111" 会在 memText 发生改变时更新函数里面的变量
  // }, []); // "memoFuncTest invoked memTest is " 不会在 memText 发生改变时更新函数里面的变量

  return (
    <div>
      <p>{memoTest}</p>
      <p>
        <label>
          mnemonic:
          <input
            placeholder="please enter mnemonic"
            value={memText}
            onChange={e => memTextChange(e)}
          />
        </label>
      </p>
      <p>
        <label>
          username:
          <input
            placeholder="please enter username"
            value={username}
            onChange={e => usernameChange(e)}
          />
        </label>
      </p>
      <p>
        <button onClick={() => testFn()}> CB Test 222333 </button>
      </p>
      {addrEleList}
    </div>
  );
};
