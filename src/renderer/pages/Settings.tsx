import { Form, Input, Layout, Select, Space, Typography } from 'antd';
import { Settings } from 'electron';
import React from 'react';
import moduleName from 'electron-log/renderer';

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const settings: Settings | undefined =
    window.electron.ipcRenderer.store.get('settings');

  return (
    <>
      <Space style={{ padding: '0 24px' }}>
        <Form
          form={form}
          autoComplete="off"
          layout="vertical"
          initialValues={settings}
          onValuesChange={(changedVal: Partial<Settings>) => {
            for (const i in changedVal) {
              window.electron.ipcRenderer.store.set(
                `settings.${i}`,
                changedVal[i]
              );
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
