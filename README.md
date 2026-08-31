# Paperlane · 每日学术

Paperlane 是可安装到电脑和手机的每日论文阅读器。未登录时全部功能保存在本机；配置并登录账号后，已读、重要、分组和期刊设置会在多设备之间同步。

## 两种运行方式

- 本机模式：双击 Start-Paperlane.bat，通过本机 Python 服务手动实时刷新。
- GitHub Pages 模式：使用统一 HTTPS 地址在多设备安装；GitHub Actions 每 6 小时免费更新公开论文数据。

两种模式使用同一套界面和本地数据库。GitHub Pages 会按来源分别下载数据，只加载“管理”中勾选的来源；IEEE 在浏览器中按 EA 和最近 1/2/3/5 期筛选。

## 启动与安装

Windows 上双击 **Start-Paperlane.bat**，浏览器会打开 http://localhost:8765 。退出时双击 **Stop-Paperlane.bat**。

右上角圆形账号按钮可以打开“账号与设备”。浏览器支持安装时，可以点击“安装 Paperlane”；iPhone/iPad 使用 Safari 的“分享 > 添加到主屏幕”。

直接打开 **index.html** 只能使用已有离线缓存或演示数据。刷新真实论文必须通过 **Start-Paperlane.bat** 启动本地服务。

## 本地与离线

- 论文缓存使用 IndexedDB，并在支持时通过浏览器原生 gzip 压缩。
- 已读、重要和分组按单条记录保存，不复制整份论文列表。
- 页面按页渲染论文，支持每页 20、50 或 100 篇，可用上一页/下一页或页码输入框跳转。
- 桌面端分组侧栏右边缘可以拖动调整宽度；分组名过长时会自动换行，悬停也可查看完整名称。
- 每个分组右侧可一键复制全部论文标题，或下载为 TXT 文件。
- Service Worker 只缓存应用文件；论文 API 响应不会被重复缓存。
- 网络或云端不可用时，阅读与标记功能不受影响。
- 登录状态下产生的操作会进入去重队列，恢复联网后自动同步。

首次升级会自动迁移旧版 localStorage 数据，迁移成功后清理旧副本。

## 启用 Supabase 账号同步

Paperlane 在没有 Supabase 的情况下可以一直使用。要启用多设备同步：

1. 创建一个 Supabase 免费项目。
2. 打开 Supabase 的 SQL Editor，完整运行 **supabase-schema.sql**。
3. 在 Authentication > Providers > Email 中启用邮箱和密码登录。
4. 在 Project Settings > API Keys（或项目的 Connect 对话框）找到 Project URL 和 **Publishable key**（`sb_publishable_...`）。旧项目也可以继续使用 legacy anon key。
5. 仅本机模式需要编辑 **supabase-config.js**：将 url 和 anonKey 后面的空字符串分别改成这两个值。
6. 重新启动 Paperlane，点击右上角 L 注册或登录。

publishable/anon key 本来就是公开前端密钥，安全边界由数据库 RLS 策略保证。不要把 secret/service_role key 写入 Paperlane，也不要发给其他人。构建脚本检测到高权限密钥时会终止构建，防止意外发布。

发布到 GitHub Pages 时不要把配置写进代码。在 GitHub Actions Repository variables 中设置 **SUPABASE_URL** 和 **SUPABASE_PUBLISHABLE_KEY**，然后手动重新运行一次 Pages workflow；构建会自动生成配置。旧的 **SUPABASE_ANON_KEY** 变量仍兼容。

若网页账号窗口显示“线上未注入 Supabase 配置”，可直接打开线上 `supabase-config.js` 检查：url 和 anonKey 为空就表示变量尚未进入最近一次 Pages 构建。仅在 GitHub 设置中新增变量不会自动部署，必须重新运行工作流。

### 启用 DeepL 中文翻译

