import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import React, { useState } from 'react';
import { AppInfo, SettingsType } from 'type';

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const settings = window.electron.ipcRenderer.store.get('settings') as
    | SettingsType
    | undefined;
  console.log(settings);

  const [messageApi] = message.useMessage();

  const [appInfo, setAppInfo] = useState<AppInfo>();
  const appInfoPromise = window.electron.ipcRenderer
    .getAppInfo()
    .then((resp) => setAppInfo(resp));

  return (
    <div style={{ height: '100vh', overflow: 'scroll' }}>
      <Form
        form={form}
        style={{ padding: '0 24px' }}
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
                changedVal[i as keyof SettingsType]
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

        <Form.Item label="初始化">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: '你确定吗？',
                  icon: <ExclamationCircleFilled />,
                  content: 'AAM将在初始化后退出。此操作不能撤销。',
                  onOk() {
                    return new Promise((resolve, reject) => {
                      window.electron.ipcRenderer.reset();
                      messageApi.success('已重置');
                      resolve();
                    }).catch(() => console.log('Oops errors!'));
                  },
                  onCancel() {},
                });
              }}
            >
              初始化
            </Button>
            <Typography.Text type="secondary">
              如果您遇到了问题，可以尝试初始化AAM。这将把所有设置恢复到默认状态。
            </Typography.Text>
          </Space>
        </Form.Item>
        <Form.Item>
          <Typography.Text type="secondary">
            aam -{' '}
            {appInfo?.isDebug
              ? `development mode, electron ${appInfo.version}`
              : appInfo?.version}
          </Typography.Text>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Settings;
