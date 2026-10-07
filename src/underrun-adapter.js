// 入口（Work.register 容器合同）：DOM 注入 + 尺寸自适应 + 启动
// + 定时器/RAF 全量跟踪（destroy 一键清空，老游戏无拆解式清理）
Work.register({
  name: 'underrun',
  mount: function (ctx) {
    var st = ctx.stage;
    st.style.background = '#000';
    var style = document.createElement('style');
    style.textContent = "body{margin:0;background:#000}div:last-child{color:#e90;}b{animation:r 1s infinite;}@keyframes r{50%{opacity:0;}}#c{width:100%;height:100%;image-rendering:optimizeSpeed;image-rendering:pixelated;cursor:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHAQMAAAD+nMWQAAAABGdBTUEAALGPC/xhBQAAAAZQTFRFAAAA////pdmf3QAAAAF0Uk5TAEDm2GYAAAATSURBVAjXYxBgEGBgYDgGxEAWAAc4AQebSvKuAAAAAElFTkSuQmCC),auto;}#a{font-weight:bold;color:#c80;position:absolute;top:4vw;left:2vw;font-size:1.6vw;overflow:hidden;white-space:nowrap;width:94%;text-shadow: 0 0 7px #f70;transition:opacity 1s;}";
    document.head.appendChild(style);
    var c = document.createElement('canvas');
    c.id = 'c';
    c.width = ctx.bounds.w || 320;
    c.height = ctx.bounds.h || 180;
    ctx.onBounds(function (b) { c.width = b.w; c.height = b.h; });
    var a = document.createElement('code');
    a.id = 'a';
    st.appendChild(c); st.appendChild(a);
    this._nodes = [style, c, a];
    // 顶栏标题：原标题 'UNDERRUN'，缩短一半为 'UNDER'
    var title = document.createElement('div');
    title.textContent = 'UNDER';
    title.style.position = 'absolute';
    title.style.top = '8px';
    title.style.left = '10px';
    title.style.color = '#8aa';
    title.style.font = '12px monospace';
    title.style.pointerEvents = 'none';
    st.appendChild(title);
    this._nodes.push(title);
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
