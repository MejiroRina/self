import { onMounted, ref } from 'vue'

// “背景特效”开关，全站共用一份状态。
// 关闭后记在 localStorage 里；index.html 的内联脚本会在首帧之前读它并给 <html> 加上
// data-fx="off"，所以关掉特效的访客刷新后不会先闪一下星空。
const KEY = 'fx'
const fxOn = ref(true)

export function useFx() {
  onMounted(() => {
    fxOn.value = document.documentElement.dataset.fx !== 'off'
  })

  const toggle = () => {
    fxOn.value = !fxOn.value
    document.documentElement.dataset.fx = fxOn.value ? 'on' : 'off'
    try {
      localStorage.setItem(KEY, fxOn.value ? 'on' : 'off')
    } catch {
      // 隐私模式下可能写不了，本次会话内仍然生效
    }
    return fxOn.value
  }

  return { fxOn, toggle }
}
