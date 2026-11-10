<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { aboutRows, site } from '@/data/site'

const { t } = useI18n()
const swatches = ['bg-ink', 'bg-dim', 'bg-iris', 'bg-rose', 'bg-mint', 'bg-line']
</script>

<template>
  <div class="flex flex-col gap-8 sm:flex-row sm:items-start">
    <div class="about-avatar shrink-0">
      <img
        :src="site.avatar"
        :alt="t('about.avatarAlt')"
        width="128"
        height="128"
        loading="lazy"
        class="relative size-32 rounded-2xl border border-line bg-surface object-cover"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="font-semibold">
        <span class="text-mint">{{ site.shell.split('@')[0] }}</span
        ><span class="text-dim">@</span><span class="text-iris">{{ site.shell.split('@')[1] }}</span>
      </p>
      <div class="my-2 w-28 border-t border-dashed border-line"></div>

      <dl class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-1">
        <template v-for="key in aboutRows" :key="key">
          <dt class="text-mint">{{ key }}</dt>
          <dd>{{ t(`about.rows.${key}`) }}</dd>
        </template>
      </dl>

      <div class="mt-4 flex gap-1" aria-hidden="true">
        <span v-for="c in swatches" :key="c" class="h-3 w-6 rounded-[2px]" :class="c"></span>
      </div>
    </div>
  </div>

  <p class="mt-8 max-w-[38rem] font-sans text-base leading-8">{{ t('about.bio') }}</p>
</template>

<style>
.about-avatar {
  position: relative;
  width: fit-content;
}

.about-avatar::before {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 1.1rem;
  background: linear-gradient(135deg, var(--mint), var(--iris), var(--rose));
  filter: blur(10px);
  opacity: 0.45;
}
</style>
