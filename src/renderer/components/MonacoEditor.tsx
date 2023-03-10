import * as monaco from 'monaco-editor';
import OriginalMonaco, { EditorProps, loader } from '@monaco-editor/react';
import React, { useEffect } from 'react';
import { Spin } from 'antd';

loader.config({ monaco });

export const MonacoEditor: React.FC<EditorProps> = (props) => {
  return (
    <OriginalMonaco
      height="75vh"
      width="100%"
      defaultLanguage="json"
      theme="vs-dark"
      saveViewState={false}
      loading={<Spin tip="加载编辑器..." delay={100} />}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

export default MonacoEditor;
