<script setup lang="ts">
import type { Ref } from 'vue'
defineProps<{
  menu: { label: string }[]
}>()
const emit = defineEmits(['select'])
const containerRef: Ref<HTMLElement | undefined> = ref()
const useContextMenu = (containerRef: Ref<HTMLElement | undefined>) => {
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

  const closeMenu = () => {
    showMenu.value = false
  }
  onMounted(() => {
    const div = containerRef.value!
    div.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', closeMenu, true)
    window.addEventListener('contextmenu', closeMenu, true)
  })
  onUnmounted(() => {
    const div = containerRef.value
    if (div)
      div.removeEventListener('contextmenu', handleContextMenu)
    window.removeEventListener('click', closeMenu, true)
    window.removeEventListener('contextmenu', closeMenu, true)
  })
  return {
    x,
    y,
    showMenu,
  }
}
const { x, y, showMenu } = useContextMenu(containerRef)
const handleClick = (item: Record<string, string>) => {
  showMenu.value = false
  emit('select', item)
}
const styleComputed = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}))
const beforeEnter = (el: HTMLElement) => {
  el.style.height = '0'
}
const enter = (el: HTMLElement) => {
  el.style.height = 'auto'
  const h = el.clientHeight
  el.style.height = '0'
  requestAnimationFrame(() => {
    el.style.transition = '.5s'
    el.style.height = `${h}px`
  })
}
const leave = (el: HTMLElement) => {
  el.style.transition = 'none'
}
</script>

<template>
  <div ref="containerRef" class="container">
    <slot />
    <Teleport to="body">
      <Transition @before-enter="beforeEnter" @enter="enter" @leave="leave">
        <div v-if="showMenu" class="context-menu" :style="styleComputed">
          <div class="menu-list">
            <div v-for="item in menu" :key="item.label" class="menu-item" @click="handleClick(item)">
              {{ item.label }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.container{
  width: fit-content;
}
.context-menu {
  position: fixed;
  background: #eee;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2), 1px 1px 5px rgba(0, 0, 0, 0.2);
  min-width: 100px;
  border-radius: 5px;
  font-size: 12px;
  color: #1d1d1f;
  line-height: 1.8;
  white-space: nowrap;
  overflow: hidden;
}

.menu-list {
  padding: 5px;
}

.menu-item {
  padding: 0 5px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.menu-item:hover {
  background: #3477d9;
  color: #fff;
}
</style>
