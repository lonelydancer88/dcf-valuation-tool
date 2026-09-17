const { JSDOM } = require('/Users/hpl/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const fs = require('fs');

const html = fs.readFileSync('/Users/hpl/WorkBuddy/2026-09-17-17-17-58/dcf_tool.html', 'utf8');

let pass = 0, fail = 0;
const log = [];
function ok(name, cond, extra) {
  if (cond) { pass++; log.push('  ✅ ' + name); }
  else { fail++; log.push('  ❌ ' + name + (extra ? '  → ' + extra : '')); }
}
// 从带千分位的文本里取数字
const num = s => { const m = String(s).replace(/,/g, '').match(/-?\d+\.?\d*/); return m ? +m[0] : NaN; };
const txt = id => dom.window.document.getElementById(id).textContent;
const htmlOf = id => dom.window.document.getElementById(id).innerHTML;

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  beforeParse(window) {
    window.alert = msg => { window.__alerts.push(msg); };
    window.__alerts = [];
  }
});

const doc = dom.window.document;
const fire = (id, type) => doc.getElementById(id).dispatchEvent(new dom.window.Event(type, { bubbles: true }));
const setVal = (id, v) => { const el = doc.getElementById(id); el.value = v; fire(id, 'input'); };

log.push('— 面板：两阶段固定增长（现排 tab ③）默认腾讯参数 —');
// 默认 f0=2000,n=5,g1=12,g2=3,wacc=9,netdebt=0,shares=93,price=370
ok('无错误', txt('err1') === '');
ok('EV≈50182', Math.abs(num(htmlOf('cards1')) - 50182) < 5, 'EV=' + num(htmlOf('cards1')));
ok('每股≈539.6', Math.abs(num(htmlOf('cards1').split('每股内在价值')[1]) - 539.6) < 1, 'perShare=' + num(htmlOf('cards1').split('每股内在价值')[1]));
ok('显示「低估」标签', /低估/.test(htmlOf('cards1')));
ok('逐年表有5期+终值行', doc.querySelectorAll('#detail1 tbody tr').length === 6, 'rows=' + doc.querySelectorAll('#detail1 tbody tr').length);
ok('柱状图已渲染', /<rect/.test(htmlOf('bar1')));
ok('环图已渲染', /<circle/.test(htmlOf('donut1')));

log.push('— 面板：自定义现金流 + 永续（现排 tab ①，默认预填四期）—');
ok('默认4期现金流行', doc.querySelectorAll('#cfRows .cfrow').length === 4, 'rows=' + doc.querySelectorAll('#cfRows .cfrow').length);
ok('预填值 1463/1704/2058/2390', [...doc.querySelectorAll('#cfRows .cfval')].map(i => +i.value).join(',') === '1463,1704,2058,2390', [...doc.querySelectorAll('#cfRows .cfval')].map(i => i.value).join(','));
ok('标签② 四期 EV≈35124', Math.abs(num(htmlOf('cards2')) - 35124) < 5, 'EV2=' + num(htmlOf('cards2')));
ok('标签② 四期 每股≈377.7', Math.abs(num(htmlOf('cards2').split('每股内在价值')[1]) - 377.7) < 1, 'perShare2=' + num(htmlOf('cards2').split('每股内在价值')[1]));

log.push('— 面板：老唐估值法（现排 tab ②）F3=2000/股数93/现价370 —');
const lrows = [...doc.querySelectorAll('#ltable tbody tr:not(.grp)')].map(r => r.children[1].textContent + '|' + r.children[2].textContent);
ok('PE25 合理估值=50000', num(lrows[1].split('|')[0]) === 50000, lrows[1]);
ok('PE25 买点=25000', num(lrows[2].split('|')[0]) === 25000);
ok('PE25 卖点=75000', num(lrows[3].split('|')[0]) === 75000);
ok('PE25 每股买≈268.8', Math.abs(num(lrows[4].split('|')[0]) - 268.8) < 0.5, lrows[4]);
ok('PE25 每股卖≈806.5', Math.abs(num(lrows[5].split('|')[0]) - 806.5) < 0.5, lrows[5]);
ok('PE30 合理估值=60000', num(lrows[1].split('|')[1]) === 60000);
ok('PE30 每股买≈322.6', Math.abs(num(lrows[4].split('|')[1]) - 322.6) < 0.5, lrows[4]);
ok('PE30 每股卖≈967.7', Math.abs(num(lrows[5].split('|')[1]) - 967.7) < 0.5, lrows[5]);
ok('当前市值=34410', /34,410/.test(htmlOf('cards3')), '匹配到: ' + (htmlOf('cards3').match(/[\d,]+/) || ['无'])[0]);
// 34410 ∈ [25000,90000] → 持有区
ok('状态判定为「持有区」', /持有区/.test(htmlOf('cards3')), '未命中持有区');

