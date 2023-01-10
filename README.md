# Arcaea Assets Manager

一个[Arcaea](https://arcaea.lowiro.com/)资产管理器。

## 功能

- 资产导入
  - 曲目导入，支持每次打包时自动更新曲目资源
  - 背景导入
- 打包
  - ipa和apk打包
  - 依赖验证，检查可能被漏打包的文件

## 使用方法

[看这里](https://www.direcore.xyz/archives/43/)

## Troubleshooting

### Linux

#### 提示找不到libz.so

ARM架构的AppImage打包可能存在这样的问题。参见：[这个Issue](https://github.com/AppImage/AppImageKit/issues/964)

你可以安装`zlib1g-dev`来解决这个问题，把`libz.so.1`链接到`libz.so`似乎也是可行的。


