// 入口（Work.register 容器合同）：DOM 注入 + 尺寸自适应 + 启动
// + 定时器/RAF 全量跟踪（destroy 一键清空，老游戏无拆解式清理）
// v1.1.0：怪物生成数量 ×3（见 underrun-game.js 生成点修改）
// v1.1.1（收尾联调）：样式全部限定在容器根内，避免污染宿主页面；
//   destroy 后零残留（DOM/定时器/RAF/原生函数/容器类名）。
// v1.1.2：移除对 <b> 的 opacity 闪烁动画及一切 CSS 过渡/动画残留。
//   击中闪白由 underrun-game.js 内部实现：受击时记录计时 W=0.1s，
//   在光源缓冲叠加强白光提高怪物顶点亮度，约 0.1s 后衰减恢复——
//   即“变白闪一下”的语义正确实现，不依赖任何 DOM/CSS 动画。
//   本文件样式仅保留静态规则（布局/光标/文本样式），全部限定
//   在 .underrun-root 根内，且 destroy 时连同 <style> 一并移除。
// 本版本：无 BGM（纯音效由 underrun-game.js 内部 WebAudio 短促发声，无长音频资源）
var VERSION = 'v1.1.2';

Work.register({
  name: 'underrun',
  mount: function (ctx) {
    var st = ctx.stage;
    st.style.background = '#000';
    st.style.position = 'relative';
    st.style.overflow = 'hidden';
    // 给容器根打标记类，所有 CSS 选择器都限定在 .underrun-root 内，
    // 防止 canvas/id 等全局选择器影响宿主页面
    this._prevClass = st.className || '';
    st.className = (st.className ? st.className + ' ' : '') + 'underrun-root';
    this._stage = st;
    var style = document.createElement('style');
    // 静态样式：无 transition、无 animation、无 keyframes。
    // 击中闪白由游戏内光源缓冲实现（underrun-game.js），此处零动画依赖。
    style.textContent =
      ".underrun-root canvas{width:100%;height:100%;image-rendering:optimizeSpeed;image-rendering:pixelated;" +
      "cursor:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHAQMAAAD+nMWQAAAABGdBTUEAALGPC/xhBQAAAAZQTFRFAAAA////pdmf3QAAAAF0Uk5TAEDm2GYAAAATSURBVAjXYxBgEGBgYDgGxEAWAAc4AQebSvKuAAAAAElFTkSuQmCC),auto;}" +
      ".underrun-root code{font-weight:bold;color:#c80;position:absolute;top:4vw;left:2vw;font-size:1.6vw;overflow:hidden;white-space:nowrap;width:94%;text-shadow:0 0 7px #f70;}";
    document.head.appendChild(style);
    var c = document.createElement('canvas');
    c.width = (ctx.bounds && ctx.bounds.w) || 320;
    c.height = (ctx.bounds && ctx.bounds.h) || 180;
    // 尺寸合同：跟随容器 bounds 变化重设画布分辨率（w/h 字段）
    ctx.onBounds(function (b) {
      c.width = b.w;
      c.height = b.h;
    });
    var a = document.createElement('code');
    st.appendChild(c);
    st.appendChild(a);
    // 页脚：仅显示纯版本号（VERSION 驱动），底部居中、不拦截交互，
    // 用内联样式逐条赋值（不用 cssText，不依赖任何选择器）
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
    this._nodes = [style, c, a, footer];
    var self = this;
    self._timers = [];
    self._rafs = [];
    // 跟踪全局 setTimeout/setInterval/requestAnimationFrame，
    // 句柄全部登记，destroy 统一清理并还原原生函数。
    var oST = window.setTimeout, oSIT = window.setInterval,
        oRAF = window.requestAnimationFrame;
    this._origTimers = [oST, oSIT, oRAF];
    window.setTimeout = function (f, t) {
      var id = oST(function () { if (!self._dead && typeof f === 'function') f(); }, t);
      self._timers.push(id);
      return id;
    };
    window.setInterval = function (f, t) {
      var id = oSIT(function () { if (!self._dead && typeof f === 'function') f(); }, t);
      self._timers.push(id);
      return id;
    };
    window.requestAnimationFrame = function (f) {
      var id = oRAF(function (t) { if (!self._dead) f(t); });
      self._rafs.push(id);
      return id;
    };
    // 启动游戏主体（underrun-game.js 提供的全局引导函数，无 BGM 启动）
    if (typeof underrun_boot === 'function') {
      underrun_boot(c, a);
    } else if (typeof underrun_start === 'function') {
      underrun_start(c, a);
    }
  },
  destroy: function () {
    this._dead = true;
    var self = this;
    // 停止游戏主循环（underrun-game.js 暴露的停止钩子，若存在）
    if (window.__underrun_stop) {
      try { window.__underrun_stop(); } catch (e) {}
      delete window.__underrun_stop;
    }
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
    // 清理容器根标记类，保证重复挂载干净（零残留）
    var st = self._stage;
    if (st) {
      st.className = self._prevClass || '';
      st.style.background = '';
      st.style.position = '';
      st.style.overflow = '';
      self._stage = null;
    }
    self._timers = [];
    self._rafs = [];
    self._nodes = [];
    self._origTimers = null;
    self._prevClass = null;
  },
});
