<script setup lang="ts">
// 卡片。带链接时是可点击的 <a>，鼠标移上去会有一束跟随指针的光；占位（dashed）卡片不可点、无光效。
defineProps<{ href?: string; dashed?: boolean }>()

const onMove = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    class="spot"
    :class="{ 'spot-dashed': dashed }"
    @pointermove="onMove"
  >
    <slot />
  </component>
</template>

<style>
.spot {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in oklab, var(--surface) 55%, transparent);
  transition: border-color 0.2s;
}

.spot-dashed {
  border-style: dashed;
  background: transparent;
  color: var(--dim);
}

.spot::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    18rem circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklab, var(--iris) 24%, transparent),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}

.spot > * {
  position: relative;
}

a.spot:hover,
a.spot:focus-visible {
  border-color: color-mix(in oklab, var(--iris) 65%, var(--line));
}

a.spot:hover::before {
  opacity: 1;
}
</style>
