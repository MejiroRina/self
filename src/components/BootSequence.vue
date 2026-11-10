<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// 开场启动日志。时间轴完全由 CSS 驱动，所以即使 JS 还没加载、或者根本没有 JS，
// 遮罩也会自己播完并消失。index.html 里的内联脚本会在同一会话的第二次访问、
// 或用户开启“减少动态效果”时给 <html> 加上 data-boot="skip"，直接跳过。
const { t } = useI18n()
const lines = ['mount ~/seiun', 'load nebula.service', 'start session']

const done = ref(false)
const skipping = ref(false)

// "done"：开场已经结束（播完或被按键打断），之后出现的动画不用再等它
const finish = () => {
  done.value = true
  document.documentElement.dataset.boot = 'done'
}

const skip = () => {
  skipping.value = true
  document.documentElement.dataset.boot = 'done'
}

onMounted(() => {
  if (document.documentElement.dataset.boot === 'skip') {
    done.value = true
    return
  }
  window.addEventListener('keydown', skip, { once: true })
  window.addEventListener('pointerdown', skip, { once: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', skip)
  window.removeEventListener('pointerdown', skip)
})
</script>

<template>
  <div v-if="!done" class="boot" :class="{ 'boot-skip': skipping }" aria-hidden="true" @animationend.self="finish">
    <div class="boot-lines">
      <p v-for="(line, i) in lines" :key="line" :style="{ '--i': i }">
        <span class="text-mint">[ ok ]</span> {{ line }}
      </p>
      <p :style="{ '--i': lines.length }"><span class="text-mint">❯</span> ./welcome<span class="caret"></span></p>
    </div>
    <p class="boot-hint" :style="{ '--i': 1 }">{{ t('boot.skip') }}</p>
  </div>
</template>

<style>
.boot {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  padding: 0 max(1.25rem, calc(50vw - 15rem));
  background: var(--bg);
  animation: boot-out 0.45s ease 1.25s forwards;
}

.boot.boot-skip {
  animation: boot-out 0.2s ease forwards;
}

html[data-boot='skip'] .boot {
  display: none;
}

.boot p {
  opacity: 0;
  animation: boot-line 0.01s linear calc(var(--i) * 0.22s + 0.1s) forwards;
}

.boot-hint {
  font-size: 0.75rem;
  color: var(--dim);
}

@keyframes boot-line {
  to {
    opacity: 1;
  }
}

@keyframes boot-out {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
