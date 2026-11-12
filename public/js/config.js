/**
 * 后端地址配置
 *
 * 三种用法：
 * 1. 本地由 server.js 托管页面（推荐）：留空字符串，请求走同源，自动适配 http://127.0.0.1:3000
 * 2. 页面单独部署到别的域名：填线上后端地址，例如 "https://your-app.onrender.com"
 * 3. 直接双击 html 用 file:// 打开：必须填完整地址 "http://127.0.0.1:3000"
 *
 * 部署上线后只改这一处，不用动 app.js。
 */
window.APP_CONFIG = {
  API_BASE_URL: ""
};
