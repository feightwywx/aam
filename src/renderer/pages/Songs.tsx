import {
  Button,
  Input,
  Menu,
  message,
  Modal,
  Popover,
  Space,
  Spin,
  Table,
  TableProps,
  Tag,
  theme,
  Tooltip,
} from 'antd';
import type { TableColumnsType } from 'antd';

import './Hello.css';
import { useNavigate } from 'react-router-dom';
import { Song, SongDifficulty } from 'type';
import React, { useEffect, useRef, useState } from 'react';
import type {
  FilterValue,
  SorterResult,
  TableRowSelection,
} from 'antd/es/table/interface';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../store';
import { setSongs } from 'stateSlices/assets';
import MonacoEditor from 'renderer/components/MonacoEditor';

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

  const [messageApi, contextHolder] = message.useMessage();

  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, FilterValue | null>
  >({});

  const handleTableChange: TableProps<SongTableData>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    console.log('Various parameters', pagination, filters, sorter);
    setFilteredInfo(filters);
  };

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
                ???
              </Tag>
            )}
          </>
        );
      },
    },
    {
      title: '??????',
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
      title: '??????',
      dataIndex: 'artist',
      key: 'artist',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.artist.localeCompare(b.artist, 'ja'),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '??????',
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
      filteredValue: filteredInfo.difficulties || null,
      onFilter: (value, record) =>
        record.difficulties.filter((x) => x.ratingClass === value).length > 0,
      // TODO ???????????????????????????????????????
      sorter: (a, b) => {
        function levelNormalizer(diff: SongDifficulty) {
          return (
            // diff.ratingClass * 1000 +
            diff.rating * 10 + (diff.ratingPlus ? 5 : 0)
          );
        }

        const lvA = a.difficulties.map(levelNormalizer);
        const lvB = b.difficulties.map(levelNormalizer);

        // ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        if (filteredInfo.difficulties) {
          const highestRatingClass = filteredInfo.difficulties[
            filteredInfo.difficulties.length - 1
          ] as number;
          return (
            lvA[Math.min(highestRatingClass, lvA.length - 1)] -
            lvB[Math.min(highestRatingClass, lvB.length - 1)]
          );
        }
        // ??????????????????????????????????????????
        return lvA[lvA.length - 1] - lvB[lvB.length - 1];
      },
      render: (diffs: SongDifficulty[]) => {
        return diffs.map((diff) => {
          if (diff.rating < 0) return <></>;
          if (
            filteredInfo.difficulties &&
            !filteredInfo.difficulties.includes(diff.ratingClass)
          )
            return <></>;
          return (
            <Tag
              key={diff.ratingClass}
              color={convertRatingClassColor(diff.ratingClass)}
              style={{ marginTop: 2, marginBottom: 2 }}
            >
              <span
                title={`?????????${diff.jacketDesigner}\n?????????${diff.chartDesigner}`}
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
      title: '??????',
      dataIndex: 'set',
      key: 'set',
      width: 100,
      sorter: (a, b) => a.set.localeCompare(b.set),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '???',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      filters: [
        {
          text: '??????',
          value: 0,
        },
        {
          text: '??????',
          value: 1,
        },
        {
          text: '??????',
          value: 2,
        },
      ],
      onFilter: (value, record) => record.side === value,
      filteredValue: filteredInfo.side || null,
      render: (side) => {
        if (side === 0) {
          return <Tag>??????</Tag>;
        }
        if (side === 1) {
          return <Tag>??????</Tag>;
        }
        if (side === 2) {
          return <Tag>??????</Tag>;
        }
        return <></>;
      },
    },
    {
      title: '??????',
      dataIndex: 'bg',
      key: 'bg',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.bg.localeCompare(b.bg),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '??????',
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
      title: '??????',
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

  const [searchValue, setSearchValue] = useState('');
  const filteredData = data.filter((song) => {
    const cons = searchValue.split(' ');

    function parseCon(con: string): boolean {
      if (con.length === 0) return true;

      if (song.id.toLocaleLowerCase().includes(con.toLocaleLowerCase()))
        return true;
      if (
        song.title_localized.en
          .toLocaleLowerCase()
          .includes(con.toLocaleLowerCase())
      )
        return true;
      if (
        song.title_localized.ja
          ?.toLocaleLowerCase()
          ?.includes(con.toLocaleLowerCase())
      )
        return true;
      if (song.artist.toLocaleLowerCase().includes(con.toLocaleLowerCase()))
        return true;
      if (song.set.toLocaleLowerCase().includes(con.toLocaleLowerCase()))
        return true;
      if (song.bg.toLocaleLowerCase().includes(con.toLocaleLowerCase()))
        return true;
      if (song.version.toLocaleLowerCase().includes(con.toLocaleLowerCase()))
        return true;

      function shortDiffNameToRatingClass(name: string) {
        switch (name) {
          case 'pst':
            return 0;
          case 'prs':
            return 1;
          case 'ftr':
            return 2;
          case 'byd':
            return 3;
          default:
            return -1;
        }
      }
      if (
        (con.startsWith('pst') ||
          con.startsWith('prs') ||
          con.startsWith('ftr') ||
          con.startsWith('byd') ||
          con.startsWith('any')) &&
        song.difficulties.filter(
          (diff) =>
            diff.rating ===
              +(con.endsWith('+')
                ? con.substring(3, con.length - 1)
                : con.substring(3, con.length)) &&
            (diff.ratingPlus
              ? diff.ratingPlus === con.endsWith('+')
              : con.endsWith('+') === false) &&
            (con.startsWith('any')
              ? true
              : diff.ratingClass ===
                shortDiffNameToRatingClass(con.substring(0, 3)))
        ).length > 0
      )
        return true;

      return false;
    }

    const result = cons.map(parseCon).reduce((a, b) => a && b);

    return result;
  });

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

  const refreshButtonClickHandler = async () => {
    const songsResp = await window.aam.ipcRenderer.loadSongs(assets.path);
    if (songsResp.code === 0) {
      messageApi.success('?????????');
      dispatch(setSongs(songsResp.data));
    } else {
      messageApi.error(songsResp.message);
    }
  };

  const [editJsonModalOpen, setEditJsonModalOpen] = useState(false);
  const [editJsonModalContent, setEditJsonModalContent] = useState('');
  const [editorMarkers, setEditorMarkers] = useState([]);
  const editorNoError = editorMarkers.length === 0;
  const parsedMarkers = editorMarkers
    .map((marker) => {
      return `${marker.message} [Ln ${marker.startLineNumber}, Col ${marker.startColumn}];`;
    })
    .join('\n');
  const editorRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }
  const editJsonButtonClickHandler = async () => {
    if (assets.songs && Array.isArray(assets.songs)) {
      setEditJsonModalContent(
        JSON.stringify(
          {
            songs: assets.songs.filter((song) =>
              selectedRowKeys.includes(song.id)
            ),
          },
          undefined,
          2
        )
      );
    }
    setEditJsonModalOpen(true);
  };
  const editJsonModalOkHandler = async () => {
    const submitContent = editorRef.current!.getValue();
    console.log('submit content', submitContent);
    try {
      const songlistPatch = JSON.parse(submitContent) as { songs: Song[] };
      console.log('songlist patch:', songlistPatch);

      const indexedSonglistPatch = songlistPatch.songs.map((song, index) => {
        const correspondIndex = assets.songs?.findIndex((sourceSong) => {
          return sourceSong.id === song.id;
        });
        console.log(correspondIndex);
        if (correspondIndex !== undefined && correspondIndex > -1) {
          return { correspondIndex, song };
        }
        return null;
      });

      console.log('indexedSonglistPatch', indexedSonglistPatch);

      if (assets.songs) {
        const patchedSonglist = assets.songs.map((sourceSong, index) => {
          for (const patchSongStruct of indexedSonglistPatch) {
            if (patchSongStruct && patchSongStruct.correspondIndex === index) {
              return patchSongStruct.song;
            }
          }
          return sourceSong;
        });

        const saveSonglistResp = await window.aam.ipcRenderer.saveSonglist({
          songs: patchedSonglist,
        });

        console.log('patched: ', patchedSonglist);

        if (saveSonglistResp.code === 0) {
          messageApi.success('?????????');
          // window.aam.ipcRenderer.loadSongs(assets.path);
          refreshButtonClickHandler();
          setEditJsonModalOpen(false);
        } else {
          messageApi.error(saveSonglistResp.message);
        }
      }
    } catch (e: Error) {
      if (e.name === 'SyntaxError') {
        messageApi.error(`JSON????????????`);
      } else {
        messageApi.error(`???????????????${e.name}`);
      }
    }
  };
  const editJsonModalCancelHandler = () => {
    setEditJsonModalContent('');
    setEditorMarkers([]);
    setEditJsonModalOpen(false);
  };
  function handleEditorValidation(markers) {
    // model markers
    setEditorMarkers(markers);
    console.log(markers);
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteModalOkButtonClickHandler = async () => {
    if (assets.songs) {
      const patchedSonglist = assets.songs.filter((song, index) => {
        if (selectedRowKeys.includes(song.id)) {
          return false;
        }
        return true;
      });

      const mergedResults = await Promise.allSettled([
        window.aam.ipcRenderer.saveSonglist({
          songs: patchedSonglist,
        }),
        window.aam.ipcRenderer.deleteSongs(selectedRowKeys as string[]),
      ]);

      console.log(mergedResults);
      const isAllResultsOk = mergedResults
        .map((result) => {
          return result.status === 'rejected' ? 1 : result.value.code;
        })
        .reduce((a, b) => a + b);
      if (isAllResultsOk === 0) {
        messageApi.success('?????????');
        // window.aam.ipcRenderer.loadSongs(assets.path);
        refreshButtonClickHandler();
        setDeleteModalOpen(false);
      } else {
        messageApi.error('?????????????????????');
      }
    }
  };

  const unlinkButtonClickHandler = async () => {
    if (assets.songs) {
      const patchedSonglist = assets.songs.map((song, index) => {
        if (selectedRowKeys.includes(song.id) && song._external) {
          return { ...song, _external: undefined };
        }
        return song;
      });

      const saveSonglistResp = await window.aam.ipcRenderer.saveSonglist({
        songs: patchedSonglist,
      });

      console.log('patched: ', patchedSonglist);

      if (saveSonglistResp.code === 0) {
        messageApi.success('?????????');
        // window.aam.ipcRenderer.loadSongs(assets.path);
        refreshButtonClickHandler();
        setEditJsonModalOpen(false);
      } else {
        messageApi.error(saveSonglistResp.message);
      }
    }
  };

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
      {contextHolder}
      <Spin tip={`????????????...${log}`} spinning={loading}>
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
              <Button
                type="text"
                size="small"
                onClick={refreshButtonClickHandler}
              >
                <ReloadOutlined />
                ??????
              </Button>
              <Button
                type="text"
                size="small"
                disabled={selectedRowKeys.length < 1}
                onClick={editJsonButtonClickHandler}
              >
                <EditOutlined />
                ??????JSON
              </Button>
              <div
                style={{
                  height: '16px',
                  width: '1px',
                  backgroundColor: themeToken.token.colorTextDisabled,
                  margin: 2,
                }}
              />
              <Button
                type="text"
                size="small"
                danger
                disabled={selectedRowKeys.length < 1}
                onClick={() => setDeleteModalOpen(true)}
              >
                <DeleteOutlined />
              </Button>
              <Button
                type="text"
                size="small"
                disabled={selectedRowKeys.length < 1}
                onClick={unlinkButtonClickHandler}
              >
                <DashOutlined />
                ????????????
              </Button>
              <div style={{ flex: '1' }} />
              <Input
                size="small"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: '250px' }}
                value={searchValue}
                placeholder="??????base ftr9+/any11"
                onChange={(e) => {
                  setSearchValue(e.target.value);
                }}
              />
            </div>
          </div>
          <Table
            columns={column}
            dataSource={filteredData}
            size="middle"
            scroll={{ y: 'calc(100vh - 30px - 58px)' }}
            pagination={false}
            rowSelection={rowSelection}
            onChange={handleTableChange}
            showSorterTooltip={false}
          />
        </div>
        <Modal
          title="??????"
          open={editJsonModalOpen}
          width="90%"
          centered
          onOk={editJsonModalOkHandler}
          okText="??????"
          onCancel={editJsonModalCancelHandler}
          footer={
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <Popover
                title="????????????"
                content={editorNoError ? '?????????????????????' : parsedMarkers}
                trigger="click"
                arrow={false}
              >
                <Button type="text" danger={!editorNoError}>
                  {editorNoError ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                  {editorMarkers.length > 0 ? `${editorMarkers.length}` : ''}
                </Button>
              </Popover>
              <div style={{ flex: 1 }} />
              <Button onClick={editJsonModalCancelHandler}>??????</Button>
              <Button
                type="primary"
                // disabled={!editorNoError}
                onClick={editJsonModalOkHandler}
              >
                ??????
              </Button>
            </div>
          }
          destroyOnClose
        >
          <MonacoEditor
            value={editJsonModalContent}
            onValidate={handleEditorValidation}
            onMount={handleEditorDidMount}
          />
        </Modal>
        <Modal
          title="??????"
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          okType="danger"
          onOk={deleteModalOkButtonClickHandler}
        >
          ??????????????????????????????????????????????????????
          <br />
          {selectedRowKeys.map((id) => (
            <>
              {id}
              <br />
            </>
          ))}
          <br />
          <b>????????????????????????</b>
        </Modal>
      </Spin>
    </>
  );
};

export default Songs;
