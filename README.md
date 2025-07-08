# tree-world

## 现有功能点

### 基础表格功能

- 树形表格展示，支持层级数据结构
- 可调整列宽，支持列拖拽排序
- 数据分表格展示和抽屉详情展示两部分
- 支持搜索/排序功能
- Dark主题支持

### 数据管理

- 数据来源可以自定义实现，支持按层级加载树结构
- 调用后端API接口（任务列表、修改、删除等）
- 数据持久化：展开状态和列宽的localStorage持久化
- 支持任务排序（prevID机制）

### 交互功能

- **任务创建**：支持Enter/Tab快捷键，并且选中新任务
- **任务删除**：支持Del快捷键，二次确认Del/Esc，选中删除位置最近任务
- **任务移动**：支持拖拽行移动任务位置
- **单元格编辑**：
  - F2键或双击进入编辑状态
  - Esc键退出编辑状态
  - 修改详情里的值调用后端接口

### 导航和快捷键

- **方向键导航**：支持上下左右键在树表中选中单元格
  - 上键：递归处理"上一个节点"展开时的情况
  - 下键：递归处理"最后一个节点"跳到"父节点的下一个节点"
- **空格键**：展开/折叠被选中单元格对应的树节点
  - 没有子节点的行，不展示"展开按钮"
- **F3键**：打开/收起抽屉
- 页面上方展示快捷键说明

### UI优化

- 拖拽目标位置效果提示
- 添加空列作为选中点击位置，支持指定列为展开列
- 优化展示细节和操作后选中逻辑
- 选择列功能

## TODO

暂时没有新的计划啦~

跑去玩多维表格了~

## 创建工程

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
先浏览器继续搞吧，回头再研究打包的问题

```bat
rd /s /q node_modules
rd /s /q .pnpm
del pnpm-lock.yaml
pnpm store prune
pnpm cache delete
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
pnpm install
```

## 调用后端接口

可能swagger官方推新的hub平台，所以这套工具没有更新了，各方面细节搭不上吧
可能而已，不管了，累了

### openapi-generator-cli

可行

```sh
pnpm install -g @openapitools/openapi-generator-cli

# 需要安装java
openapi-generator-cli generate -i ../../pgo/openapi.yaml -g typescript-axios --additional-properties=apiPackage=api,modelPackage=model,withSeparateModelsAndApi=true -o ./api/ --skip-validate-spec
```

### [swagger 官方平台](https://app.swaggerhub.com/hub/)

倒是可行的，可以直接导出 SDK
但是需要企业版，利用免费 30 天导出了一版，保存在 api-swaggerhub 了

### [swagger 官方工具1](https://github.com/swagger-api/swagger-codegen/blob/master/docs/docker.md)

失败
其实还挺复杂（从0开始的话）

- 服务端工程从proto生成openapi.yaml
- 把 openapi.yaml 转换成 json
  - 失败，直接转格式，报错 yaml 格式有问题
    - `pnpm install -g yaml2json`
    - `yaml2json ../../pgo/openapi.yaml > openapi.json`
  - 只能趁着swaggerhub免费30天转换成json
- json要以http-get提供
  - 我用docker[swaggerapi/swagger-ui]部署的
  - 对应下面示例的`http://192.168.3.159:8080`
- 部署docker[swaggerapi/swagger-generator]
  - 对应下面示例的`http://192.168.3.159:8081`
- 从网页访问或者curl直接访问
  - 浏览器网页访问遇到cors问题
  - curl能访问，但是报错，累了，放弃了

```sh
# 记得替换IP
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"swaggerUrl": "http://192.168.3.159:8080/api_standard.json"}' 'http://192.168.3.159:8081/api/gen/clients/javascript'
# 报错
{"code":1,"type":"error","message":"The swagger specification supplied was not valid"}
```

### [swagger 官方工具2](https://github.com/swagger-api/swagger-codegen/blob/master/docs/docker.md)

失败

```sh
# win cmd
docker run --rm -v %CD%:/local swaggerapi/swagger-codegen-cli generate -i /local/openapi.json -l typescript-fetch -o /local/api/ -v

# git-bash 在win上执行时，路径解析有问题，-i变成了D:/xxx/Git/local/openapi.json
# docker run --rm -v ${PWD}:/local swaggerapi/swagger-codegen-cli generate -i /local/openapi.json -l typescript-fetch -o /local/api/ -v
```

烦死了，文件确定读取到了，但是不知道缺什么参数
报错`missing swagger input or config`
估计和上面工具1报错`The swagger specification supplied was not valid`差不多

```log
[main] INFO io.swagger.codegen.config.CodegenConfigurator -
VERBOSE MODE: ON. Additional debug options are injected
 - [debugSwagger] prints the swagger specification as interpreted by the codegen
 - [debugModels] prints models passed to the template engine
 - [debugOperations] prints operations passed to the template engine
 - [debugSupportingFiles] prints additional data passed to the template engine
[main] INFO io.swagger.parser.Swagger20Parser - reading from /local/openapi.json
[main] INFO io.swagger.parser.Swagger20Parser - reading from /local/openapi.json
[main] INFO io.swagger.codegen.ignore.CodegenIgnoreProcessor - No .swagger-codegen-ignore file found.
Exception in thread "main" java.lang.RuntimeException: missing swagger input or config!
        at io.swagger.codegen.DefaultGenerator.generate(DefaultGenerator.java:766)
        at io.swagger.codegen.cmd.Generate.run(Generate.java:307)
        at io.swagger.codegen.SwaggerCodegen.main(SwaggerCodegen.java:35)
```

## [commitlint](`https://github.com/conventional-changelog/commitlint`)

| prefix   | desc       |
| -------- | ---------- |
| build    | 构建相关   |
| chore    | 杂项       |
| ci       | CI/CD 相关 |
| docs     | 文档       |
| feat     | 功能       |
| fix      | 修复       |
| perf     | 性能       |
| refactor | 重构       |
| revert   | 回退       |
| style    | 代码风格   |
| test     | 测试       |
