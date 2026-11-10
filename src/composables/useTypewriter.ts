import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * 打字机。只有一句时打完就停；有多句时打完停留片刻、删掉、再打下一句，循环往复。
 * 文案变化（比如切换语言）时会重新开始。
 */
export function useTypewriter(lines: Ref<string[]>) {
  const typed = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let run = 0

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms)
    })

  // 汉字、假名比字母“重”，打慢一点才自然
  const delayOf = (ch: string) => (ch.charCodeAt(0) > 0x2e7f ? 110 : 46)

  const start = async (delay: number) => {
    const id = ++run
    clearTimeout(timer)
    const list = lines.value
    typed.value = ''
    if (!list.length) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      typed.value = list[0]
      return
    }

    await wait(delay)
    for (let i = 0; id === run; i = (i + 1) % list.length) {
      for (const ch of list[i]) {
        if (id !== run) return
        typed.value += ch
        await wait(delayOf(ch))
      }
      if (list.length === 1) return
      await wait(2800)
      while (typed.value && id === run) {
        typed.value = typed.value.slice(0, -1)
        await wait(22)
      }
      await wait(350)
    }
  }

  onMounted(() => {
    // 首次访问要等开场动画播完再开始打字
    start(document.documentElement.dataset.boot === 'skip' ? 500 : 1900)
  })

  watch(lines, () => start(200))

  onBeforeUnmount(() => {
    run++
    clearTimeout(timer)
  })

  return { typed }
}
