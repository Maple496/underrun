// 入口（Work.register 容器合同）：DOM 注入 + 尺寸自适应 + 启动
// + 定时器/RAF 全量跟踪（destroy 一键清空，老游戏无拆解式清理）
var VERSION = 'v1.0.0';

Work.register({
  name: 'underrun',
  mount: function (ctx) {
    var st = ctx.stage;
    st.style.background = '#000';
    st.style.position = 'relative';
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
    // 底部居中、不拦截交互；VERSION 更新时此处文本随之更新
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
    var oST = window.setTimeout, oSIT = window.setInterval,
        oRAF = window.requestAnimationFrame;
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
    underrun_boot(c, a);
  },
  destroy: function () {
    this._dead = !0;
    if (window.__underrun_stop) window.__underrun_stop();
    var self = this;
    (self._timers || []).forEach(function (id) { clearTimeout(id); clearInterval(id); });
    (self._rafs || []).forEach(function (id) { cancelAnimationFrame(id); });
    (self._nodes || []).forEach(function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });
    self._timers = []; self._rafs = []; self._nodes = [];
  },
});
