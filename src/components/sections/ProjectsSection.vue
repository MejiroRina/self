<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowUpRight } from 'lucide-vue-next'
import SpotlightCard from '@/components/SpotlightCard.vue'
import { projects } from '@/data/site'

const { t, te } = useI18n()
</script>

<template>
  <ul class="grid gap-4 sm:grid-cols-2">
    <li v-for="p in projects" :key="p.id" class="flex">
      <SpotlightCard :href="p.href" :dashed="p.draft" class="group w-full">
        <div class="flex items-start justify-between gap-3">
          <h3 class="font-semibold" :class="p.draft ? '' : 'text-ink'">{{ p.name }}</h3>
          <ArrowUpRight
            v-if="p.href"
            class="mt-1 size-4 shrink-0 text-dim transition-colors group-hover:text-mint"
            aria-hidden="true"
          />
          <span v-else-if="p.draft" class="chip chip-dashed shrink-0">{{ t('projects.draft') }}</span>
        </div>
        <p v-if="p.by" class="text-[13px] text-dim">by {{ p.by }}</p>

        <p class="mt-3 font-sans text-sm leading-7">{{ t(`projects.items.${p.id}.desc`) }}</p>

        <p v-if="te(`projects.items.${p.id}.role`)" class="mt-4 text-[13px]">
          <span class="text-dim">{{ t('projects.role') }}</span>
          <span class="ml-3 text-mint">{{ t(`projects.items.${p.id}.role`) }}</span>
        </p>

        <ul v-if="p.tags.length" class="mt-3 flex flex-wrap gap-2">
          <li v-for="tag in p.tags" :key="tag" class="chip">{{ tag }}</li>
        </ul>
      </SpotlightCard>
    </li>
  </ul>
</template>
