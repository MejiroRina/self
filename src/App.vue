<script setup lang="ts">
import { computed, nextTick, onMounted, ref, type Component } from 'vue'
import { useHead } from '@unhead/vue'
import { useDark, useEventListener } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import BootSequence from '@/components/BootSequence.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import HeroSection from '@/components/HeroSection.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import SkyBackground from '@/components/SkyBackground.vue'
import TermSection from '@/components/TermSection.vue'
import TreeNav from '@/components/TreeNav.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ActivitySection from '@/components/sections/ActivitySection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import HistorySection from '@/components/sections/HistorySection.vue'
import ProjectsSection from '@/components/sections/ProjectsSection.vue'
import SkillsSection from '@/components/sections/SkillsSection.vue'
import { useFx } from '@/composables/useFx'
import { copyText, useToast } from '@/composables/useToast'
import { sections, site, type SectionId } from '@/data/site'

const views: Record<SectionId, Component> = {
  about: AboutSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  activity: ActivitySection,
  history: HistorySection,
  contact: ContactSection,
}

const { t, locale } = useI18n()
const isDark = useDark()
const toast = useToast()
const fx = useFx()
const paletteOpen = ref(false)
const modKey = ref('⌘')

// ---------- 语言 ----------
const LOCALE_KEY = 'locale'

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  try {
    localStorage.setItem(LOCALE_KEY, locale.value)
  } catch {
    // 隐私模式下可能写不了，忽略即可
  }
}

// <html lang> 交给 unhead 管：预渲染时写进静态 HTML，切换语言时在浏览器里跟着变
useHead({ htmlAttrs: { lang: computed(() => (locale.value === 'zh' ? 'zh-CN' : 'en')) } })

onMounted(() => {
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) modKey.value = 'Ctrl'

  // 预渲染的 HTML 是中文；访客选过语言就用选过的，否则浏览器不是中文环境时切到英文
  let saved: string | null = null
  try {
    saved = localStorage.getItem(LOCALE_KEY)
  } catch {
    // 同上
  }
  const preferred = saved ?? (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en')
  if (preferred === 'zh' || preferred === 'en') locale.value = preferred
})

// ---------- 主题：从点击位置圆形扩散 ----------
const toggleTheme = (event?: MouseEvent) => {
  const next = !isDark.value
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !('startViewTransition' in document)) {
    isDark.value = next
    return
  }

  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  const transition = document.startViewTransition(async () => {
    isDark.value = next
    await nextTick()
  })
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {
      // 过渡被打断（比如连点两次）时不需要处理
    })
}

// ---------- 背景特效开关 ----------
const toggleFx = () => {
  toast.show(t(fx.toggle() ? 'fx.on' : 'fx.off'))
}

// ---------- 命令面板 ----------
const copyEmail = async () => {
  toast.show((await copyText(site.email)) ? t('contact.copied', { value: site.email }) : site.email)
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
    return
  }
  const target = e.target as HTMLElement | null
  const typing = target?.matches?.('input, textarea, [contenteditable="true"]')
  if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault()
    paletteOpen.value = true
  }
})
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <SkyBackground />
    <BootSequence />

    <SiteHeader :mod-key="modKey" @palette="paletteOpen = true" @locale="toggleLocale" @fx="toggleFx" @theme="toggleTheme" />

    <main class="flex-1">
      <HeroSection :mod-key="modKey" @palette="paletteOpen = true" />

      <div class="mx-auto grid w-full max-w-5xl gap-x-14 px-5 pt-8 pb-28 sm:px-8 lg:grid-cols-[10rem_minmax(0,1fr)]">
        <TreeNav class="max-lg:hidden" />

        <div class="flex max-w-[44rem] flex-col gap-24">
          <TermSection v-for="s in sections" :id="s.id" :key="s.id" :cmd="s.cmd" :title="t(`sections.${s.id}`)">
            <component :is="views[s.id]" />
          </TermSection>
        </div>
      </div>
    </main>

    <footer class="border-t border-line">
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-8 text-[13px] text-dim sm:px-8"
      >
        <p>© 2026 SeiunKinagi</p>
        <p>{{ t('footer.built') }}</p>
      </div>
    </footer>

    <CommandPalette
      v-model:open="paletteOpen"
      @theme="toggleTheme()"
      @locale="toggleLocale"
      @fx="toggleFx"
      @copy-email="copyEmail"
    />

    <div class="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" role="status">
      <Transition name="toast">
        <p v-if="toast.message.value" class="rounded-md border border-line bg-surface px-4 py-2 text-[13px] shadow-lg">
          {{ toast.message.value }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
