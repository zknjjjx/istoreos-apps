# Nikki v1.26.2：N1 官方下载与手动安装

此目录只保存**官方固定版本下载链接、校验值和安装说明**，不镜像 APK 或源码归档。以后可从下面的上游链接下载，再在 iStore 手动安装。本次没有连接、安装或修改路由器。

## 适用环境

本页按 N1 的 **iStoreOS 25.12.5**、target `amlogic/meson`、包架构 `aarch64_cortex-a53`、包管理器 **APK 3.0.5** 选择文件。不是安卓 APK，也不适用于旧版 opkg/IPK 固件；不要因为同为 ARM64 就改下 `aarch64_generic` 或其他固件分支。

上游要求 OpenWrt ≥ 24.10、Linux 内核 ≥ 5.13、firewall4；此页具体归档只选 **OpenWrt 25.12 / Cortex-A53**。架构匹配不等于已经在 N1 上安装实测；内核模块仍须与当前固件 ABI 一致。LuCI 与翻译包虽标为 `noarch`，这里仍使用同一归档内的原始文件。

## 官方固定版本下载

- [Nikki 官方 v1.26.2 发布页](https://github.com/nikkinikki-org/OpenWrt-nikki/releases/tag/v1.26.2)
- **[下载 nikki_aarch64_cortex-a53-openwrt-25.12.tar.gz](https://github.com/nikkinikki-org/OpenWrt-nikki/releases/download/v1.26.2/nikki_aarch64_cortex-a53-openwrt-25.12.tar.gz)**

归档大小：`37,320,919` 字节。SHA-256：

```text
6ee657c194fa9010f16a983d13776527f5f113294ac3db1351958b941437405c
```

该值已与 [GitHub 官方 release API](https://api.github.com/repos/nikkinikki-org/OpenWrt-nikki/releases/tags/v1.26.2) 中资产 ID `627660971` 的 `digest`、文件名和大小核对，并重新下载原文件计算一致。固定版本 URL 不代表上游永远不会替换资产；以后下载也应核对校验值，不一致就先停止。

### 从归档中选取的四个包

| 文件名 | 版本 | 架构 | 字节数 |
|---|---|---|---:|
| `mihomo-meta-1.19.32.apk` | 1.19.32（稳定版） | aarch64_cortex-a53 | 20,581,964 |
| `nikki-2026.10.10-r1.apk` | 2026.10.10-r1 | aarch64_cortex-a53 | 53,305 |
| `luci-app-nikki-1.26.2-r1.apk` | 1.26.2-r1 | noarch | 10,986 |
| `luci-i18n-nikki-zh-cn-26.283.34061~31339d5.apk` | 26.283.34061~31339d5 | noarch | 5,009 |

这四个文件是上面官方归档的成员，**不是四个独立的 release 下载资产**，因此不编造单包直链。归档还有其他语言、alpha 核心和索引等内容；这里只选稳定核心与简体中文，不要把所有 APK 一起安装，也不要混装 `mihomo-alpha`。

### 四个 APK 的 SHA-256

这些值由已核对的官方归档成员逐个计算，并与此前本地审核文件逐字节比对一致；不是声称上游另行发布了每个 APK 的 checksum。

```text
0b162e0f65d2c4fcdf73027fbb3cd018e188761acda116b16af142b34004cf4e  mihomo-meta-1.19.32.apk
c32213a8864d2a3a7a2043ff49934f055a3dc6396f8661e9aa5c54ed5e9ac3bc  nikki-2026.10.10-r1.apk
e5950a129822ced1c5687241437f23d4e593712f43f79c5df6076b946333f425  luci-app-nikki-1.26.2-r1.apk
e4fd4259218a31150cba257bc1c4ef92157de7cbc31609537bdae160876a1455  luci-i18n-nikki-zh-cn-26.283.34061~31339d5.apk
```

可在 Windows PowerShell 中用 `Get-FileHash -Algorithm SHA256 .\文件名`，在 Linux 用 `sha256sum 文件名`，在 macOS 用 `shasum -a 256 文件名`。机器可读记录见 [MANIFEST.json](MANIFEST.json)，纯校验清单见 [SHA256SUMS](SHA256SUMS)；后者同时列出归档与四包，批量核对时需将它们和清单放在同一目录。

## iStore 正常手动安装步骤

1. 在电脑下载上述官方归档，核对归档 SHA-256，解压得到 APK，再核对所选四包。**不要把 `.tar.gz` 直接上传 iStore，也不要改扩展名冒充 `.run`。**
2. 登录路由器 LuCI，进入 **iStore → 手动安装**。需要支持 APK 的 iStore 0.2.x（官方从 0.2.0 开始支持）；若界面只接受 IPK/RUN，先通过当前固件的正常软件更新渠道确认/更新 iStore，不要强装 APK。
3. 确认固件软件源可用且有足够可写空间。建议先在本地做好必要配置备份；备份留在自己设备上，不上传本仓库。已有其他透明代理或不同 Mihomo 核心时，先核查冲突，不要盲目启用多个接管网络的插件。
4. 在手动安装页选择或拖入**一个 APK**并上传，等待安装任务成功后再装下一个，顺序为：`mihomo-meta` → `nikki` → `luci-app-nikki` → `luci-i18n-nikki-zh-cn`。首包先提供 `mihomo` 依赖，后续再安装服务、界面与中文翻译。
5. 每一步查看安装日志；出现缺依赖、架构错误、内核版本不匹配或包冲突就停止处理，不要跳过错误或强制覆盖。全部成功后刷新 LuCI，查找 Nikki 页面。安装成功不等于代理已配置；订阅、规则及启用应自行在设备上设置，勿提交到仓库。

官方依据：[iStore APK 支持提交](https://github.com/istoreos/istore/commit/3da194207ec125b8ea4ade1443a01003b4086fac)、[支持 APK 的前端版本](https://github.com/linkease/istore-ui/tree/a595baefa686fdd2f5b5f64820fb1b5a38749165)、[iStore 安装后端](https://github.com/istoreos/istore/blob/3da194207ec125b8ea4ade1443a01003b4086fac/luci/luci-app-store/root/bin/is-opkg)。手动上传会调用 APK 安装器；具体按钮文字可能随版本不同。未检查本机预装的 iStore 版本，不能仅由固件版本保证前端已更新。

## 依赖与网络要求

**四个包不是完整离线依赖集。** 根据包元数据，Nikki 直接依赖 `ca-bundle`、`curl`、`firewall4`、`ip-full`、`kmod-dummy`、`kmod-inet-diag`、`kmod-nft-socket`、`kmod-nft-tproxy`、`kmod-tun`、`libc`、`mihomo`、`yq`。这里的 `mihomo-meta` 提供 `mihomo=1.19.32`；LuCI 还依赖 `luci-base`、`libc` 和 `nikki`，翻译依赖 `luci-app-nikki` 和 `libc`。间接依赖由系统包管理器继续解析。

下载阶段电脑需要能访问 GitHub 及其 release 资产下载域名；安装阶段路由器需要正确的 DNS、系统时间、HTTPS 证书和可访问的、与本固件匹配的 25.12 APK 软件源，以补齐未安装依赖。离线安装只有在所有依赖均已存在或另行准备完整匹配依赖时才可能成功。

内核模块必须来自与**本机固件内核版本/ABI 匹配**的软件源；不要拿其他 OpenWrt 固件或其他版本的 kmod 凑数，也不要全系统升级或替换内核来绕过依赖错误。Mihomo 可执行文件本身约 57 MB，安装需要比压缩包更大的可写空间，还要留出依赖、临时文件、规则和运行余量。

支持 APK 的 iStore 后端对本地包使用 `apk add --allow-untrusted`。这不是本页完成了官方公钥签名认证：**本次未验证官方公钥签名**，也不建议全局关闭软件源签名校验。SHA-256 主要用于确认下载字节与已核对资产一致，不能替代发行者身份、签名或安全审计。

更多上游说明见 [v1.26.2 官方 README](https://github.com/nikkinikki-org/OpenWrt-nikki/blob/v1.26.2/README.md)。本页不提供执行远程脚本或跟随最新版本的软件源安装方式，以免偏离这里固定的版本。

## 本目录的边界

只发布 `README.md`、`MANIFEST.json`、`SHA256SUMS`。不上传 APK、源码归档、用户订阅、私有 URL、路由器配置、备份、密钥或个人数据。仅链接官方资产不代表解决或认证上游第三方许可证问题；如以后要镜像二进制，仍需单独解决此前的第三方授权、完整对应源码及构建/重组材料问题。

本次完成了官方资产元数据核对、重新下载 SHA-256 校验、四包文件名/版本/架构/大小与字节核对，以及官方安装流程的代码核查；**未在路由器安装、做依赖求解或运行测试**，不承诺其他硬件或固件可用。
