import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import './Hello.css';
import { useNavigate } from 'react-router-dom';
import { Song, SongDifficulty } from 'type';
import React, { useState } from 'react';
import type { TableRowSelection } from 'antd/es/table/interface';

import { useAppDispatch, useAppSelector } from '../store';

interface SongTableData extends Song {
  key: string;
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
      dataIndex: 'id',
      key: 'id',
      width: 150,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '曲名',
      dataIndex: 'title_localized',
      key: 'title_localized',
      width: 250,
      ellipsis: true,
      render: (title: { en: string; ja?: string }) => (
        <>
          <Tag>EN</Tag>
          {title.en}
          {title.ja && (
            <>
              <tr />
              <Tag>JA</Tag>
              {title.ja}
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
    },
    {
      title: '谱面',
      dataIndex: 'difficulties',
      key: 'difficulties',
      width: 100,
      render: (diffs: SongDifficulty[]) => {
        return diffs.map((diff) => {
          if (diff.rating < 0) return <></>;
          return (
            <Tag
              key={diff.ratingClass}
              color={convertRatingClassColor(diff.ratingClass)}
              style={{ marginTop: 2, marginBottom: 2 }}
            >
              {convertRatingClass(diff.ratingClass)}{' '}
              {diff.rating === 0 ? '?' : diff.rating}
              {diff.ratingPlus ? '+' : ''}
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
    },
    {
      title: '曲包',
      dataIndex: 'set',
      key: 'set',
      width: 100,
    },
    {
      title: '侧',
      dataIndex: 'side',
      key: 'side',
      width: 80,
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
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date) => new Date(date * 1000).toLocaleString(),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
  ];

  let data: SongTableData[] = [];
  if (assets.songs && Array.isArray(assets.songs)) {
    data = assets.songs.map((song, index) => ({
      key: song.id,
      title: song.title_localized.ja ?? song.title_localized.en,
      bpm_combine: `${song.bpm.split('\n')[0]} (${song.bpm_base})`,
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

  console.log(data);

  return (
    <>
      <Table
        columns={column}
        dataSource={data}
        size="middle"
        scroll={{ x: 'calc(100vw - 220px)', y: 'calc(100vh - 100px)' }}
        style={{ height: 'calc(100vh - 48px)' }}
        pagination={{
          // @ts-expect-error Type '"none"' is not assignable to type 'TablePaginationPosition'.
          position: ['none', 'bottomLeft'],
          showTotal: (total, range) =>
            `${total} 曲目中的 ${range[0]}-${range[1]} `,
          defaultPageSize: 20,
        }}
        rowSelection={rowSelection}
      />
    </>
  );
};

export default Songs;
