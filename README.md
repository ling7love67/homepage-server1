# homepage-server1

前端实训作业：个人主页 + 项目列表，Node.js + Express 接口服务，数据存本地 JSON 文件。

- 任务2：后端接口服务（列表 / 新增 / 删除，数据落盘）
- 任务3：前后端联调（fetch 渲染、三态、增删后刷新、地址抽成配置、服务端 CORS）

## 目录结构

```text
homepage-server1/
├── server.js              # Express 服务：接口 + 托管 public/
├── data.json              # 数据文件（接口读写的就是它）
├── package.json
├── public/                # 前端页面
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js      # 后端地址配置（只有这里写地址）
│       └── app.js         # 三态渲染、新增、删除、重试
└── README.md
```

## 启动

```bash
npm install
node server.js
```

打开 <http://127.0.0.1:3000>（端口被占用或系统保留时会自动往后试 3001~3005，看控制台输出的实际地址）。

数据文件是 `data.json`，关闭服务再启动数据依然在。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/list` | 列表，返回 `{ code: 200, data: [], msg }` |
| POST | `/api/add` | 新增，body `{ title, desc }`，title 必填 |
| DELETE | `/api/del?id=123` | 删除，id 必填 |
| GET | `/api/health` | 健康检查 |

统一返回：`{ code, data, msg }`；`code` 与 HTTP 状态码一致（200 成功、400 参数错误、404 不存在、500 服务异常）。

```bash
curl http://127.0.0.1:3000/api/list
curl -X POST http://127.0.0.1:3000/api/add -H "Content-Type: application/json" -d "{\"title\":\"新项目\",\"desc\":\"描述\"}"
curl -X DELETE "http://127.0.0.1:3000/api/del?id=1762900000001"
```

## 任务3 要求对照

| 要求 | 实现位置 |
| --- | --- |
| fetch 调接口渲染，不写死数组 | `public/js/app.js` 的 `request()` / `renderList()` |
| loading 状态 | `renderLoading()`：转圈 + 骨架屏 |
| empty 状态 | `renderEmpty()`：空提示 + 「去添加」按钮 |
| error 状态 + 重试按钮 | `renderError()`：显示失败原因 + 「重新加载」 |
| 新增/删除后自动刷新 | `addItem()` / `deleteItem()` 成功后 `await loadList()` |
| F5 数据仍在 | 数据落盘 `data.json`，刷新只是重新 GET `/api/list` |
| 后端地址抽成配置 | `public/js/config.js` 的 `API_BASE_URL` |
| CORS 在服务端解决 | `server.js` 里 `app.use(cors())`，响应头 `Access-Control-Allow-Origin: *` |

## 部署上线

1. `public/js/config.js` 里的 `API_BASE_URL`：
   - 前后端同一个服务（本项目默认）：留空 `""`，走同源请求；
   - 前端单独部署：填线上后端完整地址，例如 `https://xxx.onrender.com`。
2. 部署平台（任选）：Render / Railway / 阿里云函数计算 / 自己的云服务器。
   - 构建命令：`npm install`
   - 启动命令：`node server.js`
   - 平台会注入 `PORT` 环境变量，`server.js` 已经读取了它。
3. 部署后先访问 `/api/health` 确认接口活着，再打开首页。

## 真机问题记录（本次联调实际踩到的）

**问题1：端口 3000 起不来，报 `EACCES: permission denied 127.0.0.1:3000`**

- 现象：`node server.js` 启动即退出，报错 `Error: listen EACCES: permission denied 127.0.0.1:3000`。
- 原因：这台 Windows 把 3000 划进了系统保留/排除端口段（Hyper-V、WSL 之类会预留端口），普通用户没有绑定权限，不是代码问题。
- 处理：在 `server.js` 里加了端口回退，3000 不可用就自动试 3001~3005，并把实际端口打印到控制台；前端因为走同源，不需要改地址。
- 这正好说明「后端地址不能写死在业务代码里」：地址一变，写死的页面就全挂。

**问题2：CORS 响应头验证**

```bash
curl -i -H "Origin: http://localhost:5173" http://127.0.0.1:3001/api/list
```

响应里能看到：

```text
Access-Control-Allow-Origin: *
```

说明跨域是在服务端加响应头解决的；把 `app.use(cors())` 注释掉再测，浏览器控制台会报
`blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`，
前端 `fetch` 直接进 catch，页面落到 error 状态。

## 三态截图

放在 `docs/screenshots/`：

| 文件 | 状态 |
| --- | --- |
| `01-list-normal.png` | 正常列表 |
| `02-empty.png` | 空数据 |
| `03-error.png` | 请求失败 + 重试按钮 |
| `04-loading.png` | 加载中（`DEBUG_DELAY_MS=6000` 模拟慢接口） |

自己补截也可以：

```bash
# 空数据：把 data.json 改成 []
# 失败：停掉服务再刷新页面
# 加载中：DEBUG_DELAY_MS=6000 node server.js，刷新页面立刻截
DEBUG_DELAY_MS=6000 node server.js
```
