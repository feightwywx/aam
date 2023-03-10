import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  dialog,
} from 'electron';
import log from 'electron-log';

import { globalStore } from '../globalStore';
import { loadSonglistIPC } from './utils/assets';
import {
  generatePackageMenuHandlerFactory,
  importBgMenuHandlerFactory,
  importSongMenuHandlerFactory,
  verifyMenuHandlerFactory,
} from './menuHandler';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: '审查元素',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Arcaea 资产管理器',
      submenu: [
        {
          label: '关于 AAM',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        {
          label: '打开...',
          accelerator: 'Command+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(
              this.mainWindow,
              {
                properties: ['openDirectory', 'treatPackageAsDirectory'],
              }
            );
            if (!canceled) {
              const songlist = await loadSonglistIPC(filePaths[0]);
              if (songlist.code === 0) {
                this.mainWindow.webContents.send('aam:pushSongs', {
                  path: filePaths[0],
                  songs: songlist.data,
                });
              } else {
                dialog.showErrorBox('错误', songlist.message);
              }
            }
          },
        },
        {
          id: 'file.import',
          label: '导入',
          submenu: [
            {
              id: 'file.import.song',
              label: '歌曲',
              accelerator: 'Command+I',
              click: importSongMenuHandlerFactory(this.mainWindow),
              enabled: false,
            },
            {
              id: 'file.import.songLink',
              label: '歌曲（链接模式）',
              accelerator: 'Shift+Command+I',
              click: importSongMenuHandlerFactory(this.mainWindow, true),
              enabled: false,
            },
            { type: 'separator' },
            {
              id: 'file.import.bg',
              label: '背景',
              click: importBgMenuHandlerFactory(this.mainWindow),
              enabled: false,
            },
          ],
        },
        {
          id: 'file.closeFolder',
          label: '关闭文件夹',
          accelerator: 'Shift+Command+W',
          click: () => {
            this.mainWindow.webContents.send('aam:closeFolder');
          },
          enabled: false,
        },
        { type: 'separator' },
        { label: '服务', role: 'services', submenu: [] },
        { type: 'separator' },
        {
          label: '隐藏 AAM',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: '隐藏其他',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: '全部显示', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: '退出 AAM',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'Command+Z', selector: 'undo:' },
        { label: '重做', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'Command+X', selector: 'cut:' },
        { label: '复制', accelerator: 'Command+C', selector: 'copy:' },
        { label: '粘贴', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: '全选',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuBuild: DarwinMenuItemConstructorOptions = {
      id: 'build',
      label: '生成',
      submenu: [
        {
          id: 'build.build',
          label: '生成...',
          accelerator: 'F5',
          click: generatePackageMenuHandlerFactory(this.mainWindow),
          enabled: false,
        },
        { type: 'separator' },
        {
          id: 'build.verify',
          label: '验证依赖',
          accelerator: 'F6',
          click: verifyMenuHandlerFactory(this.mainWindow),
          enabled: false,
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: '查看',
      submenu: [
        {
          label: '重新载入',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: '切换全屏幕',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: '切换开发者工具',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: '查看',
      submenu: [
        {
          label: '切换全屏幕',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: '窗口',
      role: 'window',
      submenu: [
        {
          label: '最小化',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: '关闭', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: '全部置于顶层', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '了解更多',
          click() {
            shell.openExternal('https://github.com/feightwywx/aam');
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuEdit,
      subMenuBuild,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '文件(&F)',
        submenu: [
          {
            label: '打开...(&O)',
            accelerator: 'Ctrl+O',
            click: async () => {
              const { canceled, filePaths } = await dialog.showOpenDialog(
                this.mainWindow,
                {
                  properties: ['openDirectory', 'treatPackageAsDirectory'],
                }
              );
              if (!canceled) {
                const songlist = await loadSonglistIPC(filePaths[0]);
                if (songlist.code === 0) {
                  this.mainWindow.webContents.send('aam:pushSongs', {
                    path: filePaths[0],
                    songs: songlist.data,
                  });
                } else {
                  dialog.showErrorBox('错误', songlist.message);
                }
              }
            },
          },
          {
            id: 'file.import',
            label: '导入',
            submenu: [
              {
                id: 'file.import.song',
                label: '歌曲(&S)',
                accelerator: 'Ctrl+I',
                click: importSongMenuHandlerFactory(this.mainWindow),
                enabled: false,
              },
              {
                id: 'file.import.songLink',
                label: '歌曲（链接模式）(&L)',
                accelerator: 'Shift+Ctrl+I',
                click: importSongMenuHandlerFactory(this.mainWindow, true),
                enabled: false,
              },
              { type: 'separator' },
              {
                id: 'file.import.bg',
                label: '背景(&B)',
                click: importBgMenuHandlerFactory(this.mainWindow),
                enabled: false,
              },
            ],
          },
          {
            id: 'file.closeFolder',
            label: '关闭文件夹(&F)',
            accelerator: 'Shift+Ctrl+W',
            click: () => {
              this.mainWindow.webContents.send('aam:closeFolder');
            },
            enabled: false,
          },
          {
            label: '关闭(&C)',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '生成(&B)',
        submenu: [
          {
            id: 'build.build',
            label: '生成...(&G)',
            accelerator: 'F5',
            click: generatePackageMenuHandlerFactory(this.mainWindow),
            enabled: false,
          },
          { type: 'separator' },
          {
            id: 'build.verify',
            label: '验证依赖(&V)',
            accelerator: 'F6',
            click: verifyMenuHandlerFactory(this.mainWindow),
            enabled: false,
          },
        ],
      },
      {
        label: '查看(&V)',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '重新加载(&R)',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: '切换全屏(&F)',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  },
                },
                {
                  label: '切换开发者工具(&D)',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.webContents.toggleDevTools();
                  },
                },
              ]
            : [
                {
                  label: '切换全屏(&F)',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  },
                },
              ],
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '了解更多',
            click() {
              shell.openExternal('https://github.com/feightwywx/aam');
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
