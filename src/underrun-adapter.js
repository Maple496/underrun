// 入口（Work.register 容器合同）：DOM 注入 + 尺寸自适应 + 启动
// + 定时器/RAF 全量跟踪（destroy 一键清空，老游戏无拆解式清理）
// v1.1.0：怪物生成数量 ×3（见 underrun-game.js 生成点修改）
// 本版本：无 BGM（纯音效由 underrun-game.js 内部 WebAudio 短促发声，无长音频资源）
var VERSION = 'v1.1.0';

Work.register({
  name: 'underrun',
  mount: function (ctx) {
    var st = ctx.stage;
    st.style.background = '#000';
    st.style.position = 'relative';
    st.style.overflow = 'hidden';
    var style = document.createElement('style');
    style.textContent = "body{margin:0;background:#000}div:last-child{color:#e90;}b{animation:r 1s infinite;}@keyframes r{50%{opacity:0;}}#c{width:100%;height:100%;image-rendering:optimizeSpeed;image-rendering:pixelated;cursor:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHAQMAAAD+nMWQAAAABGdBTUEAALGPC/xhBQAAAAZQTFRFAAAA////pdmf3QAAAAF0Uk5TAEDm2GYAAAATSURBVAjXYxBgEGBgYDgGxEAWAAc4AQebSvKuAAAAAElFTkSuQmCC),auto;}#a{font-weight:bold;color:#c80;position:absolute;top:4vw;left:2vw;font-size:1.6vw;overflow:hidden;white-space:nowrap;width:94%;text-shadow: 0 0 7px #f70;transition:opacity 1s;}";
    document.head.appendChild(style);
    var c = document.createElement('canvas');
    c.id = 'c';
    c.width = (ctx.bounds && ctx.bounds.w) || 320;
    c.height = (ctx.bounds && ctx.bounds.h) || 180;
    ctx.onBounds(function (b) { c.width = b.w; c.height = b.h; });
    var a = document.createElement('code');
    a.id = 'a';
    st.appendChild(c); st.appendChild(a);
    this._nodes = [style, c, a];
    // 页脚：仅显示纯版本号（VERSION 驱动，textContent 绑定该常量），
    // 底部居中、不拦截交互
    var footer = document.createElement('div');
    footer.textContent = VERSION;
    footer.style.position = 'absolute';
    footer.style.bottom = '0';
    footer.style.left = '0';
    footer.style.right = '0';
    footer.style.textAlign = 'center';
    footer.style.color = '#8aa';
    footer.style.font = '12px monospace';
    footer.style.lineHeight = '16px';
    footer.style.pointerEvents = 'none';
    footer.style.userSelect = 'none';
    footer.style.zIndex = '10';
    footer.style.textShadow = '0 0 4px #000';
    st.appendChild(footer);
    this._nodes.push(footer);
    var self = this;
    self._timers = []; self._rafs = [];
    // 跟踪全局 setTimeout/setInterval/requestAnimationFrame，
    // 句柄全部登记，destroy 统一清理并还原原生函数。
    var oST = window.setTimeout, oSIT = window.setInterval,
        oRAF = window.requestAnimationFrame;
    this._origTimers = [oST, oSIT, oRAF];
    window.setTimeout = function (f, t) {
      var id = oST(function () { if (!self._dead && typeof f === 'function') f(); }, t);
      self._timers.push(id); return id;
    };
    window.setInterval = function (f, t) {
      var id = oSIT(function () { if (!self._dead && typeof f === 'function') f(); }, t);
      self._timers.push(id); return id;
    };
    window.requestAnimationFrame = function (f) {
      var id = oRAF(function (t) { if (!self._dead) f(t); });
      self._rafs.push(id); return id;
    };
    // 启动游戏主体（underrun-game.js 提供的全局引导函数，无 BGM 启动）
    if (typeof underrun_boot === 'function') {
      underrun_boot(c, a);
    } else if (typeof underrun_start === 'function') {
      underrun_start(c, a);
    }
  },
  destroy: function () {
    this._dead = !0;
    // 停止游戏主循环（underrun-game.js 暴露的停止钩子，若存在）
    if (window.__underrun_stop) {
      try { window.__underrun_stop(); } catch (e) {}
      delete window.__underrun_stop;
    }
    var self = this;
    // 清空全部登记的定时器与 RAF 句柄（clearTimeout/clearInterval 对两类 id 均安全）
    (self._timers || []).forEach(function (id) { clearTimeout(id); clearInterval(id); });
    (self._rafs || []).forEach(function (id) { cancelAnimationFrame(id); });
    // 还原被替换的原生定时器函数
    var orig = self._origTimers;
    if (orig && orig.length === 3) {
      window.setTimeout = orig[0];
      window.setInterval = orig[1];
      window.requestAnimationFrame = orig[2];
    }
    // 移除全部注入的 DOM 节点（含 style/canvas/code/页脚）
    (self._nodes || []).forEach(function (n) {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
    self._timers = []; self._rafs = []; self._nodes = []; self._origTimers = null;
  },
});
