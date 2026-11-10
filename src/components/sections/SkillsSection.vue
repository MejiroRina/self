<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { skillGroups } from '@/data/site'

const { t } = useI18n()
</script>

<template>
  <p class="text-dim">skills/</p>
  <ul class="tree">
    <li v-for="group in skillGroups" :key="group.id">
      <div class="flex flex-col gap-x-4 gap-y-1.5 sm:flex-row sm:items-baseline">
        <span class="w-28 shrink-0" :class="group.learning ? 'text-dim' : 'text-iris'">{{ group.id }}/</span>
        <ul class="flex flex-wrap items-baseline gap-2">
          <li v-for="item in group.items" :key="item" class="chip" :class="{ 'chip-dashed': group.learning }">
            {{ item }}
          </li>
          <li v-if="group.learning" class="ml-2 text-[13px] text-dim"># {{ t('skills.learning') }}</li>
        </ul>
      </div>
    </li>
  </ul>
</template>
