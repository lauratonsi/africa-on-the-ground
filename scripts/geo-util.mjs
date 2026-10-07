// Funzioni comuni agli script che preparano i contorni (prepare-geo, prepare-truesize).
// Douglas-Peucker su una lista di [lon, lat].
export function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const t2 = tol * tol;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d2;
      if (len2 === 0) d2 = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d2 = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }
      if (d2 > max) { max = d2; idx = i; }
    }
    if (max > t2) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
export const round = (pts) => pts.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
