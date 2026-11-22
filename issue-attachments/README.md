# Fix: Dream Skin `backdrop-filter` breaks CSS anchor positioning of native popovers

## Symptom

Hovering a project row in the Codex sidebar makes the native hover preview card
appear in the **top-left corner of the window** instead of next to the row.

## Root cause

`runtime/dream-skin.css` (and `windows/assets/dream-skin.css`) ships:

```css
/* These three native popup families can overlap conversation text. Blur the
   backdrop of the painted popup, retaining the uploaded background alpha. */
html[data-dream-skin="active"][data-dream-upload-alpha="true"]
  :is([role="menu"], [data-ds-part="dialog"], [data-composer-overlay-floating-ui="true"] > :has(> [data-mention-list-scroll-area])) {
  backdrop-filter: blur(24px) !important;
}
```

A non-`none` `backdrop-filter` makes the element a **containing block** for its
`position: fixed` descendants (same effect as `transform` / `filter`).

Codex positions the native hover preview card with
`position: fixed` + CSS Anchor Positioning
(`position-anchor: --native-popover-_r_…`, `position-area`).
The popover host `[data-ds-part="dialog"]` matches the rule above and receives
`backdrop-filter`, so it becomes the containing block of the fixed card.
Anchor resolution then fails and the browser falls back to plain inset
positioning — the card lands at the viewport origin `[2, 0]`.

Note that `[data-ds-part="dialog"]` matches the `:is(...)` branch directly;
the `:has()` branch is irrelevant to the breakage.

## Measured (Codex 26.1117.4957.0, Chromium 158.0.8127.37, Dream Skin 1.5.20)

| | popover host `backdrop-filter` | card `backdrop-filter` | card rect |
|---|---|---|---|
| before | `blur(24px)` | `none` | `[2, 0, 336, 226]` — stuck at viewport origin |
| after | `none` | `blur(24px)` | `[291, 197, 336, 130]` — anchored to the row |

`position-anchor` stays `--native-popover-_r_…` in both cases; only the
containing block changed.

## Workaround in this gist

`fix-dream-skin-popover-anchor.js` moves the blur from the popover host to the
card that actually paints the content, so the visual result is unchanged while
anchor positioning keeps working.

```js
const HOST_SELECTOR =
  'html[data-dream-skin="active"][data-dream-upload-alpha="true"] ' +
  '[popover][data-ds-part="dialog"]:has(> [data-anchor-positioning])';
const CARD_SELECTOR = `${HOST_SELECTOR} > [data-anchor-positioning]`;
```

The selector must mirror Dream Skin's own condition (`data-dream-upload-alpha`
included) — otherwise specificity ties and the result depends on stylesheet
order, which makes the fix work only intermittently.

## Files

- `fix-dream-skin-popover-anchor.js` — the workaround (Codex++ user script)
- `screenshot-1-report.png`, `screenshot-2-report.png` — screenshots from the report
