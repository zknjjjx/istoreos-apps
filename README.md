# istoreos-apps

为 iStoreOS / OpenWrt 开发的 LuCI 应用插件合集。

| 插件 | 说明 | 下载 |
|---|---|---|
| [luci-app-cftunnel](luci-app-cftunnel/) | Cloudflare 隧道：不用公网 IP、不开端口，把内网服务发布到自己的域名。API 令牌一键建隧道、绑定域名、自动 DNS，自带 cloudflared | [Releases](../../releases) |
| [luci-app-opsagent](luci-app-opsagent/) | AI 运维助手：在飞书里用大白话管理路由器，DeepSeek 驱动，长连接免公网 IP；只读命令直接跑，改动类命令需你确认 | [Releases](../../releases) |
| [luci-app-cfyxip](luci-app-cfyxip/) | Cloudflare优选IP：定时扫描 Cloudflare IP，HTTPS 真实验证 + 落地机房识别 + 测速 + 复验，只留真能用的；可选落地国家，结果推送 GitHub（xyip.txt） | [Releases](../../releases) |
| [luci-app-iptv-speedtest](luci-app-iptv-speedtest/) | IPTV 测速优选：原生 LuCI 五页管理、直播源/分组/定时测速、M3U/TXT 订阅；保留 Docker 部署，当前版本 1.0.0-r4 | [安装与构建](luci-app-iptv-speedtest/speedtest/openwrt/README.md) |

## 安装

新版 iStoreOS（OpenWrt 25.12 起，使用 `apk` 包管理器）：

- iStore → 手动安装 → 上传 `.apk` 文件；或
- SSH 执行：`apk add --allow-untrusted /tmp/xxx.apk`

> 旧版 iStoreOS（opkg）请用 `.ipk`；`.apk` 和 `.ipk` 不能混用，装错会报 `package format error`。

## 目录结构

```
<插件名>/
  root/       安装到设备上的文件（按设备上的路径摆放）
  control/    安装 / 卸载脚本
  build/      打包脚本
  test/       测试
.github/      自动打包发布（Actions）
```

### IPTV 测速优选的目录例外

`luci-app-iptv-speedtest/` 保留完整原项目布局：`speedtest/openwrt/` 为原生插件与打包脚本，`speedtest/app.py` 为 Docker/原生共用后台，`speedtest/tests/` 为测试，`scripts/update.py` 生成目录内的 `iptv.m3u` / `iptv.txt`。详见[插件说明](luci-app-iptv-speedtest/)。

直播源自动更新工作流为 [`.github/workflows/iptv-update.yml`](.github/workflows/iptv-update.yml)，沿用北京时间 02:00、10:00、18:00 的更新计划，仅提交该插件目录中的订阅文件。原仓库的 Releases 附件不随本次源码迁移自动转移，原生 APK 可按插件文档构建。
