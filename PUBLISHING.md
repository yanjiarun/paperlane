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
5. 第一次抓取 39 个来源可能需要数分钟。

成功后地址通常是：

    https://你的GitHub用户名.github.io/paperlane/

这个地址使用 HTTPS，可以在电脑、Android、iPhone 和 iPad 上打开并安装。

## 三、连接 Supabase 同步

完成 Supabase 项目和 supabase-schema.sql 后，在 GitHub 仓库中打开：

**Settings > Secrets and variables > Actions > Variables**

新增两个 Repository variable：

- **SUPABASE_URL**：Supabase Project URL。
- **SUPABASE_ANON_KEY**：Supabase anon public key。

它们会在构建网站时写入公开前端配置。anon key 本来就是公开密钥，RLS 才是数据隔离边界。不要添加 service_role key。

然后在 Supabase 的 **Authentication > URL Configuration** 中：

1. 将 Site URL 设为 GitHub Pages 地址。
2. 将同一个地址加入 Redirect URLs。
3. 保留本机开发地址 http://localhost:8765 作为额外 Redirect URL。

再次运行 Pages workflow 后，网页端注册和登录就会启用。

## 四、多端安装

- Windows / macOS / Android：使用 Chrome 或 Edge 打开 Pages 地址，选择地址栏或浏览器菜单中的“安装应用”。
- iPhone / iPad：使用 Safari 打开，选择“分享 > 添加到主屏幕”。
- 不安装也可以直接作为普通网页使用。

同一账号登录后，各设备同步已读、重要、分组和期刊设置。断网时操作保存在本机，联网后再同步。

## 五、后续更新

日常代码更新：

1. 修改文件。
2. 在 GitHub Desktop 中填写更新说明并 Commit。
3. 点击 **Push origin**。
4. GitHub Actions 会自动重新部署。
5. 已安装的 Paperlane 会提示“新版本可用”。

论文数据不需要人工提交。定时任务每 6 小时自动更新，生成数据按期刊拆分，设备只下载当前勾选的来源。

发布正式版本时，将 version.json 中的版本号改为新版本，例如 0.5.1，提交并推送，然后创建对应标签：

    git tag v0.5.1
    git push origin v0.5.1

**Create Paperlane Release** 会自动生成一个可下载的 Windows 压缩包，并创建 GitHub Release 和更新说明。

## 免费额度与限制

- GitHub Pages 适合个人和开源项目，不用于高流量商业后端。
- 公开仓库的标准 GitHub Actions 通常不计费；私有仓库受账号分钟数限制。
- GitHub 可能暂停 60 天没有仓库活动的公开仓库定时工作流，重新运行或提交一次即可恢复。
- Supabase 免费层有数据库、流量和活跃项目限制，个人论文阅读状态通常远低于额度。
- IEEE、Nature、Science 和 arXiv 的公开接口仍可能临时限流；构建会保留已有历史数据并在下一轮重试。
- GitHub Actions 展示的是定时更新数据，最多可能比来源网站晚约 6 小时。本机 Python 模式仍可手动实时刷新。
