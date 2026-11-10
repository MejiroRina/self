// 页面上所有“内容”都集中在这里和 src/locales/ 里。
// 这里放不需要翻译的数据（链接、标签、年份）；需要翻译的文字按 id 写在 locales/zh.ts 和 en.ts。
// 标了 draft: true 的条目是占位，页面上会以虚线样式显示，填好真实内容后删掉 draft 即可。

export const site = {
  name: '星雲希凪',
  romaji: 'Seiun Kinagi',
  shell: 'seiun@nebula',
  home: '~/seiun',
  avatar: 'https://avatars.githubusercontent.com/u/70424266?v=4',
  github: 'MejiroRina',
  email: 'seiun@seiun.io',
}

/** 页面区块，顺序即显示顺序。cmd 是区块标题里“敲”出来的命令。 */
export const sections = [
  { id: 'about', cmd: 'fastfetch' },
  { id: 'skills', cmd: 'tree skills/' },
  { id: 'projects', cmd: 'ls projects/' },
  { id: 'activity', cmd: 'git log --oneline' },
  { id: 'history', cmd: 'history' },
  { id: 'contact', cmd: 'cat contact.txt' },
] as const

export type SectionId = (typeof sections)[number]['id']

/** “关于我”里的键值行，值在 locales 的 about.rows 里。 */
export const aboutRows = ['name', 'role', 'based', 'org', 'team'] as const

export interface SkillGroup {
  id: string
  items: string[]
  /** 正在了解的技术：虚线样式 */
  learning?: boolean
}

export const skillGroups: SkillGroup[] = [
  { id: 'languages', items: ['Python', 'TypeScript', 'Go'] },
  { id: 'frontend', items: ['Vue.js'] },
  { id: 'learning', items: ['Rust'], learning: true },
]

export interface Project {
  /** 对应 locales 里 projects.items.<id> 的 desc 和 role（role 可以不写） */
  id: string
  name: string
  by?: string
  href?: string
  tags: string[]
  draft?: boolean
}

export const projects: Project[] = [
  {
    id: 'haruki',
    name: 'Project Haruki',
    by: 'Haruki Dev Team',
    href: 'https://haruki.seiunx.com/about',
    tags: [], // TODO: 填上这个项目用到的技术，例如 ['Go', 'Vue.js']
  },
  {
    id: 'seiunx',
    name: 'Seiunx Dev',
    by: 'Seiunx Dev Team',
    href: 'https://github.com/seiunx-dev',
    tags: [],
  },
]

export interface HistoryEntry {
  /** 对应 locales 里 history.items.<id> 的 title 和 note（note 可以不写） */
  id: string
  date: string
  draft?: boolean
}

export const history: HistoryEntry[] = [
  { id: 'kinagiToolbox', date: '2023/10' },
  { id: 'harukiBot', date: '2024/11' },
  { id: 'harukiToolbox', date: '2025' },
  { id: 'harukiTeam', date: '2026' },
  { id: 'harukiBotNeo', date: '2026' },
  { id: 'harukiInfra', date: '2026' },
]

export interface Contact {
  id: string
  label: string
  value: string
  href: string
  /** 有这个字段时，行尾会多一个复制按钮 */
  copy?: string
}

export const contacts: Contact[] = [
  { id: 'github', label: 'GitHub', value: '星雲希凪 / @MejiroRina', href: 'https://github.com/MejiroRina' },
  { id: 'bilibili', label: 'Bilibili', value: '星雲希凪 / UID 12654527', href: 'https://space.bilibili.com/12654527' },
  { id: 'discord', label: 'Discord', value: '星雲希凪 / @seiun_kinagi', href: 'https://discord.com/users/seiun_kinagi' },
  { id: 'email', label: 'Email', value: site.email, href: `mailto:${site.email}`, copy: site.email },
]
