import { Button, Input, Menu, Space, Spin, Table, Tag, theme } from 'antd';
import type { TableColumnsType } from 'antd';

import './Hello.css';
import { useNavigate } from 'react-router-dom';
import { Song, SongDifficulty } from 'type';
import React, { useEffect, useState } from 'react';
import type { TableRowSelection } from 'antd/es/table/interface';

import {
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../store';

interface SongTableData extends Song {
  key: string;
  idWithExtFlag: {
    id: string;
    ext?: string;
  };
  title: string;
  bpm_combine: string;
}

function convertRatingClass(rating: number) {
  if (rating === 0) {
    return 'Past';
  }
  if (rating === 1) {
    return 'Present';
  }
  if (rating === 2) {
    return 'Future';
  }
  if (rating === 3) {
    return 'Beyond';
  }
  return 'Unknown';
}

function convertRatingClassColor(rating: number) {
  if (rating === 0) {
    return 'cyan';
  }
  if (rating === 1) {
    return 'green';
  }
  if (rating === 2) {
    return 'purple';
  }
  if (rating === 3) {
    return 'volcano';
  }
  return 'gray';
}

const Songs: React.FC = () => {
  const assets = useAppSelector((state) => state.assets);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const column: TableColumnsType<SongTableData> = [
    {
      title: 'ID',
      dataIndex: 'idWithExtFlag',
      key: 'id',
      width: 150,
      fixed: 'left',
      ellipsis: true,
      sorter: (a, b) => a.id.localeCompare(b.id),
      sortDirections: ['ascend', 'descend'],
      render: ({ id, ext }) => {
        return (
          <>
            <span title={id}>{id}</span>
            {ext && (
              <Tag
                title={ext}
                style={{
                  marginLeft: 4,
                }}
              >
                外
              </Tag>
            )}
          </>
        );
      },
    },
    {
      title: '曲名',
      dataIndex: 'title_localized',
      key: 'title_localized',
      width: 250,
      ellipsis: true,
      sorter: (a, b) =>
        a.title_localized.en.localeCompare(b.title_localized.en, 'ja'),
      sortDirections: ['ascend', 'descend'],
      render: (title: { en: string; ja?: string }) => (
        <>
          <Tag>EN</Tag>
          <span title={title.en}>{title.en}</span>
          {title.ja && (
            <>
              <tr />
              <Tag>JA</Tag>
              <span title={title.ja}>{title.ja}</span>
            </>
          )}
        </>
      ),
    },
    {
      title: '曲师',
      dataIndex: 'artist',
      key: 'artist',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.artist.localeCompare(b.artist, 'ja'),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '谱面',
      dataIndex: 'difficulties',
      key: 'difficulties',
      width: 100,
      filters: [
        {
          text: 'Past',
          value: 0,
        },
        {
          text: 'Present',
          value: 1,
        },
        {
          text: 'Future',
          value: 2,
        },
        {
          text: 'Beyond',
          value: 3,
        },
      ],
      onFilter: (value, record) =>
        record.difficulties.filter((x) => x.ratingClass === value).length > 0,
      // TODO 谱面难度排序
      render: (diffs: SongDifficulty[]) => {
        return diffs.map((diff) => {
          if (diff.rating < 0) return <></>;
          return (
            <Tag
              key={diff.ratingClass}
              color={convertRatingClassColor(diff.ratingClass)}
              style={{ marginTop: 2, marginBottom: 2 }}
            >
              <span
                title={`曲封：${diff.jacketDesigner}\n谱面：${diff.chartDesigner}`}
              >
                {convertRatingClass(diff.ratingClass)}{' '}
                {diff.rating === 0 ? '?' : diff.rating}
                {diff.ratingPlus ? '+' : ''}
              </span>
            </Tag>
          );
        });
      },
    },
    {
      title: 'BPM',
      dataIndex: 'bpm_combine',
      key: 'bpm_combine',
      width: 120,
      ellipsis: true,
      sorter: (a, b) => a.bpm_base - b.bpm_base,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '曲包',
      dataIndex: 'set',
      key: 'set',
      width: 100,
      sorter: (a, b) => a.set.localeCompare(b.set),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '侧',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      filters: [
        {
          text: '光芒',
          value: 0,
        },
        {
          text: '纷争',
          value: 1,
        },
        {
          text: '消色',
          value: 2,
        },
      ],
      onFilter: (value, record) => record.side === value,
      render: (side) => {
        if (side === 0) {
          return <Tag>光芒</Tag>;
        }
        if (side === 1) {
          return <Tag>纷争</Tag>;
        }
        if (side === 2) {
          return <Tag>消色</Tag>;
        }
        return <></>;
      },
    },
    {
      title: '背景',
      dataIndex: 'bg',
      key: 'bg',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.bg.localeCompare(b.bg),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      sorter: (a, b) => a.date - b.date,
      sortDirections: ['ascend', 'descend'],
      render: (date) => (
        <span title={date}>{new Date(date * 1000).toLocaleString()}</span>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      sorter: (a, b) => a.version.localeCompare(b.version),
      sortDirections: ['ascend', 'descend'],
    },
  ];

  let data: SongTableData[] = [];
  if (assets.songs && Array.isArray(assets.songs)) {
    data = assets.songs.map((song, index) => ({
      key: song.id,
      title: song.title_localized.ja ?? song.title_localized.en,
      bpm_combine: `${song.bpm.split('\n')[0]} (${song.bpm_base})`,
      idWithExtFlag: {
        id: song.id,
        ext: song._external,
      },
      ...song,
    }));
  }

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<SongTableData> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');

  const themeToken = theme.useToken();

  useEffect(() => {
    window.aam.ipcRenderer.onStartGeneratePackage(() => {
      setLog('');
      setLoading(true);
    });
    window.aam.ipcRenderer.onStopGeneratePackage(() => {
      setLoading(false);
      setLog('');
    });
    window.aam.ipcRenderer.onLog((_, args) => {
      setLog(args);
    });
  }, []);

  return (
    <>
      <Spin tip={`正在打包...${log}`} spinning={loading}>
        <div
          style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <div style={{ height: '24px', margin: '8px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Button type="text" size="small">
                <ReloadOutlined />
                刷新
              </Button>
              <Button type="text" size="small">
                <EditOutlined />
                编辑JSON
              </Button>
              <div
                style={{
                  height: '16px',
                  width: '1px',
                  backgroundColor: themeToken.token.colorTextDisabled,
                  margin: 2,
                }}
              />
              <Button type="text" size="small" danger>
                <DeleteOutlined />
              </Button>
              <Button type="text" size="small">
                <DashOutlined />
                解除链接
              </Button>
              <div style={{ flex: '1' }} />
              <Input
                size="small"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: '250px' }}
              />
            </div>
          </div>
          <Table
            columns={column}
            dataSource={data}
            size="middle"
            scroll={{ y: 'calc(100vh - 30px - 58px)' }}
            pagination={false}
            rowSelection={rowSelection}
          />
        </div>
      </Spin>
    </>
  );
};

export default Songs;
