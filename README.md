# ShowMe - AI 简历生成器（纯前端）

一个高颜值、可本地直接运行的 AI 简历生成页面。

- 用户填写简历信息
- 支持本地模式 / 自定义 API Key 模式 / 次数模式（演示）
- 支持中英双语生成
- 支持模板与主题切换
- 支持一页纸自动压缩与 PDF 导出

## 项目结构

- `/Users/zhiyujiang/Documents/showMe/index.html`：页面结构
- `/Users/zhiyujiang/Documents/showMe/styles.css`：视觉样式与模板/主题样式
- `/Users/zhiyujiang/Documents/showMe/app.js`：业务逻辑（生成、渲染、导出）

## 功能概览

### 1) 信息填写
- 基础字段：姓名、目标岗位、邮箱、电话、个人简介
- 列表字段：工作经历、教育经历、项目经历、技能
- 内置模拟档案：前端 / 产品 / 运营，可一键填充

### 2) AI 生成
支持三种模式：

- 本地算力优先（无 API）
  - 使用前端逻辑进行内容润色与结构化输出
  - 不发起模型请求

- 使用我的 API Key
  - 通过浏览器直接调用兼容 OpenAI Chat Completions 的接口
  - 默认地址：`https://api.moonshot.cn/v1/chat/completions`
  - 可自动读取可用模型（`/v1/models`）

- 付费次数模式（演示）
  - 次数余额保存在 `localStorage`
  - 仅用于前端 demo，真实支付/计费需后端实现

### 3) 预览与样式
- 模板风格：`Elegant / Modern / Minimal`
- 主题配色：`Sand / Forest / Ocean`
- 输出语言：`中文 / English / 中英双语`

### 4) 一页纸优化
- 可开启“自动压缩为一页 A4”
- 采用“内容裁剪 + 紧凑排版”逐级尝试
- 超长内容会提示可能超过一页

### 5) PDF 下载
- 使用 `html2canvas + jsPDF` 在前端导出
- 自动分页，文件名默认：`<name>_resume.pdf`

## 快速开始

### 方式一：直接双击打开
直接打开 `index.html` 可查看页面。

### 方式二：本地静态服务（推荐）
在项目目录运行：

```bash
cd /Users/zhiyujiang/Documents/showMe
python3 -m http.server 5173
```

浏览器访问：

- [http://localhost:5173](http://localhost:5173)

## 使用说明

1. 填写表单，或点击“填充真实模拟数据”
2. 选择生成模式与风格
3. 点击“生成 AI 简历”
4. 点击“下载 PDF”导出

## 安全与隐私说明

- 本项目是纯前端架构，不依赖自建后端。
- 你填写的 API Key 会保存在浏览器 `localStorage`，仅当前浏览器可见。
- 不建议在共享设备中长期保存 API Key。
- 次数模式仅为演示，未实现真实支付安全链路。

## 兼容性建议

- 推荐使用最新版 Chrome / Edge / Safari。
- 若导出清晰度不理想，可提高浏览器缩放比例后再导出。

## 后续可扩展方向

- 接入真实支付与安全计费服务（后端）
- 增加多行业简历模板库
- 增加 ATS 关键词匹配评分
- 支持导出 `.docx` / Markdown 简历

