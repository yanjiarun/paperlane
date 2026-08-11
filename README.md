# Paperlane · 每日学术

Paperlane 是可安装到电脑和手机的每日论文阅读器。未登录时全部功能保存在本机；配置并登录账号后，已读、重要、分组和期刊设置会在多设备之间同步。

## 两种运行方式

- 本机模式：双击 Start-Paperlane.bat，通过本机 Python 服务手动实时刷新。
- GitHub Pages 模式：使用统一 HTTPS 地址在多设备安装；GitHub Actions 每 6 小时免费更新公开论文数据。

两种模式使用同一套界面和本地数据库。GitHub Pages 会按期刊分别下载数据，只加载“管理”中勾选的来源；IEEE 在浏览器中按 EA 和最近 1/2/3/5 期筛选。

## 启动与安装

Windows 上双击 **Start-Paperlane.bat**，浏览器会打开 http://localhost:8765 。退出时双击 **Stop-Paperlane.bat**。

右上角圆形账号按钮可以打开“账号与设备”。浏览器支持安装时，可以点击“安装 Paperlane”；iPhone/iPad 使用 Safari 的“分享 > 添加到主屏幕”。

直接打开 **index.html** 只能使用已有离线缓存或演示数据。刷新真实论文必须通过 **Start-Paperlane.bat** 启动本地服务。

## 本地与离线

- 论文缓存使用 IndexedDB，并在支持时通过浏览器原生 gzip 压缩。
- 已读、重要和分组按单条记录保存，不复制整份论文列表。
- 页面每次只渲染 60 篇论文，点击“显示更多”继续加载。
- Service Worker 只缓存应用文件；论文 API 响应不会被重复缓存。
- 网络或云端不可用时，阅读与标记功能不受影响。
- 登录状态下产生的操作会进入去重队列，恢复联网后自动同步。

首次升级会自动迁移旧版 localStorage 数据，迁移成功后清理旧副本。

## 启用 Supabase 账号同步

Paperlane 在没有 Supabase 的情况下可以一直使用。要启用多设备同步：

1. 创建一个 Supabase 免费项目。
2. 打开 Supabase 的 SQL Editor，完整运行 **supabase-schema.sql**。
3. 在 Authentication > Providers > Email 中启用邮箱和密码登录。
4. 在 Project Settings > API 找到 Project URL 和 anon public key。
5. 用文本编辑器打开 **supabase-config.js**，将 url 和 anonKey 后面的空字符串分别改成这两个值。
6. 重新启动 Paperlane，点击右上角 L 注册或登录。

anon key 本来就是公开前端密钥，安全边界由数据库 RLS 策略保证。不要把 service_role key 写入 Paperlane，也不要发给其他人。

发布到 GitHub Pages 时不需要把配置写进代码。可以在 GitHub Actions Repository variables 中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY，构建时会自动生成配置。

## 同步规则

- 游客数据和每个账号使用独立的本地空间。
- 首次登录时，当前设备的游客记录会合并到账号；原游客记录仍留在本机。
- 同一条记录在不同设备被修改时，以较新的修改时间为准。
- 删除分组或取消标记会保留删除标记，避免离线设备把旧状态重新上传。
- 退出登录会清理令牌和该账号在当前设备的同步缓存，再切回游客空间；云端数据和公共论文缓存不受影响。
- “清除本机记录”不会删除云端账号数据。

## 数据与安全

云端只保存已读、重要、分组、期刊设置，以及重要/分组论文的少量题录快照。不会上传论文全文、本机文件、普通浏览轨迹或邮箱密码。密码由 Supabase Auth 处理，Paperlane 不保存密码。

数据库脚本为五张用户表强制启用 RLS，并分别限制查询、新增、修改和删除只能操作 user_id = auth.uid() 的数据。前端仅使用 anon key。Supabase 不是端到端加密服务，因此不要在分组名等字段中存放敏感信息。

## 论文数据

- arXiv：官方 API，支持最近 1 至 365 天，单次最多 500 篇。
- Nature / Science：官方 RSS 当前公开的全部条目。
- IEEE：Xplore 官网页面接口，支持 Early Access、最新 1/2/3/5 期及组合；接口异常时回退官方 RSS。
- 历史题录本地保留 730 天。论文原文始终通过出版社或 arXiv 原始链接打开，不缓存受版权保护的全文。

## GitHub 发布与更新

完整的小白操作步骤见 **PUBLISHING.md**。项目已经包含：

- GitHub Pages 自动部署工作流。
- 每 6 小时定时更新论文的工作流。
- 按期刊拆分静态数据的构建命令。
- PWA 新版本提示和离线回退。
- 推送 v 开头标签后自动生成 Windows 压缩包的 Release 工作流。

静态网站构建命令：

    python paperlane_server.py --build-static _site --days 365 --ieee-scope ea+5

不联网、只用现有缓存测试构建：

    python paperlane_server.py --build-static _site --static-from-cache
