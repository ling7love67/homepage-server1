/**
 * 任务2 + 任务3：Node.js + Express 接口服务
 *
 * - 数据存储：本地 data.json，关闭服务后数据保留
 * - 跨域：统一用 cors() 在服务端加响应头，不去改浏览器安全策略
 * - 前端：public/ 下的页面通过 fetch 调这些接口
 *
 * 启动：npm install && node server.js
 * 调试：DEBUG_DELAY_MS=3000 可让列表接口慢 3 秒，方便截「加载中」状态图
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const DEBUG_DELAY_MS = Number(process.env.DEBUG_DELAY_MS) || 0;

const app = express();
app.disable("x-powered-by");

// 跨域：允许任意来源访问接口（本地 file://、其他端口、线上域名都能调）
app.use(cors());
// 解析 application/json 请求体
app.use(express.json({ limit: "1mb" }));
// 同时把 public/ 当静态站点托管，前后端同源时连跨域都省了
app.use(express.static(PUBLIC_DIR));

// ---------- 数据读写 ----------

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
  }
}

function readList() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
  if (!raw) return [];
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error("data.json 必须是数组");
  return list;
}

// 先写临时文件再重命名，避免写到一半把 data.json 写坏
function saveList(list) {
  const tmp = path.join(__dirname, `.data.${process.pid}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function fail(res, status, msg) {
  return res.status(status).json({ code: status, data: null, msg });
}

// ---------- 接口 ----------

// 健康检查：部署后先访问这个确认服务活着
app.get("/api/health", (req, res) => {
  res.json({ code: 200, data: { status: "up", time: new Date().toISOString() }, msg: "ok" });
});

// 接口1：GET /api/list 获取列表
app.get("/api/list", (req, res) => {
  try {
    const list = readList();
    // 调试用：模拟慢接口，用来演示 loading 状态
    setTimeout(() => {
      res.json({ code: 200, data: list, msg: "查询成功" });
    }, DEBUG_DELAY_MS);
  } catch (err) {
    console.error("[GET /api/list]", err);
    fail(res, 500, "读取数据失败");
  }
});

// 接口2：POST /api/add 新增
app.post("/api/add", (req, res) => {
  try {
    const { title, desc } = req.body || {};

    // 参数校验：title 必填
    if (typeof title !== "string" || title.trim() === "") {
      return fail(res, 400, "title 不能为空，且必须是字符串");
    }
    if (title.trim().length > 60) {
      return fail(res, 400, "title 不能超过 60 个字");
    }

    const list = readList();
    const item = {
      id: Date.now(),
      title: title.trim(),
      desc: typeof desc === "string" ? desc.trim() : ""
    };
    list.push(item);
    saveList(list);

    res.json({ code: 200, data: item, msg: "新增成功" });
  } catch (err) {
    console.error("[POST /api/add]", err);
    fail(res, 500, "新增失败");
  }
});

// 接口3：DELETE /api/del?id=123（也兼容 body 里传 id）
app.delete("/api/del", (req, res) => {
  try {
    const rawId = req.query.id ?? (req.body || {}).id;
    if (rawId === undefined || rawId === null || rawId === "") {
      return fail(res, 400, "id 不能为空");
    }

    const list = readList();
    const index = list.findIndex((item) => String(item.id) === String(rawId));
    if (index === -1) {
      return fail(res, 404, "id 不存在");
    }

    const [removed] = list.splice(index, 1);
    saveList(list);

    res.json({ code: 200, data: removed, msg: "删除成功" });
  } catch (err) {
    console.error("[DELETE /api/del]", err);
    fail(res, 500, "删除失败");
  }
});

// 未匹配的接口统一返回 JSON，避免前端拿到一段 HTML 解析失败
app.use("/api", (req, res) => {
  fail(res, 404, "接口不存在");
});

// 兜底错误处理（例如请求体不是合法 JSON）
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return fail(res, 400, "请求体不是合法的 JSON");
  }
  console.error("[server error]", err);
  fail(res, 500, "服务器内部错误");
});

// 监听端口：默认 3000；被系统保留或被占用时自动往后试 3001~3005
let server = null;

function listen(port, remaining) {
  let started = false;
  const attempt = app.listen(port, HOST);

  attempt.on("listening", () => {
    started = true;
    server = attempt;
    const actual = attempt.address().port;
    console.log(`服务已启动: http://${HOST}:${actual}`);
    console.log(`数据文件: ${DATA_FILE}`);
    if (DEBUG_DELAY_MS) console.log(`调试：列表接口将延迟 ${DEBUG_DELAY_MS}ms`);
  });

  attempt.on("error", (err) => {
    if (started) return;
    if ((err.code === "EACCES" || err.code === "EADDRINUSE") && remaining > 0) {
      console.warn(`端口 ${port} 不可用（${err.code}），尝试 ${port + 1} …`);
      listen(port + 1, remaining - 1);
      return;
    }
    console.error("启动失败:", err.message);
    process.exit(1);
  });
}

listen(PORT, 5);

// Ctrl+C 时优雅退出，数据已经写在 data.json 里
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    console.log(`\n收到 ${signal}，服务已关闭，数据保存在 data.json`);
    if (server) server.close(() => process.exit(0));
    else process.exit(0);
  });
});
