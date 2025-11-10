export function encodePuzzle({ width, height, tiles }) {
  const payload = JSON.stringify({ w: width, h: height, t: tiles });
  return toUrlSafeBase64(payload);
}

export function decodePuzzle(payload) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const text = atob(padded);
  const { w, h, t } = JSON.parse(text);

  if (!Number.isInteger(w) || !Number.isInteger(h)) {
    throw new Error("Некорректные размеры");
  }

  const expectedLength = w * h;
  if (!Array.isArray(t) || t.length !== expectedLength) {
    throw new Error("Некорректное количество плиток");
  }

  const numericTiles = t.map((value) => Number(value));
  const tileSet = new Set(numericTiles);
  if (tileSet.size !== expectedLength || !tileSet.has(0)) {
    throw new Error("Плитки должны быть уникальны и содержать пустую");
  }

  return {
    width: w,
    height: h,
    tiles: numericTiles,
  };
}

function toUrlSafeBase64(text) {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