中文开关位于“数据更新于”前面，只翻译当前页的论文标题和摘要。翻译结果按论文 ID 和原文内容指纹保存在本机 IndexedDB 的独立缓存中，刷新页面或翻页不会重复请求；切换回原文不会修改论文数据。

翻译代理使用仓库中的 Supabase Edge Function：

    supabase secrets set DEEPL_AUTH_KEY=你的DeepL密钥
    supabase functions deploy translate --no-verify-jwt

函数默认使用 DeepL Free API；如果是 Pro API，可设置 `DEEPL_API_URL=https://api.deepl.com/v2/translate` 后重新部署。`supabase/config.toml` 已将该函数设为由函数内部校验 user/publishable 凭据，访客请求使用 `apikey`，登录请求额外携带用户 JWT。DeepL 密钥只保存在 Supabase 服务端环境变量中，不会写入 GitHub Pages 或浏览器。没有配置 Supabase 或 Edge Function 时，开关仍可切换，但会保留英文原文并提示翻译服务未配置。

## 同步规则

- 游客数据和每个账号使用独立的本地空间。
- 首次登录时，当前设备的游客记录会合并到账号；原游客记录仍留在本机。
- 同一条记录在不同设备被修改时，以较新的修改时间为准。
- 删除分组或取消标记会保留删除标记，避免离线设备把旧状态重新上传。
- 退出登录会清理令牌和该账号在当前设备的同步缓存，再切回游客空间；云端数据和公共论文缓存不受影响。
- “清除本机记录”不会删除云端账号数据。

## 数据与安全

云端只保存已读、重要、分组、期刊设置，以及重要/分组论文的少量题录快照。不会上传论文全文、本机文件、普通浏览轨迹或邮箱密码。密码由 Supabase Auth 处理，Paperlane 不保存密码。

数据库脚本为五张用户表强制启用 RLS，并分别限制查询、新增、修改和删除只能操作 user_id = auth.uid() 的数据。前端仅使用 publishable/anon key。Supabase 不是端到端加密服务，因此不要在分组名等字段中存放敏感信息。

## 论文数据

- arXiv：官方 API，支持最近 1 至 365 天，单次最多 500 篇。
- Nature / Science：官方 RSS 当前公开的全部条目。
- 顶会：ICML、ICLR、NeurIPS、CVPR 优先从 OpenReview 会议组的 accepted venue 全量加载，自动识别 Oral、Spotlight、Poster；ICRA、IROS 优先使用 IEEE Xplore API（配置 API key 时）或经过 DOI/会议名严格校验的 Crossref IEEE 元数据，主来源受限时最后回退 DBLP。会议数据保留最近两届。
- IEEE：Xplore 官网页面接口，支持 Early Access、最新 1/2/3/5 期及组合；接口异常时回退官方 RSS。

ICRA/IROS 若要优先使用 IEEE Xplore 官方 API，可在本机设置 `PAPERLANE_IEEE_API_KEY`（或 `IEEE_XPLORE_API_KEY`）；GitHub Actions 中将 API key 保存为 `IEEE_XPLORE_API_KEY` secret。未配置时自动使用 Crossref 的 IEEE DOI 元数据，不会把密钥写入静态网页。
- 历史题录本地保留 730 天。论文原文始终通过出版社或 arXiv 原始链接打开，不缓存受版权保护的全文。

## GitHub 发布与更新

完整的小白操作步骤见 **PUBLISHING.md**。项目已经包含：

- GitHub Pages 自动部署工作流。
- 每 6 小时定时更新论文的工作流。
- 按来源拆分静态数据的构建命令。
- PWA 新版本提示和离线回退。
- 推送 v 开头标签后自动生成 Windows 压缩包的 Release 工作流。

静态网站构建命令：

    python paperlane_server.py --build-static _site --days 365 --ieee-scope ea+5

不联网、只用现有缓存测试构建：

    python paperlane_server.py --build-static _site --static-from-cache
