'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';
'require poll';
'require iptv-speedtest as speed';

var listService = rpc.declare({
    object: 'service', method: 'list', params: [ 'name' ], expect: {}, reject: true
});
var control = rpc.declare({
    object: 'file', method: 'exec', params: [ 'command', 'params' ], expect: {}, reject: true
});
var commit = rpc.declare({
    object: 'uci', method: 'commit', params: [ 'config' ], expect: {}, reject: true
});

function action(name) {
    return control('/usr/libexec/iptv-speedtest-ctl', [ name ]).then(function (result) {
        if (!result || result.code)
            throw new Error(result && result.stderr ? result.stderr : '操作失败');
        return result;
    });
}

function running(data) {
    var instances = ((data || {})['iptv-speedtest'] || {}).instances || {};
    return Object.keys(instances).some(function (key) { return instances[key].running; });
}

function copy(text) {
    if (navigator.clipboard)
        return navigator.clipboard.writeText(text).then(function () { ui.addNotification(null, E('p', {}, '地址已复制')); });
    var area = E('textarea', { style: 'position:fixed;opacity:0' });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
}

function value(data, key, fallback) {
    return data && data[key] !== null && data[key] !== undefined ? data[key] : fallback;
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('iptv_speedtest'),
            listService('iptv-speedtest'),
            speed.call('status').catch(function () { return null; })
        ]);
    },

    handleSaveApply: function (ev) {
        return this.handleSave(ev)
            .then(function () { return commit('iptv_speedtest'); })
            .then(function () { return action('apply'); })
            .catch(function (e) {
                ui.addNotification(null, E('p', {}, '应用失败：' + e.message), 'error');
            });
    },

    render: function (data) {
        var initial = data[2];
        var CSS = [
            '.ipd{margin-bottom:1.2em}',
            '.ipd-card{background:var(--background-color-high,#fff);border:1px solid rgba(128,128,128,.25);border-radius:10px;padding:14px 16px;margin-bottom:12px}',
            '.ipd-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}',
            '.ipd-badge{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:600;font-size:14px;background:#e8f0fe;color:#1a56db}',
            '.ipd-badge.ok{background:#e6f6ec;color:#137333}.ipd-badge.busy{background:#fff4e5;color:#b45309}.ipd-badge.err{background:#fde8e8;color:#c81e1e}',
            '.ipd-bar{height:8px;background:rgba(128,128,128,.2);border-radius:4px;overflow:hidden;margin:12px 0 4px}',
            '.ipd-bar>div{height:100%;width:0;background:#1a73e8;transition:width .4s}',
            '.ipd-sub{font-size:12px;opacity:.7}',
            '.ipd-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}',
            '.ipd-tile{text-align:center;padding:8px 4px;border-radius:8px;background:rgba(128,128,128,.08)}',
            '.ipd-tile b{display:block;font-size:20px;line-height:1.3}',
            '.ipd-tile span{font-size:12px;opacity:.7}',
            '.ipd-meta{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin-top:12px;font-size:13px}',
            '.ipd-meta dt{opacity:.7}.ipd-meta dd{margin:0}',
            '.ipd-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
            '.ipd-btns .cbi-button{flex:1 1 auto;min-width:88px;margin:0}',
            '.ipd-title{font-weight:600;margin-bottom:8px}',
            '.ipd-src{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(128,128,128,.15);font-size:13px}',
            '.ipd-src:first-of-type{border-top:0}',
            '.ipd-src .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            '.ipd-src .r{white-space:nowrap;opacity:.8}',
            '.ipd-src .p{white-space:nowrap;font-weight:600;min-width:3.2em;text-align:right}',
            '.ipd-src .e{color:#c81e1e}',
            '.ipd-link{display:flex;align-items:center;gap:8px;margin:6px 0}',
            '.ipd-link code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}'
        ].join('');

        function node(tag, attrs, kids) { return speed.el(tag, attrs, kids); }
        function btn(label, cls, fn) {
            var b = node('button', { 'class': 'cbi-button ' + cls, type: 'button' }, label);
            b.addEventListener('click', fn);
            return b;
        }
        function err(e) { ui.addNotification(null, E('p', {}, e.message), 'error'); }
        function short(name) {
            if (/^https?:\/\//.test(name)) {
                var m = name.match(/github(?:usercontent)?\.com\/([^/]+\/[^/]+)/);
                return m ? m[1] : name.replace(/^https?:\/\//, '').split('/')[0];
            }
            return name;
        }

        var badge = node('span', { 'class': 'ipd-badge' }, '…');
        var barFill = node('div', {});
        var barLabel = node('div', { 'class': 'ipd-sub' }, '');
        var bar = node('div', {}, [ node('div', { 'class': 'ipd-bar' }, barFill), barLabel ]);
        var tTested = node('b', {}, '0'), tAlive = node('b', {}, '0'), tChan = node('b', {}, '0');
        var mLast = node('dd', {}, '—'), mDur = node('dd', {}, '—'), mNext = node('dd', {}, '—');
        var runBtn = btn('开始测速', 'cbi-button-action', function () {
            if (!window.confirm('开始测速会占用带宽并产生较多连接，继续？')) return;
            speed.call('refresh').then(function () { ui.addNotification(null, E('p', {}, '测速已开始')); refresh(); }).catch(err);
        });
        var haltBtn = btn('停止测速', 'cbi-button-negative', function () {
            if (!window.confirm('停止当前测速？')) return;
            speed.call('stop').then(function () { ui.addNotification(null, E('p', {}, '已请求停止测速')); refresh(); }).catch(err);
        });
        var svcBtns = [ [ 'start', '启动服务', '启动服务？' ], [ 'restart', '重启服务', '重启会短暂中断订阅，继续？' ], [ 'stop', '停止服务', '停止服务会中断订阅，继续？' ] ].map(function (it) {
            return btn(it[1], 'cbi-button-neutral', function () {
                if (!window.confirm(it[2])) return;
                action(it[0]).then(function () { ui.addNotification(null, E('p', {}, '操作已提交，请稍后刷新状态。')); }).catch(err);
            });
        });

        var liveBox = node('div', {});
        var liveCard = node('div', { 'class': 'ipd-card', style: 'display:none' }, [ node('div', { 'class': 'ipd-title' }, '本轮来源进度'), liveBox ]);
        var lastBox = node('div', {}, '暂无数据');
        var lastCard = node('div', { 'class': 'ipd-card' }, [ node('div', { 'class': 'ipd-title' }, '上轮来源统计（可用 / 已测）'), lastBox ]);

        var h = uci.get('iptv_speedtest', 'main', 'listen_host') || '127.0.0.1';
        var p = uci.get('iptv_speedtest', 'main', 'port') || '8899';
        var base = 'http://' + (h === '0.0.0.0' ? window.location.hostname : h) + ':' + p;
        var pub = uci.get('iptv_speedtest', 'main', 'public_url');
        function linkRow(label, url) {
            return node('div', { 'class': 'ipd-link' }, [ node('span', { 'class': 'ipd-sub', style: 'min-width:3em' }, label), node('code', {}, url),
                btn('复制', 'cbi-button-neutral', function () { copy(url); }) ]);
        }
        var links = [ linkRow('M3U', base + '/m3u'), linkRow('TXT', base + '/txt') ];
        if (pub) links.push(linkRow('公网', pub.replace(/\/?$/, '/') + 'm3u'));
        var linkCard = node('div', { 'class': 'ipd-card' }, [ node('div', { 'class': 'ipd-title' }, '订阅地址'), node('div', {}, links),
            node('div', { 'class': 'ipd-sub', style: 'margin-top:6px' }, '播放器填 M3U 或 TXT 地址即可；监听 127.0.0.1 时只有本机能访问。') ]);

        var dash = node('div', { 'class': 'ipd' }, [
            node('style', {}, CSS),
            node('div', { 'class': 'ipd-card' }, [
                node('div', { 'class': 'ipd-head' }, [ node('span', { 'class': 'ipd-title', style: 'margin:0' }, '运行状态'), badge ]),
                bar,
                node('div', { 'class': 'ipd-tiles' }, [
                    node('div', { 'class': 'ipd-tile' }, [ tTested, node('span', {}, '已测') ]),
                    node('div', { 'class': 'ipd-tile' }, [ tAlive, node('span', {}, '可用') ]),
                    node('div', { 'class': 'ipd-tile' }, [ tChan, node('span', {}, '频道') ])
                ]),
                node('dl', { 'class': 'ipd-meta' }, [ node('dt', {}, '上次运行'), mLast, node('dt', {}, '耗时'), mDur, node('dt', {}, '下次运行'), mNext ]),
                node('div', { 'class': 'ipd-btns' }, [ runBtn, haltBtn ]),
                node('div', { 'class': 'ipd-btns' }, svcBtns)
            ]),
            liveCard, lastCard, linkCard
        ]);

        function srcList(box, stats, live) {
            var keys = Object.keys(stats || {});
            if (!keys.length) { box.textContent = '暂无数据'; return; }
            box.replaceChildren.apply(box, keys.map(function (key) {
                var it = stats[key] || {};
                var name = short(it.name || key);
                if (it.error)
                    return node('div', { 'class': 'ipd-src' }, [ node('span', { 'class': 'n', title: key }, name), node('span', { 'class': 'e' }, '拉取失败') ]);
                var tested = Number(value(it, 'tested', value(it, 'used', 0))) || 0;
                var alive = Number(value(it, 'alive', 0)) || 0;
                var used = Number(value(it, 'used', 0)) || 0;
                var right = live ? alive + ' 可用 · ' + tested + ' / ' + used : alive + ' / ' + tested;
                var pct = tested ? Math.round(alive * 100 / tested) + '%' : '—';
                return node('div', { 'class': 'ipd-src' }, [ node('span', { 'class': 'n', title: key + (it.via ? '（经 ' + it.via + '）' : '') }, (it.prio ? '★ ' : '') + name),
                    node('span', { 'class': 'r' }, right), node('span', { 'class': 'p' }, pct) ]);
            }));
        }

        function updateStatus(cur) {
            var state = value(cur, 'status', '未知');
            var busy = [ '测速中', '拉取源', '正在停止' ].indexOf(state) !== -1 || String(state).indexOf('复测') === 0;
            badge.textContent = state;
            badge.className = 'ipd-badge ' + (busy ? 'busy' : /不可用|失败|错误/.test(state) ? 'err' : 'ok');
            var total = Number(value(cur, 'total', 0)) || 0, done = Number(value(cur, 'progress', 0)) || 0;
            bar.style.display = busy ? '' : 'none';
            barFill.style.width = (total ? Math.min(100, done * 100 / total) : 0) + '%';
            barLabel.textContent = '进度 ' + done + ' / ' + total;
            tTested.textContent = value(cur, 'tested', 0);
            tAlive.textContent = value(cur, 'alive', 0);
            tChan.textContent = value(cur, 'channels', 0);
            mLast.textContent = value(cur, 'last_run', '') || '—';
            var d = Number(value(cur, 'duration_s', 0));
            mDur.textContent = d ? (d >= 3600 ? Math.floor(d / 3600) + ' 小时 ' : '') + Math.round(d % 3600 / 60) + ' 分钟' : '—';
            mNext.textContent = value(cur, 'next_run', '') || '手动';
            runBtn.disabled = busy;
            haltBtn.disabled = !busy || state === '正在停止';
            var live = value(cur, 'cur_stats', {});
            liveCard.style.display = busy && Object.keys(live || {}).length ? '' : 'none';
            if (busy) srcList(liveBox, live, true);
            srcList(lastBox, value(cur, 'source_stats', {}), false);
        }
        function unavailable(e) { updateStatus({ status: '后端不可用：' + e.message }); }
        function refresh() { return speed.call('status').then(updateStatus).catch(unavailable); }

        var m = new form.Map('iptv_speedtest', null, null);
        var s = m.section(form.NamedSection, 'main', 'iptv_speedtest', '服务设置', '保存并应用后会重启本插件；其它页面的保存只写测速配置，不会自动测速。');
        s.anonymous = true;
        var enabled = s.option(form.Flag, 'enabled', '启用服务', '勾选后开机自启。');
        enabled.default = '0';
        enabled.rmempty = false;
        var host = s.option(form.Value, 'listen_host', '监听地址', '127.0.0.1 仅本机；0.0.0.0 允许局域网/隧道访问订阅。');
        host.datatype = 'ip4addr';
        host.default = '127.0.0.1';
        host.rmempty = false;
        var port = s.option(form.Value, 'port', '监听端口', '默认 8899。');
        port.datatype = 'port';
        port.default = '8899';
        port.rmempty = false;

        poll.add(refresh, 5);
        updateStatus(initial || { status: running(data[1]) ? '空闲' : '未运行' });
        return m.render().then(function (formNode) {
            return E('div', {}, [ E('h2', {}, 'IPTV 测速优选'), dash, formNode ]);
        });
    }
});
