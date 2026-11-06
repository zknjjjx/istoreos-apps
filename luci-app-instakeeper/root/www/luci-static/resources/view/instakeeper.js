'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require poll';

var BIN = '/usr/libexec/instakeeper';
function p2(n) { return (n < 10 ? '0' : '') + n; }
function fmt(ts) { if (!ts) return '—'; var d = new Date(ts * 1000); return p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
var ZH = { running: '运行中', suspended: '已挂起', paused: '已挂起', resuming: '拉起中', suspending: '挂起中', stopped: '已停止', queued: '排队中' };

function hm(min) { var h = Math.floor(min / 60), m = min % 60; return h ? (h + ' 小时 ' + m + ' 分') : (m + ' 分'); }
function statusTable(s) {
	var now = Date.now() / 1000, bf = (s.before === undefined ? 3 : s.before), off = (bf === 0);
	var groups = {}, order = [];
	(s.machines || []).forEach(function(m) { var k = m.acc || '默认'; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(m); });
	var card = function(m) {
		var ex = (m.act === '已排除'), run = (m.state === 'running');
		var used = m.run ? Math.floor((now - m.run) / 60) : 0;
		var mx = m.max || 480, ml = (m.lim !== undefined) ? m.lim : (off ? 0 : mx - bf), moff = (ml === 0), mlim = moff ? mx : ml;
		var color = ex ? '#9e9e9e' : (run ? '#2e7d32' : '#c62828');
		var info = [];
		if (m.run) info.push('已运行 ' + hm(used));
		if (m.run && !ex) info.push(hm(Math.max(0, mlim - used)) + (moff ? '后被平台停' : '后重置') + '（平台上限 ' + hm(mx) + '）');
		return E('div', { 'style': 'padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.2);' + (ex ? 'opacity:.55' : '') }, [
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, [
				E('b', { 'style': 'white-space:nowrap' }, m.name),
				E('span', { 'style': 'white-space:nowrap;font-size:90%' }, [
					E('span', { 'style': 'color:' + color + ';font-weight:bold' }, '● ' + (ZH[m.state] || m.state)),
					m.act && m.act !== '—' ? E('span', { 'style': 'margin-left:8px;color:#888' }, m.act) : ''
				])
			]),
			info.length ? E('div', { 'style': 'margin-top:4px;font-size:85%;color:#888' }, info.join(' · ')) : ''
		]);
	};
	var blocks = order.map(function(k) {
		return E('div', { 'class': 'cbi-section', 'style': 'padding:0;margin:8px 0;overflow:hidden' }, [
			E('div', { 'style': 'padding:8px 12px;font-size:85%;color:#888;background:rgba(128,128,128,.08);word-break:break-all' }, '账号：' + k)
		].concat(groups[k].map(card)));
	});
	return E('div', {}, [
		E('p', { 'style': 'font-size:90%' }, s.error ? E('b', { 'style': 'color:#c62828' }, s.error) : ('上次检查 ' + fmt(s.checked) + (s.night ? ' · 每日停机 ' + s.night : '') + (off ? ' · 不主动重置' : ' · 停机前 ' + bf + ' 分钟重置')))
	].concat(blocks));
}
function getJSON(a) { return fs.exec(BIN, a).then(function(r) { try { return JSON.parse(r.stdout); } catch (e) { return {}; } }); }

