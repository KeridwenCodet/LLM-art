# Canvas visual verification

Use this recipe when a canvas runs without JavaScript errors but its page capture looks empty, too dark, or different from expected.

## Capture in a stable order

1. Let the animation reach the state to inspect.
2. Pause it through its real control and allow one rendering turn to settle.
3. Extract the raw bitmap with `canvas.toDataURL('image/png')` and save it.
4. Take a viewport screenshot with `fullPage: false`.
5. Only then test full-page capture or hide overlays for comparison.

Keeping the canvas paused and the capture order stable prevents simulation changes from being mistaken for compositing bugs.

A Puppeteer-style probe should collect:

```js
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.click('#pause');
const raw = await page.$eval('canvas', canvas =>
  canvas.toDataURL('image/png')
);
const state = await page.evaluate(() => ({
  width: document.querySelector('canvas').width,
  height: document.querySelector('canvas').height,
  overflow: document.documentElement.scrollWidth > innerWidth
}));
await page.screenshot({ path: 'canvas-page.png', fullPage: false });
```

Adapt selectors and paths to the artifact; do not assume a particular browser installation.

## Diagnose from comparisons

| Observation | Next action |
|---|---|
| Raw bitmap and page both lack the motif | Inspect drawing coordinates, alpha, compositing, and simulation state. |
| Raw bitmap has the motif but page does not | Compare overlays and stacking contexts; temporarily hide grain, vignette, and blend layers one at a time. |
| Viewport capture works but full-page capture is blank | Check for resize listeners that clear or reseed the canvas during capture. |
| Artwork disappears only while paused or after resizing | Preserve the bitmap or redraw a complete representative frame after resize. |
| Still capture works but interaction fails | Exercise pointer and button events and inspect their visible state, not only console errors. |

## Guard resize without erasing unchanged canvases

Compute the next CSS dimensions, DPR, and backing-store size first. Return without touching the canvas when all are unchanged. Assigning `canvas.width` or `canvas.height` clears the bitmap even when assigned the same value, so avoid those assignments on redundant events.

After a genuine resize, either scale/copy the old bitmap into the new canvas or render enough frames to reconstruct the intended composition immediately. Do not leave a paused canvas showing only its background.

## Validate the correction visually

Inspect the final page capture at normal size, not only a brightened diagnostic. A brightened raw bitmap is useful for finding structure but cannot prove normal-view legibility. Confirm the focal form, text contrast, absence of clipping, and visible interaction feedback in the final unmodified render.
