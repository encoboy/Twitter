import { useState, useEffect, useCallback, useRef } from 'react';

import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormSwitch,
} from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Col, Row, message } from 'antd';

import { autoBidCollection, offAutoBid } from '@/toolkit/lowPriceMakeOffer';

// import { useCode } from '../LiquidityMaker';

export default function BatchOffer() {
  const [start, setStart] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // const [getCode, codeDialog] = useCode();

  const formRef = useRef<ProFormInstance>(null);

  useEffect(() => {
    if (!start || !isRunning) {
      return;
    }

    const privateKey = formRef.current?.getFieldValue('private_key');
    const address = formRef.current?.getFieldValue('address');
    const slug = formRef.current?.getFieldValue('slug');
    const creator = formRef.current?.getFieldValue('creator');
    const creator_fee = formRef.current?.getFieldValue('creator_fee');
    const pooling = formRef.current?.getFieldValue('pooling');

    const hasEmpty =
      !privateKey || !address || !slug || !creator || !creator_fee || !pooling;

    if (hasEmpty) {
      message.info('表单不能为空');
      formRef.current?.setFieldValue('begin_make', null);
      setStart(false);
      offAutoBid();
      return;
    }

    const asyncFn = async () => {
      setIsRunning(true);
      await autoBidCollection(
        privateKey,
        address,
        slug,
        creator,
        creator_fee,
        pooling
      );

      setIsRunning(false);
    };
    asyncFn();

    return () => {};
  }, [isRunning, start]);

  const handleClickStart = useCallback(({ begin_make }) => {
    if (begin_make) {
      setStart(true);
    }

    if (begin_make === false) {
      offAutoBid();
      setStart(false);
    }
  }, []);

  return (
    <PageContainer>
      {/* {codeDialog} */}
      <ProForm
        layout="horizontal"
        submitter={false}
        formRef={formRef}
        onValuesChange={handleClickStart}
      >
        <Row>
          <Col span={1} />
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="private_key" label="私钥" />
            </ProForm.Group>
          </Col>
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="address" label="NFT 合约地址" />
            </ProForm.Group>
          </Col>
        </Row>

        <Row>
          <Col span={1} />
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="slug" label="合集 slug" />
            </ProForm.Group>
          </Col>
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="creator" label="创作者地址" />
            </ProForm.Group>
          </Col>
        </Row>

        <Row>
          <Col span={1} />
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="creator_fee" label="创作者版税" />
            </ProForm.Group>
          </Col>
          <Col span={11}>
            <ProForm.Group>
              <ProFormText name="pooling" label="轮询间隔（分钟）" />
            </ProForm.Group>
          </Col>
        </Row>

        <Row>
          <Col span={1} />
          <Col span={11}>
            <ProForm.Group>
              <ProFormSwitch name="begin_make" label="执行开关" />
            </ProForm.Group>
          </Col>
          <Col span={11}>
            <ProForm.Group>
              {/* <ProFormText name="creator_fee" label="创作者版税" /> */}
            </ProForm.Group>
          </Col>
        </Row>
      </ProForm>
    </PageContainer>
  );
}
