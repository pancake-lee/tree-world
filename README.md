# tree-world

## 创建工程

[参考](https://rsuitejs.com/zh/guide/use-with-create-react-app/)

步骤

```sh
npx create-next-app@latest tree-world --typescript
pnpm run dev

pnpm install electron electron-builder --save-dev
pnpm install wait-on concurrently --save-dev

# 收费的，用不了咯
# pnpm install ag-grid-react ag-grid-community
pnpm install antd --save
```

package.json 修改 scripts 和 build 部分
新建 main.js 作为 electron 启动脚本
新增 app/index.tsx 作为树表 demo

烦死了，pnpm run dev:electron 一直报错 electron 没有安装好
先浏览器继续搞吧

```bat
rd /s /q node_modules
rd /s /q .pnpm
del pnpm-lock.yaml
pnpm store prune
pnpm cache delete
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
pnpm install
```

## CommitLint

`https://github.com/conventional-changelog/commitlint/`
build
chore
ci
docs
feat
fix
perf
refactor
revert
style
test
