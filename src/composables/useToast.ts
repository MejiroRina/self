import { ref } from 'vue'

// 全站共用的一条轻提示（只在浏览器端被修改，SSG 时始终为空）
const message = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  const show = (text: string) => {
    message.value = text
    clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
    }, 2200)
  }

  return { message, show }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
