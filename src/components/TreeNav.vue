<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { sections, site } from '@/data/site'

// 桌面端左侧的目录树导航，滚动时高亮当前所在的区块。
const active = ref('')

const update = () => {
  const line = window.innerHeight * 0.4
  let current = ''
  for (const { id } of sections) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= line) current = id
  }
  // 最后一个区块可能太短，永远滚不到判定线以上；滚到页面底部时直接算它
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  if (atBottom && window.scrollY > 0) current = sections[sections.length - 1].id
  active.value = current
}

let queued = false
useEventListener(
  'scroll',
  () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      update()
    })
  },
  { passive: true },
)

onMounted(update)
</script>

<template>
  <nav class="sticky top-24 self-start text-[13px]" :aria-label="site.home">
    <a href="#top" class="text-dim transition-colors hover:text-ink">{{ site.home }}</a>
    <ul class="tree mt-1">
      <li v-for="s in sections" :key="s.id">
        <a
          :href="`#${s.id}`"
          class="tree-link"
          :class="{ 'is-active': active === s.id }"
          :aria-current="active === s.id ? 'location' : undefined"
        >
          {{ s.id }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style>
.tree-link {
  color: var(--dim);
  transition: color 0.15s;
}

.tree-link:hover {
  color: var(--ink);
}

.tree-link.is-active {
  color: var(--mint);
}

.tree-link.is-active::after {
  content: " ●";
  font-size: 0.6em;
  vertical-align: 0.2em;
}
</style>
