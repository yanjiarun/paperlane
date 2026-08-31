# Paperlane 免费发布指南

这套发布方式由三个免费部分组成：

- GitHub 仓库保存代码和版本记录。
- GitHub Pages 提供 HTTPS 网页和 PWA 安装地址。
- GitHub Actions 每 6 小时抓取一次公开论文数据并自动更新 Pages。
- Supabase 免费项目只保存个人已读、重要、分组和设置。

GitHub Pages 上的刷新按钮用于检查最近一次 Actions 生成的数据。它不会让每台手机直接抓取 IEEE 或 arXiv，因此速度更稳定，也不要求电脑保持开机。

## 一、创建 GitHub 仓库

1. 注册或登录 GitHub。
2. 安装免费的 GitHub Desktop，并登录同一个 GitHub 账号。
3. 在 GitHub Desktop 中选择 **File > Add local repository**，指向 Paperlane 文件夹。
4. 在左下角的 Summary 填写 **Initial Paperlane release**，点击 **Commit to main**。
5. 点击 **Publish repository**，仓库名填写 **paperlane**。
6. 取消勾选 **Keep this code private**，然后确认发布。公开仓库使用 Pages 和标准 GitHub Actions 最容易保持免费。

项目中的 .gitignore 已排除本机论文缓存、Python 临时文件和测试截图，避免仓库越来越大。

## 二、开启 GitHub Pages

1. 打开仓库的 **Settings > Pages**。
2. 在 **Build and deployment** 中将 Source 设为 **GitHub Actions**。
3. 打开仓库的 **Actions** 页面，选择 **Deploy Paperlane to GitHub Pages**。
4. 点击 **Run workflow** 执行第一次构建。
5. 第一次抓取 45 个来源可能需要数分钟。

成功后地址通常是：

    https://你的GitHub用户名.github.io/paperlane/

这个地址使用 HTTPS，可以在电脑、Android、iPhone 和 iPad 上打开并安装。

## 三、连接 Supabase 同步

完成 Supabase 项目和 supabase-schema.sql 后，在 GitHub 仓库中打开：

**Settings > Secrets and variables > Actions > Variables**

新增两个 Repository variable（变量名必须完全一致）：

- **SUPABASE_URL**：Supabase Project URL。
- **SUPABASE_PUBLISHABLE_KEY**：Supabase Project Settings > API Keys 中的 publishable key（通常以 `sb_publishable_` 开头）。

旧项目的 legacy anon key 也能使用：可把它放在 **SUPABASE_ANON_KEY** 变量中；如果同时设置，新版 **SUPABASE_PUBLISHABLE_KEY** 优先。

这些低权限 key 会在构建网站时写入公开前端配置，这是 Supabase 针对浏览器应用的设计；RLS 才是用户数据隔离边界。绝对不要添加 `sb_secret_...`、secret key 或 service_role key，构建脚本检测到它们时会直接报错。

然后在 Supabase 的 **Authentication > URL Configuration** 中：

1. 将 Site URL 设为 GitHub Pages 地址。
2. 将同一个地址加入 Redirect URLs。
3. 保留本机开发地址 http://localhost:8765 作为额外 Redirect URL。

最后必须在 GitHub 的 **Actions > Deploy Paperlane to GitHub Pages > Run workflow** 再运行一次。只新增 Repository variables 不会自动触发部署。

## 四、启用 DeepL 中文翻译

代码中的 `supabase/functions/translate/index.ts` 是翻译代理。先在 DeepL 账户创建 API key，再在 Supabase 项目中执行：

    supabase secrets set DEEPL_AUTH_KEY=你的DeepL密钥
    supabase functions deploy translate --no-verify-jwt

默认使用 DeepL Free API；DeepL Pro 用户可额外设置 `DEEPL_API_URL=https://api.deepl.com/v2/translate`。部署后，Pages 构建注入的 Supabase URL 和 publishable key 会自动指向该函数，浏览器不会接触 DeepL 密钥。

仓库中的 `supabase/config.toml` 已关闭平台层 JWT 预检，让未登录访客可以使用 publishable key 调用函数；函数本身会校验 publishable key 或登录用户 JWT。前端把 publishable key 放在 `apikey`，不会把它误当作 Bearer JWT。

