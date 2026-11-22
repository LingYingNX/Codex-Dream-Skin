// ==UserScript==
// @name         Fix Dream Skin Popover Anchor
// @namespace    codexpp-fix-dream-skin-popover-anchor
// @version      1.0.0
// @description  修复 Dream Skin 给原生 popover 宿主加 backdrop-filter 后，CSS anchor 定位失效导致 hover 卡片飞到窗口左上角的问题。
// @match        app://-/*
// @run-at       document-start
// ==/UserScript==

/* Codex++ external extension: keep CSS anchor positioning working for native popovers.
 *
 * Dream Skin 给 [data-ds-part="dialog"] / [role="menu"] 加 `backdrop-filter: blur(24px) !important`。
 * backdrop-filter 会让元素成为 fixed 后代的包含块，而原生 hover 卡片用的是
 * `position: fixed` + `position-anchor` / `position-area`（CSS Anchor Positioning）。
 * 包含块被 blur 元素劫持后锚点解析失效，浏览器退回到 inset 定位，卡片被摆到视口左上角。
 *
 * 只把 blur 从 popover 宿主移到真正显示内容的那层卡片上，视觉不变，定位恢复。
 */
(() => {
  const STYLE_ID = "codexpp-fix-dream-skin-popover-anchor-style";
  // 选择器必须和 Dream Skin 那条规则的条件完全对齐（同样的 data-dream-upload-alpha、
  // 同样的后代层级），否则特异性打平、胜负交给样式表顺序，修复会时灵时不灵。
  const HOST_SELECTOR =
    'html[data-dream-skin="active"][data-dream-upload-alpha="true"] ' +
    '[popover][data-ds-part="dialog"]:has(> [data-anchor-positioning])';
  const CARD_SELECTOR = `${HOST_SELECTOR} > [data-anchor-positioning]`;

  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    // 宿主不再劫持包含块，锚点定位得以生效。
    `${HOST_SELECTOR}{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}`,
    // 毛玻璃效果挪到卡片本身，视觉与 Dream Skin 一致。
    `${CARD_SELECTOR}{backdrop-filter:blur(24px) !important;-webkit-backdrop-filter:blur(24px) !important;}`,
  ].join("\n");
  (document.head || document.documentElement).appendChild(style);
})();
