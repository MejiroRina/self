<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin } from 'lucide-vue-next'
import { useTypewriter } from '@/composables/useTypewriter'
import { site } from '@/data/site'

defineProps<{ modKey: string }>()
defineEmits<{ palette: [] }>()

const { t, tm, rt } = useI18n()

const glyphs = [...site.name]
const slogans = computed(() => (tm('hero.slogans') as string[]).map((line) => rt(line)))
// 占位用最长的一句，轮播时布局才不会跳
const longest = computed(() => slogans.value.reduce((a, b) => (b.length > a.length ? b : a), ''))
const { typed } = useTypewriter(slogans)
</script>

<template>
  <section id="top" class="flex min-h-svh items-end">
    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 pt-28 pb-16 sm:px-8 md:flex-row-reverse md:items-end md:justify-between md:pb-24"
    >
      <h1 class="hero-name" :aria-label="`${site.name} (${site.romaji})`">
        <span v-for="(glyph, i) in glyphs" :key="i" :style="{ '--i': i }" aria-hidden="true">{{ glyph }}</span>
      </h1>

      <div class="hero-copy max-w-xl">
        <p class="text-xl font-semibold tracking-wide sm:text-2xl">{{ site.romaji }}</p>
        <p class="mt-2 text-dim">{{ t('hero.role') }}</p>
        <p class="mt-1 flex items-center gap-1.5 text-dim">
          <MapPin class="size-4" aria-hidden="true" />
          {{ t('hero.location') }}
        </p>

        <p class="mt-8 flex gap-3 text-base sm:text-lg">
          <span class="text-mint" aria-hidden="true">❯</span>
          <span class="relative">
            <span class="typed-full">{{ longest }}<span class="caret"></span></span>
            <span class="typed-live absolute inset-0" aria-hidden="true">{{ typed }}<span class="caret"></span></span>
          </span>
        </p>

        <button
          type="button"
          class="mt-8 inline-flex items-center gap-2 text-[13px] text-dim transition-colors hover:text-ink"
          @click="$emit('palette')"
        >
          <span class="kbd max-md:hidden">{{ modKey }} K</span>
          <span class="underline decoration-line underline-offset-4">{{ t('hero.hint') }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style>
.hero-name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(3.25rem, 17vw, 5.5rem);
  line-height: 1.1;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.dark .hero-name {
  text-shadow: 0 0 2.5rem color-mix(in oklab, var(--iris) 55%, transparent);
}

.hero-name > span {
  display: inline-block;
}

/* 小字压在星云上时，垫一层和背景同色的柔影，保证读得清 */
.hero-copy {
  text-shadow: 0 0 0.9rem color-mix(in oklab, var(--bg) 85%, transparent);
}

/* 桌面端名字竖排在右侧，像一幅挂轴 */
@media (min-width: 48rem) {
  .hero-name {
    writing-mode: vertical-rl;
    font-size: clamp(4.5rem, min(11vw, 17svh), 9rem);
    letter-spacing: 0.04em;
  }
}

/* 开场的一连串动作：启动日志淡出 → 星空亮起（SkyBackground）→ 名字逐字显现 → 其余文字跟上 */
@media (prefers-reduced-motion: no-preference) {
  .hero-name > span {
    animation: hero-glyph 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--boot-delay) + var(--i) * 0.14s) both;
  }

  .hero-copy {
    animation: hero-copy 0.8s ease-out calc(var(--boot-delay) + 0.7s) both;
  }
}

@keyframes hero-glyph {
  from {
    opacity: 0;
    filter: blur(14px);
    transform: scale(1.12);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

@keyframes hero-copy {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
