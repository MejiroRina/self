<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpRight, Check, Copy } from 'lucide-vue-next'
import { copyText, useToast } from '@/composables/useToast'
import { contacts } from '@/data/site'

const { t } = useI18n()
const toast = useToast()
const copied = ref('')

const copy = async (id: string, value: string) => {
  if (!(await copyText(value))) return
  toast.show(t('contact.copied', { value }))
  copied.value = id
  setTimeout(() => {
    if (copied.value === id) copied.value = ''
  }, 2000)
}

const isWeb = (href: string) => href.startsWith('http')
</script>

<template>
  <ul class="divide-y divide-line border-y border-line">
    <li v-for="c in contacts" :key="c.id" class="flex items-center gap-2">
      <a
        :href="c.href"
        :target="isWeb(c.href) ? '_blank' : undefined"
        :rel="isWeb(c.href) ? 'noopener noreferrer' : undefined"
        class="group flex min-w-0 flex-1 items-baseline gap-4 py-3 transition-colors hover:text-mint"
      >
        <span class="w-20 shrink-0 text-dim">{{ c.label }}</span>
        <span class="min-w-0 break-words">{{ c.value }}</span>
        <ArrowUpRight
          v-if="isWeb(c.href)"
          class="ml-auto size-4 shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </a>
      <button
        v-if="c.copy"
        type="button"
        class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-dim transition-colors hover:bg-surface hover:text-ink"
        :aria-label="`${t('contact.copy')} ${c.copy}`"
        @click="copy(c.id, c.copy)"
      >
        <Check v-if="copied === c.id" class="size-4 text-mint" aria-hidden="true" />
        <Copy v-else class="size-4" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>
