import { Form, Input, Layout, Select, Space, Typography } from 'antd';
import React from 'react';
import { SettingsType } from 'type';

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const settings = window.electron.ipcRenderer.store.get('settings') as
    | SettingsType
    | undefined;

  return (
    <>
      <Space style={{ padding: '0 24px' }}>
        <Form
          form={form}
          autoComplete="off"
          layout="vertical"
          initialValues={settings}
          onValuesChange={(changedVal: Partial<SettingsType>) => {
            for (const i in changedVal) {
              if (
                Object.prototype.hasOwnProperty.call(changedVal, 'logLevel')
              ) {
                window.electron.ipcRenderer.store.set(
                  `settings.${i}`,
                  changedVal.logLevel
                );
              }
            }
          }}
        >
          <Typography.Title level={2}>设置</Typography.Title>
          <Form.Item name="logLevel" label="日志等级">
            <Select
              options={[
                'error',
                'warn',
                'info',
                'verbose',
                'debug',
                'silly',
              ].map((level) => ({
                value: level,
                label: level,
              }))}
              style={{ width: 200 }}
            />
          </Form.Item>
          {}
        </Form>
      </Space>
    </>
  );
};

export default Settings;
