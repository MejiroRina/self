<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { history } from '@/data/site'

const { t, te } = useI18n()
</script>

<template>
  <!-- 行号是有意义的：经历本身是一个先后顺序，和 shell 的 history 输出一样 -->
  <ol class="flex flex-col gap-1.5">
    <li
      v-for="(entry, i) in history"
      :key="entry.id"
      class="flex items-baseline gap-x-4"
      :class="{ 'text-dim': entry.draft }"
    >
      <span class="w-5 shrink-0 text-right text-[13px] text-dim" aria-hidden="true">{{ i + 1 }}</span>
      <span class="w-[4.25rem] shrink-0" :class="entry.draft ? '' : 'text-mint'">{{ entry.date }}</span>
      <span class="min-w-0">
        <span class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {{ t(`history.items.${entry.id}.title`) }}
          <span v-if="entry.draft" class="chip chip-dashed">{{ t('history.draft') }}</span>
        </span>
        <span v-if="te(`history.items.${entry.id}.note`)" class="mt-1 block font-sans text-sm leading-7 text-dim">
          {{ t(`history.items.${entry.id}.note`) }}
        </span>
      </span>
    </li>
  </ol>
</template>
