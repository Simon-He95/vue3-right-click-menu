import { onMounted, onUnmounted, ref } from 'vue'

export default function useViewport() {
  const vw = ref(0)
  const vh = ref(0)

  const update = () => {
    if (typeof window === 'undefined')
      return
    vw.value = document.documentElement.clientWidth
    vh.value = document.documentElement.clientHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
  })
  onUnmounted(() => {
    if (typeof window === 'undefined')
      return
    window.removeEventListener('resize', update)
  })

  return { vw, vh }
}
