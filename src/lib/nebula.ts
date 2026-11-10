// 星云贴图的生成。只在浏览器里调用（用到了 document / canvas）。
//
// 思路：用分形噪声算出一张小的“云絮蒙版”（纯白 + 透明度），再按主题色染色。
// 贴图很小（默认 256px），画到屏幕上时放大十来倍——云本来就是糊的，放大反而自然，
// 而生成一张只要十几毫秒。

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 固定种子的随机数，保证每次刷新长得一样 */
export const createRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}

/** 二维值噪声，返回 0..1 */
function createNoise(seed: number) {
  const rand = createRandom(seed)
  const perm = new Uint8Array(256)
  const values = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    perm[i] = i
    values[i] = rand()
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  const at = (x: number, y: number) => values[perm[(perm[x & 255] + y) & 255]]

  return (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    const a = at(ix, iy)
    const b = at(ix + 1, iy)
    const c = at(ix, iy + 1)
    const d = at(ix + 1, iy + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

/** 分形叠加：每一层频率翻倍、振幅减半 */
function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves: number) {
  let sum = 0
  let amp = 0.5
  let total = 0
  for (let i = 0; i < octaves; i++) {
    sum += noise(x, y) * amp
    total += amp
    x *= 2.03
    y *= 2.03
    amp *= 0.5
  }
  return sum / total
}

/**
 * 生成一张云絮蒙版。先用一层噪声把坐标“搅”一下（domain warping），
 * 再取噪声，这样出来的是有丝缕、有卷曲的云，而不是一团均匀的雾。
 * 四周按圆形渐隐，贴到画面上不会露出方形边缘。
 */
export function createNebulaMask(seed: number, size = 256) {
  const noise = createNoise(seed)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const image = ctx.createImageData(size, size)
  const data = image.data
  const scale = 2.6 / size

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x * scale
      const py = y * scale
      const qx = fbm(noise, px + 3.1, py + 7.7, 3)
      const qy = fbm(noise, px + 11.4, py + 1.3, 3)
      const n = fbm(noise, px + 3.2 * qx, py + 3.2 * qy, 5)
      const wisp = smoothstep(0.4, 0.72, n)

      const dx = (x / size - 0.5) * 2
      const dy = (y / size - 0.5) * 2
      const envelope = 1 - smoothstep(0.15, 1, Math.hypot(dx, dy))

      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = 255
      data[i + 3] = Math.round(255 * envelope * (0.08 + 0.92 * wisp))
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/** 把白色蒙版染成指定颜色，返回新的 canvas */
export function tintMask(mask: HTMLCanvasElement, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = mask.width
  canvas.height = mask.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(mask, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

/** 亮星的贴图：一圈柔光 + 十字星芒 */
export function createGlintSprite(color: string, size = 96) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const c = size / 2

  const glow = ctx.createRadialGradient(c, c, 0, c, c, size * 0.2)
  glow.addColorStop(0, color)
  glow.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.55
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.globalAlpha = 0.9
  for (const horizontal of [true, false]) {
    const spike = horizontal ? ctx.createLinearGradient(0, c, size, c) : ctx.createLinearGradient(c, 0, c, size)
    spike.addColorStop(0, 'transparent')
    spike.addColorStop(0.5, color)
    spike.addColorStop(1, 'transparent')
    ctx.fillStyle = spike
    if (horizontal) ctx.fillRect(0, c - 0.6, size, 1.2)
    else ctx.fillRect(c - 0.6, 0, 1.2, size)
  }

  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(c, c, 1.6, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}
