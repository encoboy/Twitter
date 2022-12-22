import { ProFormText } from '@ant-design/pro-components';
import { ProFormFieldItemProps } from '@ant-design/pro-form/es/interface';
import type { InputProps } from 'antd';
import type { InputRef } from 'antd/es/input';

export const MyFormAddress: React.FC<ProFormFieldItemProps<InputProps, InputRef>> = (props) => {
  if (!props.rules) {
    props.rules = [];
  }
  props.rules.push({ pattern: /^0x[a-zA-Z0-9]{40}$/, message: 'wrong address format!' });
  return <ProFormText {...props} />;
};
