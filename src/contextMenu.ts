import { type Ref, onMounted, onUnmounted, ref } from 'vue'

export function useContextMenu(
  containerRef: Ref<HTMLElement | undefined>,
  ignoreRefs: Ref<HTMLElement | undefined>[] = [],
) {
  const showMenu = ref(false)
  const x = ref(0)
  const y = ref(0)

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    showMenu.value = true
    x.value = e.clientX
    y.value = e.clientY
  }

  const isIgnoredTarget = (target: EventTarget | null) => {
    if (!target)
      return false
    if (!(target instanceof Node))
      return false
    return ignoreRefs.some(ref => ref.value?.contains(target))
  }

  const closeMenu = (e?: Event) => {
    if (e && isIgnoredTarget(e.target))
      return
    showMenu.value = false
  }
  onMounted(() => {
    const div = containerRef.value
    if (div)
      div.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', closeMenu, true)
    window.addEventListener('contextmenu', closeMenu, true)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu, { passive: true })
  })
  onUnmounted(() => {
    const div = containerRef.value
    if (div)
      div.removeEventListener('contextmenu', handleContextMenu)
    window.removeEventListener('click', closeMenu, true)
    window.removeEventListener('contextmenu', closeMenu, true)
    window.removeEventListener('scroll', closeMenu, true)
    window.removeEventListener('resize', closeMenu)
  })
  return {
    x,
    y,
    showMenu,
  }
}
