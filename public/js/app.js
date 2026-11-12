/**
 * 任务3：前端调用接口渲染列表
 * - 三种状态：加载中 loading / 空数据 empty / 请求失败 error（带重试）
 * - 新增、删除后自动刷新列表
 * - 后端地址从 js/config.js 读取，不写死在业务代码里
 */
(function () {
  "use strict";

  var API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "";

  var listEl = document.getElementById("list");
  var countEl = document.getElementById("count");
  var formEl = document.getElementById("addForm");
  var titleEl = document.getElementById("title");
  var descEl = document.getElementById("desc");
  var addBtn = document.getElementById("addBtn");
  var refreshBtn = document.getElementById("refreshBtn");
  var formTip = document.getElementById("formTip");

  var REQUEST_TIMEOUT = 10000; // 10 秒还没响应就按失败处理

  // ---------- 工具函数 ----------

  function api(path) {
    return API_BASE_URL.replace(/\/$/, "") + path;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showTip(message, type) {
    formTip.textContent = message;
    formTip.className = "form-tip " + (type || "error");
    formTip.hidden = !message;
  }

  // 统一请求：处理超时、HTTP 状态码、后端 { code, data, msg } 结构
  async function request(path, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      var res = await fetch(api(path), Object.assign({ signal: controller.signal }, options));
      var body = null;
      try {
        body = await res.json();
      } catch (e) {
        throw new Error("响应不是合法 JSON（HTTP " + res.status + "）");
      }

      if (!res.ok || body.code !== 200) {
        throw new Error(body.msg || "请求失败（HTTP " + res.status + "）");
      }
      return body.data;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("请求超时，接口 10 秒内没有响应");
      }
      if (err instanceof TypeError) {
        throw new Error("连不上后端：" + err.message + "（检查服务是否启动、地址是否正确）");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- 三种状态 ----------

  function renderLoading() {
    countEl.textContent = "";
    listEl.innerHTML =
      '<div class="state state-loading" role="status">' +
      '<span class="spinner" aria-hidden="true"></span>' +
      "<p>正在加载项目列表…</p>" +
      '<div class="skeleton"><span></span><span></span><span></span></div>' +
      "</div>";
  }

  function renderEmpty() {
    countEl.textContent = "共 0 个";
    listEl.innerHTML =
      '<div class="state state-empty">' +
      '<div class="state-icon" aria-hidden="true">📭</div>' +
      "<h3>还没有项目</h3>" +
      "<p>在上面的表单里填一个名称，点「新增」就会写进 data.json。</p>" +
      '<button type="button" class="btn btn-primary" id="emptyAddBtn">去添加第一个项目</button>' +
      "</div>";
    var emptyAdd = document.getElementById("emptyAddBtn");
    if (emptyAdd) emptyAdd.addEventListener("click", function () { titleEl.focus(); });
  }

  function renderError(message) {
    countEl.textContent = "";
    listEl.innerHTML =
      '<div class="state state-error" role="alert">' +
      '<div class="state-icon" aria-hidden="true">⚠️</div>' +
      "<h3>请求失败</h3>" +
      "<p>" + escapeHtml(message) + "</p>" +
      '<button type="button" class="btn btn-primary" id="retryBtn">重新加载</button>' +
      "</div>";
    var retry = document.getElementById("retryBtn");
    if (retry) retry.addEventListener("click", loadList);
  }

  function renderList(items) {
    countEl.textContent = "共 " + items.length + " 个";

    if (!items.length) {
      renderEmpty();
      return;
    }

    listEl.innerHTML = items
      .map(function (item) {
        return (
          '<article class="card">' +
          '<div class="card-main">' +
          "<h3>" + escapeHtml(item.title) + "</h3>" +
          "<p>" + (item.desc ? escapeHtml(item.desc) : '<span class="muted">暂无描述</span>') + "</p>" +
          "</div>" +
          '<button type="button" class="btn btn-danger" data-id="' + escapeHtml(item.id) + '">删除</button>' +
          "</article>"
        );
      })
      .join("");
  }

  // ---------- 交互 ----------

  async function loadList() {
    renderLoading();
    try {
      var items = await request("/api/list");
      renderList(Array.isArray(items) ? items : []);
    } catch (err) {
      renderError(err.message);
    }
  }

  async function addItem(event) {
    if (event) event.preventDefault();

    var title = titleEl.value.trim();
    var desc = descEl.value.trim();

    if (!title) {
      showTip("项目名称不能为空", "error");
      titleEl.focus();
      return;
    }

    addBtn.disabled = true;
    addBtn.textContent = "新增中…";
    showTip("", "");

    try {
      await request("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, desc: desc })
      });
      titleEl.value = "";
      descEl.value = "";
      showTip("新增成功，列表已刷新", "success");
      await loadList(); // 新增后自动刷新
    } catch (err) {
      showTip("新增失败：" + err.message, "error");
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = "新增";
    }
  }

  async function deleteItem(id, button) {
    if (!window.confirm("确定删除这个项目吗？删除后会从 data.json 里移除。")) return;

    button.disabled = true;
    button.textContent = "删除中…";

    try {
      await request("/api/del?id=" + encodeURIComponent(id), { method: "DELETE" });
      await loadList(); // 删除后自动刷新
    } catch (err) {
      button.disabled = false;
      button.textContent = "删除";
      showTip("删除失败：" + err.message, "error");
    }
  }

  // 事件委托：列表内容重渲染后按钮依然有效
  listEl.addEventListener("click", function (event) {
    var button = event.target.closest(".btn-danger");
    if (!button) return;
    deleteItem(button.dataset.id, button);
  });

  formEl.addEventListener("submit", addItem);
  refreshBtn.addEventListener("click", loadList);

  // 首屏加载
  loadList();
})();
