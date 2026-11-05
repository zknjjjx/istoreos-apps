#!/bin/sh
# 构建 OpenWrt 25.12+ / 新版 iStoreOS（apk 包管理器）用的 .apk（纯脚本，noarch，所有架构通用）
# 用法：sh build/build-apk.sh 1.0.0-r1
# 需要 Linux（x86_64 或 aarch64）、curl、unshare。apk-tools-static 缺了会自动下载。
set -e
V=${1:?用法: build-apk.sh <版本>}
P=$(cd "$(dirname "$0")/.." && pwd); C=$P/.cache; mkdir -p $C
case "$(uname -m)" in x86_64) HA=x86_64;; aarch64) HA=aarch64;; *) echo "不支持的构建机 $(uname -m)"; exit 1;; esac
if [ ! -x $C/apk.static ]; then
	U=https://dl-cdn.alpinelinux.org/alpine/edge/main/$HA
	F=$(curl -fsSL $U/ | grep -o 'apk-tools-static-[0-9][^"]*\.apk' | head -n1)
	curl -fsSL $U/$F | tar -xz -C $C sbin/apk.static 2>/dev/null; mv $C/sbin/apk.static $C/; rmdir $C/sbin
fi
W=$(mktemp -d); mkdir -p $W/files; cp -a $P/root/. $W/files/
mkdir -p $W/files/lib/apk/packages
echo /etc/config/instakeeper > $W/files/lib/apk/packages/luci-app-instakeeper.conffiles
(cd $W/files && find . -type f | sed 's#^\.##' | sort) > $W/files/lib/apk/packages/luci-app-instakeeper.list
chmod 755 $W/files/usr/libexec/instakeeper $W/files/etc/init.d/instakeeper
[ "$(id -u)" = 0 ] && chown -R 0:0 $W/files
O=luci-app-instakeeper-$V.apk
RUN=""; [ "$(id -u)" = 0 ] || RUN="unshare -r"
cd /tmp && $RUN $C/apk.static mkpkg \
 --info "name:luci-app-instakeeper" --info "version:$V" \
 --info "description:InstaBox keepalive for LuCI (multi-account)" \
 --info "arch:noarch" --info "license:MIT" --info "origin:luci-app-instakeeper" --info "maintainer:zknjjjx" \
 --info "depends:libc luci-base curl" \
 --script "post-install:$P/control/postinst" --script "pre-deinstall:$P/control/prerm" --script "post-deinstall:$P/control/postrm" \
 --files $W/files --output /tmp/$O
mkdir -p $P/dist; mv /tmp/$O $P/dist/
rm -rf $W; ls -la $P/dist/$O
