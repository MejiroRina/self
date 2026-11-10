<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

// 一个“终端区块”：标题是一条命令，内容是它的输出。
// 进入视口时命令被敲出来、输出随后显现（样式在 assets/index.css 的 .term 部分）。
defineProps<{ id: string; cmd: string; title: string }>()

const root = ref<HTMLElement>()
const shown = ref(false)

onMounted(() => {
  const { stop } = useIntersectionObserver(
    root,
    ([entry]) => {
      if (entry?.isIntersecting) {
        shown.value = true
        stop()
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
})
</script>

<template>
  <section :id="id" ref="root" class="term" :class="{ 'is-in': shown }" :aria-labelledby="`${id}-title`">
    <h2 class="mb-6 flex flex-wrap items-baseline gap-x-3 text-base font-semibold sm:text-lg">
      <span class="text-mint" aria-hidden="true">❯</span>
      <span class="term-cmd-text" :style="{ '--n': cmd.length }" aria-hidden="true">{{ cmd }}</span>
      <span :id="`${id}-title`" class="term-title font-normal text-dim"># {{ title }}</span>
    </h2>
    <div class="term-out">
      <slot />
    </div>
  </section>
</template>
