<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowScroll } from '@vueuse/core'
import { Moon, Search, Sparkles, Sun } from 'lucide-vue-next'
import { useFx } from '@/composables/useFx'
import { site } from '@/data/site'

defineProps<{ modKey: string }>()
defineEmits<{ palette: []; locale: []; fx: []; theme: [event: MouseEvent] }>()

const { t, locale } = useI18n()
const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 24)
const { fxOn } = useFx()
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300"
    :class="scrolled ? 'border-line bg-bg/75 backdrop-blur-md' : 'border-transparent'"
  >
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
      <a href="#top" class="font-semibold" :aria-label="t('header.home')">
        <span class="text-mint" aria-hidden="true">❯</span> {{ site.home }}
      </a>

      <div class="flex items-center gap-1">
        <button type="button" class="header-btn" :aria-label="t('header.palette')" @click="$emit('palette')">
          <Search class="size-4 md:hidden" aria-hidden="true" />
          <span class="kbd max-md:hidden">{{ modKey }} K</span>
        </button>

        <!-- 关闭时的样式由 html[data-fx="off"] 决定，这样首帧就是对的 -->
        <button
          type="button"
          class="header-btn fx-btn"
          :aria-label="t('header.fx')"
          :aria-pressed="fxOn"
          :title="t(fxOn ? 'fx.turnOff' : 'fx.turnOn')"
          @click="$emit('fx')"
        >
          <Sparkles class="size-4" aria-hidden="true" />
        </button>

        <button type="button" class="header-btn" :aria-label="t('header.language')" @click="$emit('locale')">
          <span class="text-[13px] font-semibold" aria-hidden="true">{{ locale === 'zh' ? 'EN' : '中' }}</span>
        </button>

        <!-- 两个图标都渲染，由 .dark 类决定显示哪个：这样预渲染的 HTML 和客户端状态不会打架 -->
        <button type="button" class="header-btn" :aria-label="t('header.theme')" @click="$emit('theme', $event)">
          <Sun class="size-4 dark:hidden" aria-hidden="true" />
          <Moon class="hidden size-4 dark:block" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>

<style>
.header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.5rem;
  border-radius: 6px;
  color: var(--dim);
  transition:
    color 0.15s,
    background-color 0.15s;
}

.fx-btn {
  position: relative;
}

html:not([data-fx='off']) .fx-btn {
  color: var(--mint);
}

/* 关闭状态：图标变淡，加一道斜线 */
html[data-fx='off'] .fx-btn::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.35rem;
  border-top: 1.5px solid currentColor;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.header-btn:hover {
  color: var(--ink);
  background: color-mix(in oklab, var(--surface) 80%, transparent);
}
</style>