return view.extend({
	load: function() { return Promise.all([L.resolveDefault(getJSON(['status']), {}), L.resolveDefault(fs.exec(BIN, ['log', '40']), {})]); },
	render: function(d) {
		var m = new form.Map('instakeeper', 'InstaBox 保活', '自动拉起被挂起的 InstaBox 机器（冷却结束即拉）；按每台机器的平台上限，停机前主动“挂起→立刻拉起”重置计时；按间隔轻触防空闲暂停；每天指定时段停机（模拟正常使用，降低挂机判定风险）。');
		var s = m.section(form.NamedSection, 'main', 'main');
		var o = s.option(form.Flag, 'enabled', '启用');
		o = s.option(form.Value, 'reset_before', '到期前多少分钟重置', '平台给免费机器动态时长：每次启动 2 小时，到期前 5 分钟按最近半小时是否在干活决定是否延长，最多 8 小时。插件自动读取每台机器当前到期时间，等平台审完、在到期前这么多分钟“挂起→立刻拉起”。只能填 1~4（默认 3），0 = 不主动重置'); o.datatype = 'range(0,4)'; o.placeholder = '3'; o.default = '3';
		o = s.option(form.Value, 'interval', '检查间隔（秒）', '建议 300'); o.datatype = 'range(60,1200)';
		o = s.option(form.Flag, 'poke_idle', '轻触防空闲', '给运行中的机器发一条空命令，防平台空闲暂停');
		o = s.option(form.Value, 'poke_minutes', '轻触间隔（分钟）', '平台空闲 30 分钟暂停，建议 5~20'); o.datatype = 'range(1,29)'; o.placeholder = '5'; o.depends('poke_idle', '1');
		o = s.option(form.Flag, 'night_enabled', '每日停机时段', '时段内所有机器停机，时段结束再拉起');
		var tv = function(id, v) { return /^([01]?\d|2[0-3]):[0-5]\d$/.test(v) ? true : '请输入 HH:MM，例如 02:00'; };
		o = s.option(form.Value, 'night_from', '停机开始', '24 小时制，可跨午夜（如 23:30 到 01:30）'); o.placeholder = '02:00'; o.validate = tv; o.depends('night_enabled', '1');
		o = s.option(form.Value, 'night_to', '停机结束'); o.placeholder = '04:00'; o.validate = tv; o.depends('night_enabled', '1');

		var a = m.section(form.GridSection, 'account', '账号', '每个 InstaBox 账号一行；上面的设置对所有账号、所有机器自动生效。API Key 在 instabox.sh 控制台 API keys 里新建（ibk_ 开头）。');
		a.addremove = true; a.anonymous = true; a.sortable = true; a.nodescriptions = true;
		o = a.option(form.Flag, 'enabled', '启用'); o.default = '1'; o.editable = true;
		o = a.option(form.Value, 'name', '名称'); o.rmempty = false;
		o = a.option(form.Value, 'api_key', 'API Key'); o.password = true; o.rmempty = false; o.modalonly = true;
		o = a.option(form.Value, 'exclude', '排除的机器', '机器名或 ID，空格分隔；这些机器不拉起、不重置');

		var box = E('div', { 'id': 'ik-status' }, statusTable(d[0]));
		var logbox = E('pre', { 'id': 'ik-log', 'style': 'max-height:300px;overflow:auto;font-size:85%' }, (d[1].stdout || '暂无日志'));
		poll.add(function() {
			return Promise.all([getJSON(['status']), fs.exec(BIN, ['log', '40'])]).then(function(r) {
				var b = document.getElementById('ik-status'); if (b) { b.innerHTML = ''; b.appendChild(statusTable(r[0])); }
				var l = document.getElementById('ik-log'); if (l) l.textContent = r[1].stdout || '暂无日志';
			});
		}, 15);

		return m.render().then(function(fe) {
			return E('div', {}, [fe,
				E('h3', {}, '机器状态'), box,
				E('div', { 'style': 'margin:8px 0' }, E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, function() {
					return fs.exec(BIN, ['run']).then(function() { return getJSON(['status']); }).then(function(st) {
						var b = document.getElementById('ik-status'); b.innerHTML = ''; b.appendChild(statusTable(st));
					});
				}) }, '立即检查')),
				E('h3', {}, '日志'), logbox]);
		});
	},
	handleSaveApply: function(ev, mode) {
		return this.super('handleSaveApply', [ev, mode]).then(function() { return fs.exec('/etc/init.d/instakeeper', ['restart']); });
	}
});