页面只翻译当前页，结果保存在本机 IndexedDB 的独立 `translations` 存储中，不上传云端，也不会重复改写已读、重要或分组数据。未配置翻译服务时，开关会保留原文并给出提示。

验证方法：

1. 打开最新一次 workflow，`Check cloud sync configuration` 应显示绿色的“配置已注入”，而不是黄色 warning。
2. 打开 `https://你的GitHub用户名.github.io/paperlane/supabase-config.js`，确认 url 和 anonKey 不为空。
3. 打开 Paperlane 右上角账号窗口，应显示邮箱和密码输入框可用，不再显示“线上未注入 Supabase 配置”。
4. 注册、确认邮箱并登录；标记一篇论文后点击“立即同步”，再在另一台设备登录同一账号验证。

常见错误：

- “云端数据表不存在”：回到 Supabase SQL Editor，完整运行 **supabase-schema.sql**。
- “Supabase 拒绝了请求”：检查是否误用了 secret/service_role key、邮箱是否已确认，以及 schema 中的 RLS policy 是否已创建。
- “无法连接/连接超时”：免费项目可能因低活跃暂停；到 Supabase Dashboard 点击 **Resume project**，等待恢复后重试。
- 确认邮件跳到 localhost：Supabase 的 Site URL 没有设置为完整的 Pages 地址（包括 `/paperlane/` 和末尾斜杠）。

## 五、多端安装

- Windows / macOS / Android：使用设备自带浏览器或其他支持网页应用的浏览器打开 Pages 地址。浏览器提供 `beforeinstallprompt` 后，Paperlane 按钮会直接弹出安装窗口；在这之前按钮会显示按平台区分的安装步骤，也可以直接使用浏览器菜单中的“安装应用”“添加到主屏幕”或“创建快捷方式”。
- iPhone / iPad：使用 Safari 打开，选择“分享 > 添加到主屏幕”。
- 微信、QQ 等应用内浏览器：先通过右上角菜单选择“在浏览器打开”，再安装。
- 不安装也可以直接作为普通网页使用。

同一账号登录后，各设备同步已读、重要、分组和期刊设置。断网时操作保存在本机，联网后再同步。

## 六、后续更新

日常代码更新：

1. 修改文件。
2. 在 GitHub Desktop 中填写更新说明并 Commit。
3. 点击 **Push origin**。
4. GitHub Actions 会自动重新部署。
5. 已安装的 Paperlane 会提示“新版本可用”。

升级只替换网页文件和 Service Worker 的应用缓存，不会删除浏览器 IndexedDB 中的已读、重要、分组、设置和离线题录。只要设备仍使用同一个地址（同一个 GitHub Pages 域名或同一个本机端口），这些记录会继续保留；清除浏览器网站数据、改用另一地址，或卸载时选择清除应用数据除外。登录同一个账号后，已读、重要和分组还可以从云端同步到其他设备。

论文数据不需要人工提交。定时任务每 6 小时自动更新，生成数据按来源拆分，设备只下载当前勾选的来源。

发布正式版本时，将 version.json 中的版本号改为新版本，例如 0.9.1，提交并推送，然后创建对应标签：

    git tag v0.9.1
    git push origin v0.9.1

**Create Paperlane Release** 会自动生成一个可下载的 Windows 压缩包，并创建 GitHub Release 和更新说明。

## 免费额度与限制

- GitHub Pages 适合个人和开源项目，不用于高流量商业后端。
- 公开仓库的标准 GitHub Actions 通常不计费；私有仓库受账号分钟数限制。
- GitHub 可能暂停 60 天没有仓库活动的公开仓库定时工作流，重新运行或提交一次即可恢复。
- Supabase 免费层包含 500 MB 数据库、5 GB egress 和 50,000 MAU 等额度，个人论文阅读状态通常远低于额度；低活跃免费项目可能在一周后暂停，可在 Dashboard 中恢复。
- IEEE、Nature、Science 和 arXiv 的公开接口仍可能临时限流；构建会保留已有历史数据并在下一轮重试。
- ICRA/IROS 可选配置 Actions secret `IEEE_XPLORE_API_KEY` 使用 IEEE Xplore 官方 API；未配置时构建使用经过 DOI 和会议名校验的 Crossref IEEE 元数据。
- GitHub Actions 展示的是定时更新数据，最多可能比来源网站晚约 6 小时。本机 Python 模式仍可手动实时刷新。
