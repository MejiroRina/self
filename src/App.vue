<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Moon, Sun, Languages, Github, Mail, MapPin, Terminal, Tv, MessageCircle } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const { t, locale } = useI18n()

const skills = ['Python', 'TypeScript', 'Vue.js', 'Go']
const learning = ['Rust']

// Typewriter effect
const displayedSlogan = ref('')
const isTyping = ref(true)

let typewriterTimeout: ReturnType<typeof setTimeout> | null = null

const typeWriter = (text: string, i = 0) => {
  if (i === 0) {
    displayedSlogan.value = ''
    isTyping.value = true
    if (typewriterTimeout) clearTimeout(typewriterTimeout)
  }
  
  if (i < text.length) {
    displayedSlogan.value += text.charAt(i)
    typewriterTimeout = setTimeout(() => typeWriter(text, i + 1), 100)
  } else {
    isTyping.value = false
  }
}

onMounted(() => {
  typeWriter(t('hero.slogan'))
})

watch(locale, () => {
  typeWriter(t('hero.slogan'))
})

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

const openLink = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300">
    <!-- Navbar -->
    <header class="fixed top-0 w-full backdrop-blur-md bg-white/50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2 font-mono font-bold text-lg">
          <Terminal class="w-5 h-5 text-green-500" />
          <span>~/SeiunKinagi</span>
        </div>
        
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="toggleLocale()" title="Toggle Language">
            <Languages class="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" @click="toggleDark()" title="Toggle Theme">
            <Sun v-if="!isDark" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full container mx-auto px-4 pt-32 pb-16 max-w-4xl flex flex-col justify-center">
      <!-- Hero Section -->
      <section class="flex flex-col md:flex-row items-center md:items-start gap-8 mb-20 animate-fade-in">
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
          <Avatar class="w-32 h-32 border-2 border-zinc-950 relative">
            <AvatarImage src="https://avatars.githubusercontent.com/u/70424266?v=4" alt="@MejiroRina" />
            <AvatarFallback>SK</AvatarFallback>
          </Avatar>
        </div>
        
        <div class="text-center md:text-left flex-1 space-y-4">
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight">{{ t('hero.name') }}</h1>
          <p class="text-xl text-zinc-500 dark:text-zinc-400 font-medium">{{ t('hero.role') }}</p>
          
          <div class="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-800">
            <span class="text-green-500">❯</span>
            <span>{{ displayedSlogan }}<span v-if="isTyping" class="animate-pulse">_</span></span>
          </div>
          
          <div class="flex items-center justify-center md:justify-start gap-2 text-zinc-500 pt-2">
            <MapPin class="w-4 h-4" />
            <span>{{ t('hero.location') }}</span>
          </div>
        </div>
      </section>

      <!-- Skills Section -->
      <section class="mb-20">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <span class="text-green-500">#</span>
          {{ t('skills.title') }}
        </h2>
        
        <div class="flex flex-wrap gap-3">
          <Badge v-for="skill in skills" :key="skill" variant="secondary" class="text-sm py-1 px-3 font-mono border-zinc-200 dark:border-zinc-800">
            {{ skill }}
          </Badge>
          
          <TooltipProvider v-for="item in learning" :key="item">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" class="cursor-help text-sm py-1 px-3 font-mono border-dashed border-zinc-400 dark:border-zinc-600">
                  {{ item }} ({{ t('skills.learning') }})
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learning...</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      <!-- Projects Section -->
      <section class="mb-20">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <span class="text-green-500">#</span>
          {{ t('projects.title') }}
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card class="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 transition-all hover:-translate-y-1 group cursor-pointer" @click="openLink('https://haruki.seiunx.com/about')">
            <CardHeader>
              <CardTitle class="flex items-center justify-between group-hover:text-green-500 transition-colors text-lg">
                Project Haruki
                <Github class="w-5 h-5" />
              </CardTitle>
              <CardDescription class="text-zinc-500">By Haruki Dev Team</CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-zinc-600 dark:text-zinc-300">
                {{ t('projects.harukiDevTeamDesc') }}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <!-- Contact Section -->
      <section class="mb-20 animate-fade-in" style="animation-delay: 0.3s; animation-fill-mode: both;">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <span class="text-green-500">#</span>
          {{ t('contact.title') }}
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- GitHub -->
          <Card class="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 transition-all hover:-translate-y-1 group cursor-pointer" @click="openLink('https://github.com/MejiroRina')">
            <CardHeader class="flex flex-row items-center gap-4 py-4">
              <div class="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl group-hover:text-green-500 transition-colors">
                <Github class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <CardTitle class="text-lg">GitHub</CardTitle>
                <CardDescription class="text-zinc-500">星雲希凪 / @MejiroRina</CardDescription>
              </div>
            </CardHeader>
          </Card>
          
          <!-- Bilibili -->
          <Card class="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 transition-all hover:-translate-y-1 group cursor-pointer" @click="openLink('https://space.bilibili.com/12654527')">
            <CardHeader class="flex flex-row items-center gap-4 py-4">
              <div class="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl group-hover:text-green-500 transition-colors">
                <Tv class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <CardTitle class="text-lg">Bilibili</CardTitle>
                <CardDescription class="text-zinc-500">云はるか / UID: 12654527</CardDescription>
              </div>
            </CardHeader>
          </Card>
          
          <!-- Discord -->
          <Card class="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 transition-all hover:-translate-y-1 group cursor-pointer" @click="openLink('https://discord.com/users/seiun_kinagi')">
            <CardHeader class="flex flex-row items-center gap-4 py-4">
              <div class="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl group-hover:text-green-500 transition-colors">
                <MessageCircle class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <CardTitle class="text-lg">Discord</CardTitle>
                <CardDescription class="text-zinc-500">星雲希凪 / @seiun_kinagi</CardDescription>
              </div>
            </CardHeader>
          </Card>
          
          <!-- Email -->
          <Card class="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-green-500/50 transition-all hover:-translate-y-1 group cursor-pointer" @click="openLink('mailto:seiun@seiun.io')">
            <CardHeader class="flex flex-row items-center gap-4 py-4">
              <div class="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl group-hover:text-green-500 transition-colors">
                <Mail class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <CardTitle class="text-lg">Email</CardTitle>
                <CardDescription class="text-zinc-500">seiun@seiun.io</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>

    <!-- Footer / Socials -->
    <footer class="border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm mt-auto py-8">
      <div class="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
        <div class="flex items-center gap-4">
          <Button variant="outline" size="icon" class="rounded-full" asChild>
            <a href="https://github.com/MejiroRina" target="_blank" rel="noopener noreferrer">
              <Github class="w-5 h-5" />
            </a>
          </Button>
          <Button variant="outline" size="icon" class="rounded-full" asChild>
            <a href="https://space.bilibili.com/12654527" target="_blank" rel="noopener noreferrer" title="Bilibili">
              <Tv class="w-5 h-5" />
            </a>
          </Button>
          <Button variant="outline" size="icon" class="rounded-full" asChild>
            <a href="https://discord.com/users/seiun_kinagi" target="_blank" rel="noopener noreferrer" title="Discord">
              <MessageCircle class="w-5 h-5" />
            </a>
          </Button>
          <Button variant="outline" size="icon" class="rounded-full" asChild>
            <a href="mailto:seiun@seiun.io">
              <Mail class="w-5 h-5" />
            </a>
          </Button>
        </div>
        <p class="text-sm text-zinc-500 font-mono">
          © 2026 SeiunKinagi. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}
</style>
