<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFx } from '@/composables/useFx'
import { createGlintSprite, createNebulaMask, createRandom, tintMask } from '@/lib/nebula'

// 铺满整页的固定背景，全部画在一张 Canvas 上，从下到上依次是：
//   1. 星云：几团由噪声生成的云絮，缓慢漂移、旋转、呼吸
//   2. 银河：沿对角线分布的一条星尘带
//   3. 星星：三种景深，会闪烁，随鼠标和滚动产生视差，鼠标附近的会被“照亮”
//   4. 亮星：带十字星芒的几颗
//   5. 流星：只在深色主题下出现
//
// 省电的几处处理：
//   - 星云动得很慢，所以先画到一张半分辨率的离屏画布上，每 ~110ms 才重画一次，
//     每帧只做一次整屏贴图
//   - 往下滚动后整体变暗，不干扰正文阅读
//   - 开启“减少动态效果”时只画静态的一帧；帧率太低时自动降低分辨率
//   - 访客可以用右上角的开关彻底关掉（见 composables/useFx.ts）

interface Star {
  x: number
  y: number
  z: number
  r: number
  a: number
  phase: number
  speed: number
  tint: number
}

interface Dust {
  t: number
  off: number
  r: number
  a: number
  phase: number
}

interface Glint {
  x: number
  y: number
  size: number
  phase: number
  speed: number
}

interface Meteor {
  x: number
  y: number
  dx: number
  dy: number
  speed: number
  len: number
  life: number
  dur: number
}

type Tone = 'iris' | 'rose' | 'mint' | 'ink'

interface Cloud {
  mask: number
  tone: Tone
  /** 中心位置，占视口宽 / 高的比例 */
  x: number
  y: number
  /** 大小，相对于视口长边 */
  size: number
  stretch: [number, number]
  rot: number
  /** 自转速度（弧度 / 秒） */
  spin: number
  /** 漂移幅度（相对长边）与周期（秒） */
  drift: number
  period: number
  phase: number
  alpha: number
}

// 想调星云的位置、颜色、浓淡，改这张表就行
const CLOUDS: Cloud[] = [
  { mask: 0, tone: 'iris', x: 0.14, y: 0.16, size: 1.3, stretch: [1.15, 0.9], rot: 0.3, spin: 0.006, drift: 0.05, period: 74, phase: 0, alpha: 0.46 },
  { mask: 1, tone: 'rose', x: 0.9, y: 0.44, size: 1.15, stretch: [1, 1.05], rot: 1.2, spin: -0.005, drift: 0.045, period: 92, phase: 2.1, alpha: 0.38 },
  { mask: 2, tone: 'mint', x: 0.42, y: 1.02, size: 1, stretch: [1.25, 0.8], rot: -0.4, spin: 0.004, drift: 0.04, period: 83, phase: 4.2, alpha: 0.26 },
  { mask: 1, tone: 'iris', x: 0.64, y: 0.04, size: 0.85, stretch: [1.1, 0.85], rot: 2.6, spin: 0.007, drift: 0.035, period: 66, phase: 1.3, alpha: 0.26 },
  { mask: 0, tone: 'rose', x: 0.22, y: 0.72, size: 0.7, stretch: [1, 1], rot: 3.9, spin: -0.006, drift: 0.04, period: 101, phase: 5.2, alpha: 0.18 },
  // 银河的底光：一条斜着拉长的云
  { mask: 2, tone: 'ink', x: 0.5, y: 0.52, size: 1.55, stretch: [1.5, 0.3], rot: -0.6, spin: 0, drift: 0.01, period: 120, phase: 0.7, alpha: 0.14 },
]

// 银河的走向（与上表最后一行的 rot 一致）
const BAND_ANGLE = -0.6
const TAU = Math.PI * 2
/** 离屏星云画布四周多画出来的边，用来容纳鼠标视差的位移 */
const MARGIN = 48
/** 离屏星云画布比视口高出的比例，用来容纳滚动视差的位移 */
const OVERSCAN = 0.15

const canvas = ref<HTMLCanvasElement>()
const { fxOn } = useFx()
let cleanup = () => {}
let setEnabled = (_on: boolean) => {}

watch(fxOn, (on) => setEnabled(on))

