# Arcaea Assets Manager
---

一个[Arcaea](https://arcaea.lowiro.com/)资产管理器。

## Troubleshooting

### Linux

#### 提示找不到libz.so

ARM架构的AppImage打包可能存在这样的问题。参见：[这个Issue](https://github.com/AppImage/AppImageKit/issues/964)

你可以安装`zlib1g-dev`来解决这个问题，把`libz.so.1`链接到`libz.so`似乎也是可行的。


