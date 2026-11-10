<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { site } from '@/data/site'

// 最近动态：页面加载后从 GitHub 公开 API 读取最近的公开事件。
// 未登录的请求每个访客 IP 每小时限 60 次，对个人主页足够；连不上时显示提示和主页链接。

interface GithubEvent {
  id: string
  type: string
  created_at: string
  repo: { name: string }
  payload?: { action?: string; ref_type?: string; pull_request?: { merged?: boolean } }
}

interface Row {
  key: string
  verb: string
  repo: string
  at: string
  count: number
}

const MAX_ROWS = 7

const { t, locale } = useI18n()
const state = ref<'loading' | 'ready' | 'error'>('loading')
const rows = ref<Row[]>([])
const profile = `https://github.com/${site.github}`
const controller = typeof AbortController === 'undefined' ? undefined : new AbortController()

const verbOf = (e: GithubEvent): string | null => {
  const p = e.payload ?? {}
  switch (e.type) {
    case 'PushEvent':
      return 'push'
    case 'PullRequestEvent':
      if (p.action === 'opened') return 'prOpened'
      if (p.action === 'merged' || (p.action === 'closed' && p.pull_request?.merged)) return 'prMerged'
      if (p.action === 'closed') return 'prClosed'
      return null
    case 'IssuesEvent':
      if (p.action === 'opened') return 'issueOpened'
      if (p.action === 'closed') return 'issueClosed'
      return null
    case 'IssueCommentEvent':
    case 'PullRequestReviewCommentEvent':
      return p.action === 'created' ? 'comment' : null
    case 'PullRequestReviewEvent':
      return 'review'
    case 'CreateEvent':
      if (p.ref_type === 'repository') return 'createRepo'
      if (p.ref_type === 'branch') return 'createRef'
      return null
    case 'ReleaseEvent':
      return p.action === 'published' ? 'release' : null
    case 'WatchEvent':
      return 'star'
    case 'ForkEvent':
      return 'fork'
    default:
      return null
  }
}

const toRows = (events: GithubEvent[]) => {
  const out: Row[] = []
  // 接口返回的顺序并不总是严格按时间排的，这里自己排一次（最新的在前）
  const sorted = [...events].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  for (const e of sorted) {
    const verb = verbOf(e)
    if (!verb || !e.repo?.name) continue
    const prev = out[out.length - 1]
    // 对同一个仓库连续做同一件事（比如连推好几次）合并成一行
    if (prev && prev.verb === verb && prev.repo === e.repo.name) {
      prev.count++
      continue
    }
    if (out.length === MAX_ROWS) break
    out.push({ key: e.id, verb, repo: e.repo.name, at: e.created_at, count: 1 })
  }
  return out
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const ago = (iso: string) => {
  const seconds = (Date.parse(iso) - Date.now()) / 1000
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'minute')
}

onMounted(async () => {
  const timeout = setTimeout(() => controller?.abort(), 8000)
  try {
    const res = await fetch(`https://api.github.com/users/${site.github}/events/public?per_page=60`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller?.signal,
    })
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
    rows.value = toRows((await res.json()) as GithubEvent[])
    state.value = 'ready'
  } catch {
    state.value = 'error'
  } finally {
    clearTimeout(timeout)
  }
})

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div aria-live="polite">
    <p v-if="state === 'loading'" class="text-dim">{{ t('activity.loading') }}</p>
    <p v-else-if="state === 'error'" class="text-rose">{{ t('activity.error') }}</p>
    <p v-else-if="!rows.length" class="text-dim">{{ t('activity.empty') }}</p>

    <ul v-else class="flex flex-col gap-1.5">
      <li v-for="row in rows" :key="row.key" class="flex flex-wrap items-baseline gap-x-4">
        <time :datetime="row.at" class="w-20 shrink-0 text-[13px] text-dim">{{ ago(row.at) }}</time>
        <span class="min-w-0">
          {{ t(`activity.verbs.${row.verb}`) }}
          <a
            :href="`https://github.com/${row.repo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="break-all text-iris underline decoration-line underline-offset-4 transition-colors hover:decoration-iris"
            >{{ row.repo }}</a
          >
          <span v-if="row.count > 1" class="ml-2 text-[13px] text-dim">×{{ row.count }}</span>
        </span>
      </li>
    </ul>
  </div>

  <p class="mt-5 text-[13px]">
    <a
      :href="profile"
      target="_blank"
      rel="noopener noreferrer"
      class="text-dim underline decoration-line underline-offset-4 transition-colors hover:text-ink"
      >{{ t('activity.profile') }}</a
    >
  </p>
</template>
