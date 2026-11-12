# 前端实训个人主页

一个用原生 HTML5 + CSS3 + JavaScript 手写的响应式个人主页，包含首页、项目详情页和自定义 404 页面。没有使用框架，也没有构建步骤，所有文件上传到 GitHub Pages 即可访问。

- **线上地址：** <https://ling7love67.github.io/ling7love67/>
- **仓库地址：** <https://github.com/ling7love67/ling7love67>

## 一、页面与功能

### 首页 `index.html`

- 顶部导航：首页 / 项目详情，两页可以互相跳转。
- 三个 Tab：自我介绍、技能栈、第一阶段项目，点击切换显示内容。
- “第一阶段项目”列表由 `fetch("data/projects.json")` 读取 JSON 后动态渲染。
- 屏幕宽度 ≤ 375px 时，导航和 Tab 按钮自动变为整行排列。

### 详情页 `detail.html`

- 任务清单：输入任务内容后点击“添加任务”，或直接按回车添加。
- 勾选复选框切换完成状态，已完成的任务文字显示删除线。
- 顶部导航可以返回首页。

### 404 页面 `404.html`

- 访问不存在的地址时，GitHub Pages 会自动返回这个页面（HTTP 状态码仍为 404）。
- 页面显示大号 404、当前请求的路径，以及“返回首页”按钮。

## 二、目录结构

```text
9/
├─ index.html          # 首页：自我介绍 / 技能栈 / 项目列表
├─ detail.html         # 项目详情页：任务清单
├─ 404.html            # 自定义 404 页面
├─ css/
│  └─ style.css        # 全站样式（两页共用）
├─ js/
│  ├─ main.js          # 首页：Tab 切换 + fetch 项目数据
│  └─ detail.js        # 详情页：任务新增与完成状态切换
├─ data/
│  └─ projects.json    # fetch 请求的数据文件
└─ README.md           # 本文件
```

## 三、本地打开方式

> 页面里使用了 `fetch()`，**建议通过本地 HTTP 服务打开**，不要直接双击 HTML 文件。
> `file://` 协议下浏览器会拦截 fetch，控制台会报跨域错误，“第一阶段项目”列表会显示“项目数据加载失败”。

### 方式 A：VS Code + Live Server（推荐）

1. 用 VS Code 打开本项目所在的文件夹（`9` 文件夹）。
2. 在扩展商店安装 **Live Server**。
3. 在 `index.html` 上右键，选择 **Open with Live Server**。
4. 浏览器会自动打开，地址类似 `http://127.0.0.1:5500/index.html`。

### 方式 B：Python 自带的静态服务器

在项目文件夹中打开终端，执行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://127.0.0.1:8000/
```

> 如果终端提示“找不到 python”，说明电脑没有安装 Python，直接用方式 A 的 Live Server 即可。

### 方式 C：Node.js

```bash
npx serve .
```

按终端提示打开对应地址即可。

### 方式 D：直接双击 HTML

可以查看页面结构和样式，但 `fetch` 会被浏览器拦截，“第一阶段项目”列表无法加载。抓包练习请不要用这种方式。

> 本地服务器（Python、Live Server）遇到不存在的路径时只会返回简单的 404 文本；`404.html` 是 GitHub Pages 的规则，只有在线上访问错误地址时才会显示。

## 四、抓包练习（F12 → Network）

在线上首页按 `F12` 打开开发者工具，进入 **Network** 面板，勾选“禁用缓存”后刷新页面，可以看到以下请求：

| # | 请求 | 方法 | 状态码 | 发起位置 |
| --- | --- | --- | --- | --- |
| 1 | `index.html` | GET | 200 | 页面主文档 |
| 2 | `css/style.css` | GET | 200 | `index.html` 第 7 行的 `<link>` |
| 3 | `js/main.js` | GET | 200 | `index.html` 第 52 行的 `<script>` |
| 4 | `data/projects.json` | GET | 200 | `js/main.js` 第 57 行的 `fetch()` |

其中第 4 条会出现在 **Fetch/XHR** 标签里。耗时直接看 Network 表格的“时间”列。

### 404 测试

故意访问一个不存在的地址：

```text
https://ling7love67.github.io/ling7love67/this-page-does-not-exist
```

服务器返回 **404 Not Found**，页面显示自定义的 404 内容，并把错误路径回显出来。

## 五、实现说明

- **样式外置**：所有样式集中在 `css/style.css`，两个页面共用；`body` 上的 `page-home` / `page-detail` 类用于区分页面专属规则。
- **脚本外置**：`js/main.js` 负责首页，`js/detail.js` 负责详情页，HTML 中不写行内脚本。
- **数据驱动**：项目列表来自 `data/projects.json`，新增项目只需要改 JSON，不用改 HTML。
- **相对路径**：CSS、JS、JSON 都使用相对路径，因此部署在 `https://用户名.github.io/仓库名/` 这样的子目录下也能正常加载。
- **响应式**：通过 `@media (max-width: 375px)` 适配手机宽度，导航、Tab 和输入框会重新排列。

## 六、部署到 GitHub Pages

1. 打开仓库 **ling7love67/ling7love67**。
2. 点击 **Add file → Upload files**，把 `index.html`、`detail.html`、`404.html` 以及 `css/`、`js/`、`data/` 三个文件夹按原路径上传。
3. 提交后等待约 1 分钟。
4. 打开 <https://ling7love67.github.io/ling7love67/>，按 `Ctrl + F5` 强制刷新。

如果页面还是旧内容，优先检查：

- `css/style.css`、`js/main.js`、`data/projects.json` 是否上传到了正确目录；
- 浏览器是否还在使用缓存（Network 面板勾选“禁用缓存”再刷新）。

---

2026 前端实训作业
