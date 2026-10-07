#!/usr/bin/env python3
"""从 build/underrun.html 生成席位约定布局：src/underrun-{assets,game,adapter}.js
+ project.json（工程档案仓库的派生层；构建链 = build.sh + 本脚本）。"""
import base64, json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, "build", "underrun.html"), encoding="utf-8").read()
style = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
game = max(re.findall(r"<script>(.*?)</script>", html, re.S), key=len)

uris = {}
for name in ("q2", "l1", "l2", "l3"):
    b = open(os.path.join(ROOT, "m", name + ".png"), "rb").read()
    uris[name] = "data:image/png;base64," + base64.b64encode(b).decode()

# 游戏码补丁：资产装载器走 __URIS；RAF 挂 __alive 停帧钩子；包进 boot 函数
# 保留原赋值目标变量名（混淆名随构建变化，onload 引用必须同源）
game, n1 = re.subn(r'\((\w+)=new Image\)\.src="m/"\+(\w+)\+"\.png"',
                   r"(\1=new Image).src=__URIS[\2]", game)
game = game.replace(",t.onload=t", ",t.onload=t")
game, n2 = re.subn(r"requestAnimationFrame\((\w+)\)",
                   r"__alive&&requestAnimationFrame(\1)", game)
assert n1 == 1 and n2 == 1, (n1, n2)

os.makedirs(os.path.join(ROOT, "src"), exist_ok=True)
open(os.path.join(ROOT, "src", "underrun-assets.js"), "w", encoding="utf-8").write(
    "// 资产 data URI（由 tools/gen_src.py 从 m/*.png 生成）\n"
    "var __URIS = " + json.dumps(uris) + ";\n")
open(os.path.join(ROOT, "src", "underrun-game.js"), "w", encoding="utf-8").write(
    "// UNDERRUN 游戏本体（js13k 2018 压缩产物，phoboslab，MIT）\n"
    "// 由 tools/gen_src.py 从 build/underrun.html 派生：资产走 __URIS，\n"
    "// RAF 挂 __alive（destroy 停帧），整体封装为 underrun_boot(c, a)\n"
    "var __alive = !0;\n"
    "window.__underrun_stop = function () { __alive = !1; };\n"
    "function underrun_boot(c, a) {\n" + game + "\n}\n")
css_js = json.dumps("body{margin:0;background:#000}" + style)
open(os.path.join(ROOT, "src", "underrun-adapter.js"), "w", encoding="utf-8").write(
    "// 入口（Work.register 容器合同）：DOM 注入 + 尺寸自适应 + 启动\n"
    "// + 定时器/RAF 全量跟踪（destroy 一键清空，老游戏无拆解式清理）\n"
    "Work.register({\n"
    "  name: 'underrun',\n"
    "  mount: function (ctx) {\n"
    "    var st = ctx.stage;\n"
    "    st.style.background = '#000';\n"
    "    var style = document.createElement('style');\n"
    "    style.textContent = " + css_js + ";\n"
    "    document.head.appendChild(style);\n"
    "    var c = document.createElement('canvas');\n"
    "    c.id = 'c';\n"
    "    c.width = ctx.bounds.w || 320;\n"
    "    c.height = ctx.bounds.h || 180;\n"
    "    ctx.onBounds(function (b) { c.width = b.w; c.height = b.h; });\n"
    "    var a = document.createElement('code');\n"
    "    a.id = 'a';\n"
    "    st.appendChild(c); st.appendChild(a);\n"
    "    this._nodes = [style, c, a];\n"
    "    var self = this;\n"
    "    self._timers = []; self._rafs = [];\n"
    "    var oST = window.setTimeout, oSIT = window.setInterval,\n"
    "        oRAF = window.requestAnimationFrame;\n"
    "    window.setTimeout = function (f, t) {\n"
    "      var id = oST(function () { if (!self._dead && typeof f === 'function') f(); }, t);\n"
    "      self._timers.push(id); return id;\n"
    "    };\n"
    "    window.setInterval = function (f, t) {\n"
    "      var id = oSIT(function () { if (!self._dead && typeof f === 'function') f(); }, t);\n"
    "      self._timers.push(id); return id;\n"
    "    };\n"
    "    window.requestAnimationFrame = function (f) {\n"
    "      var id = oRAF(function (t) { if (!self._dead) f(t); });\n"
    "      self._rafs.push(id); return id;\n"
    "    };\n"
    "    underrun_boot(c, a);\n"
    "  },\n"
    "  destroy: function () {\n"
    "    this._dead = !0;\n"
    "    if (window.__underrun_stop) window.__underrun_stop();\n"
    "    var self = this;\n"
    "    (self._timers || []).forEach(function (id) { clearTimeout(id); clearInterval(id); });\n"
    "    (self._rafs || []).forEach(function (id) { cancelAnimationFrame(id); });\n"
    "    (self._nodes || []).forEach(function (n) {\n"
    "      if (n.parentNode) n.parentNode.removeChild(n);\n"
    "    });\n"
    "  },\n"
    "});\n")
files = [{"path": "src/underrun-assets.js", "role": "资产 data URI 表"},
         {"path": "src/underrun-game.js", "role": "游戏本体（压缩产物，勿手改，改 source/ 后重建）"},
         {"path": "src/underrun-adapter.js", "role": "入口：容器适配与启动"}]
json.dump({"name": "UNDERRUN", "brief": "phoboslab js13k 2018 射击（MIT）汉化移植版",
           "entry": "src/underrun-adapter.js", "files": files,
           "generated_by": "proj_forge（AI 工程工坊）"},
          open(os.path.join(ROOT, "project.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("src/ 三文件 + project.json 已生成")
