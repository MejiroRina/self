<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CornerDownLeft } from 'lucide-vue-next'
import { useFx } from '@/composables/useFx'
import { contacts, sections, site } from '@/data/site'

// 命令面板（⌘K / Ctrl K / 斜杠键）。在手机上它同时充当导航菜单。
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ theme: []; locale: []; fx: []; copyEmail: [] }>()

interface Item {
  key: string
  group: string
  label: string
  hint: string
  run: () => void
}

const { t } = useI18n()
const { fxOn } = useFx()
const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const list = ref<HTMLElement>()
const query = ref('')
const index = ref(0)

const go = (id: string) => {
  if (id === 'top') window.scrollTo({ top: 0 })
  else document.getElementById(id)?.scrollIntoView({ block: 'start' })
}

const visit = (href: string) => {
  if (href.startsWith('http')) window.open(href, '_blank', 'noopener,noreferrer')
  else window.location.href = href
}

const items = computed<Item[]>(() => [
  ...sections.map((s) => ({
    key: s.id,
    group: t('palette.go'),
    label: t(`sections.${s.id}`),
    hint: s.cmd,
    run: () => go(s.id),
  })),
  { key: 'top', group: t('palette.go'), label: t('palette.top'), hint: 'cd ~', run: () => go('top') },
  { key: 'theme', group: t('palette.actions'), label: t('palette.theme'), hint: 'theme', run: () => emit('theme') },
  {
    key: 'fx',
    group: t('palette.actions'),
    label: t(fxOn.value ? 'fx.turnOff' : 'fx.turnOn'),
    hint: 'fx',
    run: () => emit('fx'),
  },
  { key: 'lang', group: t('palette.actions'), label: t('palette.language'), hint: 'lang', run: () => emit('locale') },
  {
    key: 'copy',
    group: t('palette.actions'),
    label: t('palette.copyEmail'),
    hint: site.email,
    run: () => emit('copyEmail'),
  },
  ...contacts.map((c) => ({
    key: `link-${c.id}`,
    group: t('palette.links'),
    label: c.label,
    hint: c.value,
    run: () => visit(c.href),
  })),
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((item) => `${item.label} ${item.hint} ${item.key}`.toLowerCase().includes(q))
})

watch(open, async (isOpen) => {
  const el = dialog.value
  if (!el) return
  if (isOpen) {
    query.value = ''
    index.value = 0
    if (!el.open) el.showModal()
    await nextTick()
    input.value?.focus()
  } else if (el.open) {
    el.close()
  }
})

watch(query, () => {
  index.value = 0
})

const move = async (step: number) => {
  const total = filtered.value.length
  if (!total) return
  index.value = (index.value + step + total) % total
  await nextTick()
  list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}

const exec = async (item: Item | undefined) => {
  if (!item) return
  open.value = false
  // 先让对话框关掉，再执行（切换主题的扩散动画需要拍到关闭后的画面）
  await nextTick()
  item.run()
}

const onBackdrop = (e: MouseEvent) => {
  if (e.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="palette" :aria-label="t('header.palette')" @close="open = false" @click="onBackdrop">
    <div class="flex items-center gap-3 border-b border-line px-4">
      <span class="text-mint" aria-hidden="true">❯</span>
      <input
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-list"
        :aria-activedescendant="filtered[index] ? `palette-${filtered[index].key}` : undefined"
        :aria-label="t('palette.placeholder')"
        :placeholder="t('palette.placeholder')"
        autocomplete="off"
        spellcheck="false"
        class="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-dim"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="exec(filtered[index])"
      />
      <span class="kbd max-sm:hidden">esc</span>
    </div>

    <div id="palette-list" ref="list" role="listbox" class="max-h-[min(24rem,55vh)] overflow-y-auto p-2">
      <p v-if="!filtered.length" class="px-2 py-6 text-center text-dim">{{ t('palette.empty') }}</p>

      <template v-for="(item, i) in filtered" :key="item.key">
        <p
          v-if="i === 0 || filtered[i - 1].group !== item.group"
          class="px-2 pt-3 pb-1 text-xs text-dim first:pt-1"
          role="presentation"
        >
          {{ item.group }}
        </p>
        <div
          :id="`palette-${item.key}`"
          role="option"
          :aria-selected="i === index"
          class="palette-item"
          @click="exec(item)"
          @pointermove="index = i"
        >
          <span class="min-w-0 truncate">{{ item.label }}</span>
          <span class="ml-auto min-w-0 truncate text-[13px] text-dim">{{ item.hint }}</span>
          <CornerDownLeft class="palette-enter size-3.5 shrink-0" aria-hidden="true" />
        </div>
      </template>
    </div>
  </dialog>
</template>

<style>
.palette {
  width: min(36rem, calc(100vw - 2rem));
  max-width: none;
  margin: 14vh auto auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--bg);
  color: var(--ink);
  box-shadow: 0 1.5rem 4rem -1rem color-mix(in oklab, var(--iris) 35%, transparent);
}

.palette::backdrop {
  background: color-mix(in oklab, var(--bg) 72%, transparent);
  backdrop-filter: blur(6px);
}

.palette-item {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}

.palette-item[aria-selected='true'] {
  background: var(--surface);
}

.palette-enter {
  align-self: center;
  color: var(--mint);
  opacity: 0;
}

.palette-item[aria-selected='true'] .palette-enter {
  opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .palette[open] {
    animation: palette-in 0.16s ease-out;
  }
}

@keyframes palette-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.985);
  }
}
</style>
