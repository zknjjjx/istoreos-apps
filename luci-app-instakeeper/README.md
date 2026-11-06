# luci-app-instakeeper — InstaBox 保活

在路由器上常驻一个小守护进程，替你看住 [InstaBox](https://instabox.sh) 免费云机器，不用在机器里自己跑保活脚本。

## 功能

- **多账号**：每个 InstaBox 账号填一个 API Key（控制台 API keys 里新建，`ibk_` 开头），一个账号下的所有机器都管
- **冷却结束自动拉起**：机器被挂起后，冷却一结束就 resume，失败每 30 秒重试
- **主动重置**：免费版每台机器有连续运行上限（如 480、360、120 分钟，各机器不同），到点会被强制挂起并进入冷却；插件自动读取每台机器的上限，在停机前 N 分钟（默认 15）先自己挂起再拉起，重置计时且不进冷却
- **空闲轻触**：按间隔（默认 5 分钟）向机器发一条空命令，防 30 分钟空闲暂停
- **夜间冷却时段**：可设一段时间（如 02:00–04:00）主动停机，减少每日连续运行时长
- **排除名单**：按机器名或 ID 排除不想管的机器
- LuCI 页面显示每台机器的状态、已运行时长、冷却剩余和本轮动作，附运行日志

## 安装

新版 iStoreOS / OpenWrt 25.12+（apk）：iStore → 手动安装 → 上传 `luci-app-instakeeper-<版本>.apk`，或

```sh
apk add --allow-untrusted /tmp/luci-app-instakeeper-1.0.0-r1.apk
```

纯脚本包（noarch），N1 / x86 等架构通用。依赖 `curl`。

装好后在 **服务 → InstaBox 保活** 添加账号、勾选启用、保存。

## 命令行

```sh
/usr/libexec/instakeeper run      # 立即检查一轮
/usr/libexec/instakeeper status   # 最近一轮状态（JSON）
/usr/libexec/instakeeper log 100  # 最近日志
```

状态文件 `/tmp/instakeeper.json`，日志 `/tmp/instakeeper.log`。配置 `/etc/config/instakeeper`（升级时保留）。

## 构建

```sh
sh build/build-apk.sh 1.0.0-r1   # 输出 dist/luci-app-instakeeper-1.0.0-r1.apk
```

或推送 `instakeeper-v<版本>` 标签，由 GitHub Actions 自动打包发布。

> 注意：主动重置、轻触等做法是否符合 InstaBox 服务条款需自行判断，账号风险自负。