log.push('— 股票速填（改成贵州茅台 600519 → 股数12.5 股价1267）—');
setVal('stockName', '贵州茅台');
fire('stockName', 'change');
ok('标签① shares 变为 12.5', num(doc.getElementById('shares').value) === 12.5, doc.getElementById('shares').value);
ok('标签① price 变为 1267', num(doc.getElementById('price').value) === 1267);
ok('标签② c_shares 同步 12.5', num(doc.getElementById('c_shares').value) === 12.5);
ok('标签② c_price 同步 1267', num(doc.getElementById('c_price').value) === 1267);
ok('标签③ l_shares 同步 12.5', num(doc.getElementById('l_shares').value) === 12.5);
ok('标签③ l_price 同步 1267', num(doc.getElementById('l_price').value) === 1267);
// 茅台下：EV 50181.5/12.5 = 4014.5（人民币口径）
ok('茅台下每股≈4014.5', Math.abs(num(htmlOf('cards1').split('每股内在价值')[1]) - 4014.5) < 2, htmlOf('cards1').split('每股内在价值')[1]);
ok('茅台下仍「低估」', /低估/.test(htmlOf('cards1')));
ok('选A股→人民币口径（港股模式关闭）', doc.getElementById('showHkd').checked === false);
// 还原腾讯
setVal('stockName', '腾讯控股'); fire('stockName', 'change');
ok('还原腾讯 shares=90.95', Math.abs(num(doc.getElementById('shares').value) - 90.95) < 0.001, doc.getElementById('shares').value);

log.push('— 边界：WACC ≤ g₂ 终值发散 —');
setVal('g2', 10); setVal('wacc', 9); // 9 < 10
ok('标签① 报终值发散错误', /终值发散/.test(txt('err1')), 'err=' + txt('err1'));
ok('标签① 不清算（卡片清空）', htmlOf('cards1') === '');
setVal('wacc', 9); setVal('g2', 3); // 还原
ok('还原后错误消失', txt('err1') === '');

log.push('— 标签② 边界 WACC ≤ g₂ —');
setVal('c_g2', 10); setVal('c_wacc', 9);
ok('标签② 报终值发散错误', /终值发散/.test(txt('err2')));
setVal('c_wacc', 9); setVal('c_g2', 3);

log.push('— 标签② 增/删现金流行 —');
const before = doc.querySelectorAll('#cfRows .cfrow').length;
dom.window.addCfRow(4000); // 模拟「+ 添加一行」
const afterAdd = doc.querySelectorAll('#cfRows .cfrow').length;
ok('添加一行后行数+1', afterAdd === before + 1, before + '->' + afterAdd);
// 删最后一行（点其 cfdel）
const lastDel = doc.querySelectorAll('#cfRows .cfrow .cfdel')[afterAdd - 1];
lastDel.click();
const afterDel = doc.querySelectorAll('#cfRows .cfrow').length;
ok('删除后行数-1', afterDel === before, afterDel);
const idxText = [...doc.querySelectorAll('#cfRows .cfidx')].map(e => e.textContent).join(',');
const expectIdx = Array.from({ length: afterDel }, (_, i) => '第 ' + (i + 1) + ' 期').join(',');
ok('删行后索引重排为连续', idxText === expectIdx, idxText + ' vs ' + expectIdx);

