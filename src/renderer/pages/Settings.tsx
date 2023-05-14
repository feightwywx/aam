import {
  Button,
  Form,
  Input,
  InputNumber,
  Layout,
  Select,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import { SettingsType } from 'type';

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const settings = window.electron.ipcRenderer.store.get('settings') as
    | SettingsType
    | undefined;
  console.log(settings);

  return (
    <>
      <Form
        form={form}
        style={{padding: '0 24px'}}
        autoComplete="off"
        layout="vertical"
        initialValues={settings}
        onValuesChange={(changedVal: Partial<SettingsType>) => {
          for (const i in changedVal) {
            if (
              Object.prototype.hasOwnProperty.call(changedVal, 'logLevel') ||
              Object.prototype.hasOwnProperty.call(
                changedVal,
                'minimalRating'
              ) ||
              Object.prototype.hasOwnProperty.call(changedVal, 'ignoredSong')
            ) {
              window.electron.ipcRenderer.store.set(
                `settings.${i}`,
                changedVal[i]
              );
            }
          }
        }}
      >
        <Typography.Title level={2}>设置</Typography.Title>
        <Form.Item label="日志等级">
          <Space direction="vertical">
            <Form.Item name="logLevel" style={{ marginBottom: 0 }}>
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
            <Typography.Text type="secondary">
              控制日志文件的记录等级。
              <Button
                type="link"
                onClick={() => window.electron.ipcRenderer.showLogFile()}
              >
                查看日志
              </Button>
            </Typography.Text>
          </Space>
        </Form.Item>

        <Form.Item label="最低合法标级">
          <Space direction="vertical">
            <Form.Item name="minimalRating" style={{ marginBottom: 0 }}>
              <InputNumber />
            </Form.Item>
            <Typography.Text type="secondary">
              低于这个标级的难度将被视为谱面不存在。0表示“?”难度。不支持难度中的“+”。
            </Typography.Text>
          </Space>
        </Form.Item>

        <Form.Item label="忽略曲目id">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name="ignoredSong" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Typography.Text type="secondary">
              需要忽略的曲目id。多个曲目id用“,”隔开。
            </Typography.Text>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export default Settings;
