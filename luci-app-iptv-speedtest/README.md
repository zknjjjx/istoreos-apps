# luci-app-iptv-speedtest — IPTV 测速优选

本插件已整合到 [zknjjjx/istoreos-apps](https://github.com/zknjjjx/istoreos-apps)，当前原生版本 **1.0.0-r4**。保留原项目的 Docker 部署、公共订阅列表、生成脚本及原生 LuCI 插件。

- **iStoreOS / OpenWrt 原生安装**：[安装、升级、构建与回滚](speedtest/openwrt/README.md)，无需 Docker；入口为“服务 → IPTV 测速优选”。
- **Docker 部署**：[完整使用说明](speedtest/README.md)，原方式继续保留。
- **下载**：[目标仓库 Releases](https://github.com/zknjjjx/istoreos-apps/releases)。本次仅迁移源码，旧仓库的 Release 附件不随 Git 文件自动迁移；若未发布对应 APK，请按构建说明生成。

## 迁移来源与目录

迁移自 [`zknjjjx/iptv`](https://github.com/zknjjjx/iptv) 的 `feat/istoreos-native-plugin` 分支，基准提交 [`0de08c4`](https://github.com/zknjjjx/iptv/commit/0de08c4)，对应 [PR #1](https://github.com/zknjjjx/iptv/pull/1)。目标仓库保存完整源码快照；原仓库清理须在迁移验证后另行确认范围，历史提交未导入本仓库。

```text
luci-app-iptv-speedtest/
  iptv.m3u / iptv.txt    公共订阅列表
  scripts/update.py     订阅汇总脚本
  speedtest/
    app.py              Docker / 原生插件共用后台
    docker-compose.yml  Docker 部署配置
    openwrt/            LuCI、procd、UCI、APK 构建及 SDK Makefile
    tests/              后台、RPC、LuCI 测试
```

下文的本地命令（除另有说明外）以本目录为工作目录。原生构建保留 `speedtest/openwrt/` 与 `speedtest/app.py` 的相对关系。未新增许可证或变更上游版权/授权声明。现有设备配置不会因仓库迁移而自动更新，旧订阅地址可在插件设置中手动改为下列新地址。

## 公共直播源

配套中国大陆电视直播源合集（已去除重复链接），**每天北京时间 2:00 起每 8 小时自动更新一次**（2:00、10:00、18:00）。

| 文件 | 说明 |
|---|---|
| `iptv.m3u` | M3U 格式，适用于 TiviMate、Kodi、PotPlayer、APTV 等 |
| `iptv.txt` | TXT 格式（`频道名,链接`，`分组,#genre#`），适用于 DIYP、TVBox 等 |

订阅地址（国内访问慢可在前面加代理，如 `https://proxy.example.com/`）：
- https://raw.githubusercontent.com/zknjjjx/istoreos-apps/main/luci-app-iptv-speedtest/iptv.m3u
- https://raw.githubusercontent.com/zknjjjx/istoreos-apps/main/luci-app-iptv-speedtest/iptv.txt

## 测速优选工具
直播源很多是失效或卡顿的。[speedtest](speedtest/) 是配套的自研测速服务，部署在软路由 / NAS 上：定时拉取本仓库或任意订阅源，逐条测码率、分辨率和流畅度，每个频道只留最好的一条，在局域网输出 M3U / TXT 订阅，全部设置在网页里完成。

### iStoreOS / OpenWrt 原生插件（新增）

不需要 Docker，支持 procd 服务管理、开机自启和 LuCI 管理入口。已适配斐讯 N1 的 iStoreOS 25.12 APK 包安装，默认低并发且不自动测速；详见 [原生插件安装、构建与回滚说明](speedtest/openwrt/README.md)。

### Docker 部署（原方式保留）

```bash
mkdir -p /opt/iptv-speedtest && cd /opt/iptv-speedtest
wget --no-hsts -T 30 -O docker-compose.yml "https://proxy.example.com/https://raw.githubusercontent.com/zknjjjx/istoreos-apps/main/luci-app-iptv-speedtest/speedtest/docker-compose.yml"
wget --no-hsts -T 30 -O app.py "https://proxy.example.com/https://raw.githubusercontent.com/zknjjjx/istoreos-apps/main/luci-app-iptv-speedtest/speedtest/app.py"
docker compose up -d
```
然后打开 `http://软路由IP:8899`。详见 [speedtest/README.md](speedtest/README.md)。

## 来源与自动更新
汇总自以下公开项目，按链接（去掉 `$` 后缀）去重，央视、卫视单独分组：
- [Guovin/iptv-api](https://github.com/Guovin/iptv-api)（gd 分支 result.m3u）
- [YueChan/Live](https://github.com/YueChan/Live)（IPTV.m3u）
- [fanmingming/live](https://github.com/fanmingming/live)（ipv6.m3u）
- [iptv-org/iptv](https://github.com/iptv-org/iptv)（cn.m3u）
- [suxuang/myIPTV](https://github.com/suxuang/myIPTV)（ipv4.m3u）
- [vbskycn/iptv](https://github.com/vbskycn/iptv)（iptv4.m3u）

更新由 GitHub Actions（[`iptv-update.yml`](../.github/workflows/iptv-update.yml)）运行 [`scripts/update.py`](scripts/update.py) 完成：
- 定时：北京时间每天 02:00、10:00、18:00（cron `0 18,2,10 * * *`，UTC）。GitHub 的定时任务高峰期可能推迟几分钟到半小时。
- 每次运行都会重新生成并提交，无论结果多少、有无变化；两个文件最前面都有「更新时间」分组，播放器里能直接看到本次更新时间。某个来源拉取失败时跳过该来源。
- 想立即更新：仓库 Actions → 更新 IPTV 直播源 → Run workflow。
- 本地生成：先进入本目录 `cd luci-app-iptv-speedtest`，再执行 `python3 scripts/update.py`（只用 Python 标准库）。

## 说明
直播源来自网络公开链接，可用性随时变化，部分源仅支持 IPv6。仅供学习交流，请勿用于商业用途。