log.push('— 标签顺序与切换（纯 CSS radio，不依赖 JS）—');
const labelTexts = [...doc.querySelectorAll('.tabs .tabbtn')].map(l => l.textContent);
ok('首个标签是「自定义现金流+永续」', /自定义现金流/.test(labelTexts[0]), labelTexts[0]);
ok('第二个标签是「老唐估值法」', /老唐估值法/.test(labelTexts[1]), labelTexts[1]);
ok('末个标签是「两阶段固定增长」', /两阶段固定增长/.test(labelTexts[2]), labelTexts[2]);
ok('存在 3 个 tab radio', doc.querySelectorAll('input.tabradio').length === 3);
ok('默认选中首标签(t2=自定义现金流)', doc.getElementById('t2').checked === true && doc.getElementById('t1').checked === false && doc.getElementById('t3').checked === false);
ok('三个标签用 label[for] 关联', ['t1','t2','t3'].every(i => doc.querySelector('.tabs label[for="'+i+'"]')));
ok('CSS 含 #t2:checked ~ #panel2 选择器', /#t2:checked\s*~\s*#panel2/.test(doc.querySelector('style').textContent));
ok('CSS 含 #t3:checked ~ #panel3 选择器', /#t3:checked\s*~\s*#panel3/.test(doc.querySelector('style').textContent));
ok('CSS 三面板合并规则含 display:block', /#t3:checked\s*~\s*#panel3\s*{\s*display:block/.test(doc.querySelector('style').textContent));
ok('未再强制 panel1 常显', !/#panel1\s*{\s*display:block/.test(doc.querySelector('style').textContent));
// 模拟点击标签（真实浏览器行为：label 点击 → 选中对应 radio）
doc.querySelector('.tabs label[for="t1"]').click();
ok('点末标签(t1=两阶段) → t1 被选中', doc.getElementById('t1').checked === true);
doc.querySelector('.tabs label[for="t3"]').click();
ok('点第二标签(t3=老唐) → t3 被选中', doc.getElementById('t3').checked === true);
doc.querySelector('.tabs label[for="t2"]').click();
ok('点回首标签(t2) 还原默认', doc.getElementById('t2').checked === true && doc.getElementById('t1').checked === false);
ok('radio 与 panel 同属 .tabwrap 兄弟节点', doc.querySelector('.tabwrap > input#t1') && doc.querySelector('.tabwrap > #panel1'));

log.push('— 存为预设 savePreset —');
setVal('stockName', '测试股X');
dom.window.savePreset();
ok('预设写入 STOCKS', !!dom.window.lookupStock('测试股X'), 'lookup=' + dom.window.lookupStock('测试股X'));
ok('下拉列表含新预设', /测试股X/.test(htmlOf('stockList')));
// 无名称存预设应 alert 且不写入
dom.window.__alerts = [];
setVal('stockName', '');
dom.window.savePreset();
ok('无名称时 alert 提示', dom.window.__alerts.length === 1 && /名称/.test(dom.window.__alerts[0]));

log.push('— 老唐留空现价 → 不显示状态卡 —');
setVal('l_price', '');
ok('留空现价不显示市值/状态', !/当前市值/.test(htmlOf('cards3')) && !/持有区|低估|高估/.test(htmlOf('cards3')));
ok('留空现价仍显示买/卖参考线', /买点参考线/.test(htmlOf('cards3')));
setVal('l_price', '370'); // 还原

log.push('— 港股模式：币种一致的安全边际 + 港元换算 —');
// 控制变量：股数 90.95 / 现价 426(HKD) / 汇率 0.856
setVal('shares', 90.95); setVal('price', 426); setVal('fx', 0.856);
doc.getElementById('showHkd').checked = true; fire('showHkd', 'change');
// perShare=551.75(人民币) → 港元口径 644.6，与 426 比 = +51.3%
ok('港股模式安全边际按港元口径(+51.3%)', /\+51\.3%/.test(htmlOf('cards1')), htmlOf('cards1').match(/[+-][\d.]+%/));
ok('安全边际标注币种为港元', /现价 426（港元）/.test(htmlOf('cards1')));
ok('标签① 出现港元卡片', /企业价值 EV（港元）/.test(htmlOf('cards1')));
ok('港元 EV≈58623', Math.abs(num(htmlOf('cards1').split('企业价值 EV（港元）')[1]) - 58623) < 20, 'hkdEV=' + num(htmlOf('cards1').split('企业价值 EV（港元）')[1]));
ok('港元 每股内在价值≈644.6', Math.abs(num(htmlOf('cards1').split('每股内在价值（港元）')[1]) - 644.6) < 1, 'hkdPS=' + num(htmlOf('cards1').split('每股内在价值（港元）')[1]));
ok('标签② 也出现港元卡片', /每股内在价值（港元）/.test(htmlOf('cards2')));
ok('老唐对照表出现港元行', /合理估值（港元）/.test(doc.querySelector('#ltable tbody').textContent));
// 同参数关掉港股模式 → 人民币口径，安全边际变小(+29.5%)
doc.getElementById('showHkd').checked = false; fire('showHkd', 'change');
ok('人民币口径安全边际(+29.5%)', /\+29\.5%/.test(htmlOf('cards1')), htmlOf('cards1').match(/[+-][\d.]+%/));
ok('关闭港股模式→港元内容消失', !/（港元）/.test(htmlOf('cards1')) && !/港元/.test(doc.querySelector('#ltable tbody').textContent));
// 改汇率 → 港元值随之变化（0.9 时 EV≈55757）
doc.getElementById('showHkd').checked = true; fire('showHkd', 'change');
setVal('fx', 0.9);
ok('改汇率(0.9)后港元 EV≈55757', Math.abs(num(htmlOf('cards1').split('企业价值 EV（港元）')[1]) - 55757) < 20, 'hkdEV@0.9=' + num(htmlOf('cards1').split('企业价值 EV（港元）')[1]));
setVal('fx', 0.856);

log.push('— 选股自动切换币种口径 —');
doc.getElementById('showHkd').checked = false; fire('showHkd', 'change');
setVal('stockName', '腾讯控股'); fire('stockName', 'change');
ok('选港股(.HK)自动开启港股模式', doc.getElementById('showHkd').checked === true);
setVal('stockName', '贵州茅台'); fire('stockName', 'change');
ok('选A股自动切回人民币口径', doc.getElementById('showHkd').checked === false);
setVal('stockName', '腾讯控股'); fire('stockName', 'change'); // 还原

log.push('— 老唐 tab 港元折算 + 手输代码识别 —');
ok('老唐卡片出现「三年后合理估值（港元）」', /三年后合理估值（港元）/.test(htmlOf('cards3')), htmlOf('cards3').slice(0, 120));
ok('老唐卡片出现「理想买点/一年内卖点（港元）」', /理想买点（港元）/.test(htmlOf('cards3')) && /一年内卖点（港元）/.test(htmlOf('cards3')));
ok('老唐表格也有港元行', /合理估值（港元）/.test(doc.querySelector('#ltable tbody').textContent));
ok('老唐表格人民币行明确标注币种', /三年后合理估值（人民币）/.test(doc.querySelector('#ltable tbody').textContent));
const grps = doc.querySelectorAll('#ltable tbody tr.grp');
ok('老唐表格有「人民币/港元」两组分组行', grps.length === 2 && /人民币/.test(grps[0].textContent) && /港元/.test(grps[1].textContent), 'grp 行数=' + grps.length);
ok('股数单位显示为亿股(非“91 股”)', /亿股/.test(htmlOf('cards3')) && !/\d 股/.test(htmlOf('cards3')));
// 空现价时，买/卖参考线也要折算成港元
setVal('l_price', '');
ok('空现价时参考线折算为港元', /买点参考线/.test(htmlOf('cards3')) && /（港元）|港元/.test(htmlOf('cards3')));
setVal('l_price', '426');
// 手输港股代码（不在预设名里）也要自动切口径
doc.getElementById('showHkd').checked = false; fire('showHkd', 'change');
setVal('stockName', '00700');
ok('手输 00700 → 自动开港股模式', doc.getElementById('showHkd').checked === true);
doc.getElementById('showHkd').checked = false; fire('showHkd', 'change');
setVal('stockName', '600519');
ok('手输 600519 → 保持人民币口径', doc.getElementById('showHkd').checked === false);
setVal('stockName', ''); // 清空

log.push('— 代码规范化 normCode（纯函数）—');
[['0700.HK', 'hk00700'], ['00700', 'hk00700'], ['600519', 'sh600519'], ['000858', 'sz000858'], ['HK0700', 'hk00700'], ['sh600519', 'sh600519'], ['腾讯控股', null]].forEach(([i, e]) => {
  const r = dom.window.normCode(i);
  ok('normCode(' + i + ') → ' + e, r === e, '实际 ' + r);
});
log.push('— 行情解析 parseQuote（按真实字段布局 港股69 / A股72）—');
const hkF = new Array(78).fill('0'); hkF[1] = '腾讯控股'; hkF[2] = '00700'; hkF[3] = '426.000'; hkF[69] = '9095085993.00';
const hkQ = dom.window.parseQuote('hk', hkF.join('~'));
ok('parseQuote 港股 现价=426', hkQ && hkQ.price === 426, hkQ && hkQ.price);
ok('parseQuote 港股 总股本≈90.95亿', hkQ && Math.abs(hkQ.shares - 90.95) < 0.01, hkQ && hkQ.shares);
const aF = new Array(88).fill('0'); aF[1] = '贵州茅台'; aF[2] = '600519'; aF[3] = '1266.98'; aF[72] = '1250081601';
const aQ = dom.window.parseQuote('a', aF.join('~'));
ok('parseQuote A股 现价=1266.98', aQ && aQ.price === 1266.98, aQ && aQ.price);
ok('parseQuote A股 总股本=12.50亿', aQ && Math.abs(aQ.shares - 12.5) < 0.01, aQ && aQ.shares);
ok('parseQuote 空串→null', dom.window.parseQuote('a', '') === null);
ok('fetchLive 已定义（无网络环境下不崩溃）', typeof dom.window.fetchLive === 'function');

log.push('— 预设下拉（原生 select，兜底 datalist：Safari 不显示 datalist）—');
const sel = doc.getElementById('stockPick');
ok('存在 select#stockPick', !!sel);
ok('下拉含占位 + ≥10 只预设', sel && sel.options.length >= 11, '选项数=' + (sel && sel.options.length));
['腾讯控股', '贵州茅台', '五粮液', '泸州老窖', '伊利股份', '美的集团', '中国神华', '海康威视', '比亚迪', '赛轮轮胎'].forEach(n => {
  ok('下拉含 ' + n, [...sel.options].some(o => o.value === n));
});
sel.value = '腾讯控股'; fire('stockPick', 'change');
ok('下拉选腾讯 → 同步 stockName', doc.getElementById('stockName').value === '腾讯控股');
ok('下拉选腾讯 → 带入股数 90.95', Math.abs(num(doc.getElementById('shares').value) - 90.95) < 0.001, doc.getElementById('shares').value);
ok('下拉选腾讯 → 自动开港股模式', doc.getElementById('showHkd').checked === true);
// 存为新预设后，下拉应同步新增
setVal('stockName', '测试股Y'); doc.getElementById('shares').value = 50; dom.window.savePreset();
ok('存预设后下拉同步新增', [...doc.getElementById('stockPick').options].some(o => o.value === '测试股Y'));

log.push('— WACC / g₂ 说明备注（两阶段 + 自定义现金流）—');
['panel1', 'panel2'].forEach(p => {
  const d = doc.querySelector('#' + p + ' details.note2');
  ok(p + ' 含 WACC/g₂ 备注', !!d && /WACC/.test(d.textContent) && /永续增长率/.test(d.textContent) && /8%~9%/.test(d.textContent) && /60%~80%/.test(d.textContent));
  ok(p + ' 备注用可折叠 details', !!doc.querySelector('#' + p + ' details.note2 > summary'));
});

console.log(log.join('\n'));
console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
