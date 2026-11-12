const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const app = express()
const port = 3000

// 允许跨域，前端html才能访问
app.use(cors())
// 解析json请求体
app.use(express.json())

// 数据文件路径，data.json用来存数据，实现落盘
const DATA_FILE = path.join(__dirname, 'data.json')

// 初始化文件：不存在就新建空数组
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]))
  }
}
// 读取json
function readList() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}
// 写入json保存
function saveList(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2))
}
initData()

// 接口1：GET 获取列表
app.get('/api/list', (req, res) => {
  try {
    const list = readList()
    res.json({ code: 200, data: list, msg: "查询成功" })
  } catch (e) {
    res.json({ code: 500, data: null, msg: "读取数据失败" })
  }
})

// 接口2：POST 新增
app.post('/api/add', (req, res) => {
  try {
    const { title, desc } = req.body
    // 参数校验：title必填，缺了返回400（任务硬性要求）
    if (!title || typeof title !== 'string') {
      return res.json({ code: 400, data: null, msg: "title不能为空，必须是字符串" })
    }
    const list = readList()
    const newItem = {
      id: Date.now(),
      title,
      desc: desc || ""
    }
    list.push(newItem)
    saveList(list)
    res.json({ code: 200, data: newItem, msg: "新增成功" })
  } catch (e) {
    res.json({ code: 500, data: null, msg: "新增异常" })
  }
})

// 接口3：DELETE 删除
app.delete('/api/del', (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.json({ code: 400, data: null, msg: "id不能为空" })
    }
    let list = readList()
    const idx = list.findIndex(item => item.id === Number(id))
    if (idx === -1) {
      return res.json({ code: 400, data: null, msg: "id不存在" })
    }
    list.splice(idx, 1)
    saveList(list)
    res.json({ code: 200, data: null, msg: "删除成功" })
  } catch (e) {
    res.json({ code: 500, data: null, msg: "删除异常" })
  }
})

app.listen(port, () => {
  console.log(`服务启动成功，访问 http://127.0.0.1:${port}`)
})