onMounted(() => {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  const nebula = document.createElement('canvas')
  const nctx = nebula.getContext('2d')
  if (!el || !ctx || !nctx) return

  const root = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const rand = createRandom(20260518)
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5

  const stars: Star[] = Array.from({ length: 460 }, () => {
    const z = rand()
    return {
      x: rand(),
      y: rand(),
      z,
      r: 0.35 + z * z * 1.25,
      a: 0.28 + z * 0.72,
      phase: rand() * TAU,
      speed: 0.4 + rand() * 1.5,
      tint: rand() < 0.76 ? 0 : 1 + Math.floor(rand() * 3),
    }
  })
  const dust: Dust[] = Array.from({ length: 300 }, () => ({
    t: rand() - 0.5,
    off: gauss(),
    r: 0.3 + rand() * 0.5,
    a: 0.16 + rand() * 0.4,
    phase: rand() * TAU,
  }))
  const glints: Glint[] = Array.from({ length: 9 }, () => ({
    x: 0.04 + rand() * 0.92,
    y: 0.04 + rand() * 0.92,
    size: 16 + rand() * 20,
    phase: rand() * TAU,
    speed: 0.5 + rand() * 0.9,
  }))

  let enabled = fxOn.value
  let w = 0
  let h = 0
  let vmax = 0
  let dprCap = 2
  let dark = false
  let tones: Record<Tone, string> = { iris: '', rose: '', mint: '', ink: '' }
  let starFill: string[] = []
  let glintSprite: HTMLCanvasElement | null = null
  let masks: HTMLCanvasElement[] = []
  let tinted: (HTMLCanvasElement | undefined)[] = []
  let nebulaAt = -Infinity
  let nebulaSince = 0

  let px = 0
  let py = 0
  let tx = 0
  let ty = 0
  let mx = 0
  let my = 0
  let pointerOn = false

  let raf = 0
  let last = performance.now()
  let frames = 0
  let slowTime = 0
  const meteors: Meteor[] = []
  let nextMeteor = last + 4500

  const readTheme = () => {
    const style = getComputedStyle(root)
    const read = (name: string) => style.getPropertyValue(name).trim()
    dark = root.classList.contains('dark')
    tones = { iris: read('--iris'), rose: read('--rose'), mint: read('--mint'), ink: read('--ink') }
    starFill = [dark ? tones.ink : tones.iris, tones.mint, tones.rose, tones.iris]
    glintSprite = createGlintSprite(dark ? tones.ink : tones.iris)
    tinted = CLOUDS.map((c) => (masks[c.mask] ? tintMask(masks[c.mask], tones[c.tone]) : undefined))
    nebulaAt = -Infinity
  }

  // 把星云画到半分辨率的离屏画布上
  const renderNebula = (now: number) => {
    const scale = 0.5
    const nw = Math.ceil((w + MARGIN * 2) * scale)
    const nh = Math.ceil((h * (1 + OVERSCAN) + MARGIN * 2) * scale)
    if (nebula.width !== nw || nebula.height !== nh) {
      nebula.width = nw
      nebula.height = nh
    } else {
      nctx.setTransform(1, 0, 0, 1, 0, 0)
      nctx.clearRect(0, 0, nw, nh)
    }
    nctx.setTransform(scale, 0, 0, scale, MARGIN * scale, MARGIN * scale)
    // 深色主题下用叠加发光，云与云重叠处会更亮；浅色主题下是普通的淡彩
    nctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
    const gain = dark ? 1 : 0.66
    const t = reduce ? 0 : now / 1000

    CLOUDS.forEach((c, i) => {
      const image = tinted[i]
      if (!image) return
      const swing = (t * TAU) / c.period + c.phase
      const size = c.size * vmax * (1 + 0.07 * Math.sin(swing * 1.3))
      nctx.save()
      nctx.translate(c.x * w + Math.sin(swing) * c.drift * vmax, c.y * h + Math.cos(swing * 0.77) * c.drift * vmax * 0.7)
      nctx.rotate(c.rot + t * c.spin)
      nctx.globalAlpha = c.alpha * gain * (0.86 + 0.14 * Math.sin(swing * 2.1))
      nctx.drawImage(image, (-size * c.stretch[0]) / 2, (-size * c.stretch[1]) / 2, size * c.stretch[0], size * c.stretch[1])
      nctx.restore()
    })
  }

  const spawnMeteor = (delay = 0) => {
    const angle = Math.PI * (0.72 + rand() * 0.16)
    meteors.push({
      x: w * (0.3 + rand() * 0.8),
      y: h * (-0.05 + rand() * 0.4),
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      speed: 520 + rand() * 380,
      len: 120 + rand() * 110,
      life: -delay,
      dur: 0.9 + rand() * 0.5,
    })
  }

  const render = (now: number) => {
    const dt = Math.min(now - last, 64)
    last = now
    const t = now * 0.001
    const scrollY = window.scrollY
    const scroll = reduce ? 0 : scrollY
    // 0 = 页面顶部，1 = 已经滚过一屏。越往下背景越暗，正文更好读
    const depth = h ? Math.min(scrollY / h, 1) : 0
    const gain = dark ? 1 : 0.45
    px += (tx - px) * 0.04
    py += (ty - py) * 0.04

    ctx.clearRect(0, 0, w, h)

    // 1. 星云
    if (masks.length) {
      if (now - nebulaAt > 110) {
        renderNebula(now)
        nebulaAt = now
      }
      const fadeIn = reduce ? 1 : Math.min((now - nebulaSince) / 2400, 1)
      ctx.globalAlpha = fadeIn * (1 - 0.58 * depth)
      ctx.drawImage(
        nebula,
        -MARGIN - px * 16,
        -MARGIN - py * 10 - Math.min(scroll * 0.06, h * OVERSCAN),
        w + MARGIN * 2,
        h * (1 + OVERSCAN) + MARGIN * 2,
      )
    }

    const starDim = 1 - 0.3 * depth

    // 2. 银河星尘
    const bandX = Math.cos(BAND_ANGLE)
    const bandY = Math.sin(BAND_ANGLE)
    ctx.fillStyle = starFill[0]
    for (let i = 0; i < dustCount; i++) {
      const d = dust[i]
      const along = d.t * vmax * 1.5
      const across = d.off * vmax * 0.085
      const x = w * 0.5 + bandX * along - bandY * across - px * 8
      const y = h * 0.52 + bandY * along + bandX * across - py * 6 - scroll * 0.03
      if (x < 0 || x > w || y < 0 || y > h) continue
      const twinkle = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.9 + d.phase)
      ctx.globalAlpha = d.a * twinkle * gain * starDim
      ctx.fillRect(x, y, d.r * 1.6, d.r * 1.6)
    }

    // 3. 星星
    const reach = 170
    for (let i = 0; i < starCount; i++) {
      const s = stars[i]
      const layer = 0.25 + s.z * 0.75
      const x = s.x * w - px * layer * 30
      const y = (((s.y * h - py * layer * 20 - scroll * layer * 0.12) % h) + h) % h
      const twinkle = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * s.speed + s.phase)
      let alpha = s.a * twinkle
      let r = s.r
      if (pointerOn) {
        const dx = x - mx
        const dy = y - my
        const d2 = dx * dx + dy * dy
        if (d2 < reach * reach) {
          // 鼠标像一盏灯，靠近的星星更亮、更大
          const boost = 1 - Math.sqrt(d2) / reach
          alpha = Math.min(1, alpha + boost * 0.7)
          r *= 1 + boost * 0.9
        }
      }
      ctx.fillStyle = starFill[s.tint]
      ctx.globalAlpha = alpha * gain * starDim
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
      if (s.z > 0.88) {
        ctx.globalAlpha *= 0.14
        ctx.beginPath()
        ctx.arc(x, y, r * 3.4, 0, TAU)
        ctx.fill()
      }
    }

    // 4. 带星芒的亮星
    if (glintSprite) {
      for (const g of glints) {
        const x = g.x * w - px * 34
        const y = (((g.y * h - py * 22 - scroll * 0.13) % h) + h) % h
        const pulse = reduce ? 0.85 : 0.6 + 0.4 * Math.sin(t * g.speed + g.phase)
        const size = g.size * (0.8 + 0.3 * pulse)
        ctx.globalAlpha = pulse * (dark ? 0.9 : 0.35) * starDim
        ctx.drawImage(glintSprite, x - size / 2, y - size / 2, size, size)
      }
    }

    // 5. 流星
    if (dark && !reduce) {
      if (now > nextMeteor) {
        spawnMeteor()
        if (rand() < 0.2) spawnMeteor(0.25)
        nextMeteor = now + 3500 + rand() * 6500
      }
      ctx.lineWidth = 1.4
      ctx.lineCap = 'round'
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        m.life += dt / 1000
        if (m.life < 0) continue
        if (m.life >= m.dur) {
          meteors.splice(i, 1)
          continue
        }
        const headX = m.x + m.dx * m.speed * m.life
        const headY = m.y + m.dy * m.speed * m.life
        const tailX = headX - m.dx * m.len
        const tailY = headY - m.dy * m.len
        const fade = Math.sin((Math.PI * m.life) / m.dur) * starDim
        const trail = ctx.createLinearGradient(headX, headY, tailX, tailY)
        trail.addColorStop(0, `rgb(236 235 250 / ${(0.95 * fade).toFixed(3)})`)
        trail.addColorStop(1, 'rgb(236 235 250 / 0)')
        ctx.globalAlpha = 1
        ctx.strokeStyle = trail
        ctx.beginPath()
        ctx.moveTo(headX, headY)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1

    // 帧率一直很低（比如没有硬件加速）就把分辨率降到 1 倍，只降一次
    if (!reduce && dprCap > 1) {
      frames++
      slowTime += dt
      if (frames === 120) {
        if (slowTime / frames > 36) {
          dprCap = 1
          resize()
        }
        frames = 0
        slowTime = 0
      }
    }
  }

  let starCount = 0
  let dustCount = 0

  const frame = (now: number) => {
    raf = 0
    if (!enabled) return
    render(now)
    if (!reduce) raf = requestAnimationFrame(frame)
  }

  /** 请求画一帧。动画进行中时什么都不用做；静态模式下靠它来刷新。 */
  const kick = () => {
    if (enabled && !raf) raf = requestAnimationFrame(frame)
  }

  function resize() {
    if (!el || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    w = el.clientWidth
    h = el.clientHeight
    if (!w || !h) return
    vmax = Math.max(w, h)
    el.width = Math.round(w * dpr)
    el.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 星星数量跟着屏幕面积走，手机上不会挤成一片
    starCount = Math.min(stars.length, Math.round((w * h) / 3000))
    dustCount = Math.min(dust.length, Math.round((w * h) / 4200))
    nebulaAt = -Infinity
    kick()
  }

  setEnabled = (on) => {
    enabled = on
    if (on) {
      last = performance.now()
      resize()
      kick()
      ensureMasks(0)
    } else {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  const onPointer = (e: PointerEvent) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2
    ty = (e.clientY / window.innerHeight - 0.5) * 2
    mx = e.clientX
    my = e.clientY
    pointerOn = true
  }
  const onPointerLeave = () => {
    pointerOn = false
  }

  const sizeObserver = new ResizeObserver(resize)
  sizeObserver.observe(el)

  const themeObserver = new MutationObserver(() => {
    readTheme()
    kick()
  })
  themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] })

  const trackPointer = !reduce && matchMedia('(pointer: fine)').matches
  if (trackPointer) {
    window.addEventListener('pointermove', onPointer, { passive: true })
    root.addEventListener('pointerleave', onPointerLeave)
  }
  // 静态模式下没有动画循环，滚动时手动刷新一帧，让“越往下越暗”仍然生效
  if (reduce) window.addEventListener('scroll', kick, { passive: true })

  readTheme()
  resize()

  // 云絮蒙版一张要算十几毫秒，分三次算，避免卡住首屏。
  // 特效关着的时候不算，等访客打开了再算。
  let building: 'idle' | 'busy' | 'done' | 'stopped' = 'idle'
  const timers: ReturnType<typeof setTimeout>[] = []
  const buildMask = (i: number) => {
    if (building !== 'busy') return
    masks = [...masks, createNebulaMask(7 + i * 131)]
    if (i < 2) {
      timers.push(setTimeout(() => buildMask(i + 1), 0))
      return
    }
    building = 'done'
    nebulaSince = performance.now()
    readTheme()
    kick()
  }
  function ensureMasks(delay: number) {
    if (building !== 'idle') return
    building = 'busy'
    timers.push(setTimeout(() => buildMask(0), delay))
  }
  if (enabled) ensureMasks(root.dataset.boot === 'skip' ? 0 : 250)

  cleanup = () => {
    building = 'stopped'
    timers.forEach(clearTimeout)
    cancelAnimationFrame(raf)
    sizeObserver.disconnect()
    themeObserver.disconnect()
    window.removeEventListener('pointermove', onPointer)
    root.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('scroll', kick)
  }
})

onBeforeUnmount(() => cleanup())
</script>

<template>
  <canvas ref="canvas" class="sky" aria-hidden="true"></canvas>
</template>

<style>
.sky {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  /* lvh：手机地址栏收起 / 展开时画布尺寸不变，星空不会跟着跳 */
  height: 100vh;
  height: 100lvh;
  pointer-events: none;
}

html[data-fx='off'] .sky {
  display: none;
}

@media (prefers-reduced-motion: no-preference) {
  .sky {
    animation: sky-in 1.8s ease-out var(--boot-delay) both;
  }
}

@keyframes sky-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
