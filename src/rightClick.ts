import type { DefineComponent, PropType, Ref } from 'vue'
import { Teleport, Transition, computed, createVNode, defineComponent, getCurrentInstance, h, nextTick, onUnmounted, ref, watch } from 'vue'
import type { MenuAction, MenuIcon, MenuItem, Props } from './types'
import { useContextMenu } from './contextMenu'
import useViewport from './useViewport'

export const RightClick = defineComponent({
  name: 'RightClick',
  props: {
    menu: {
      type: Array as PropType<Props['menu']>,
      default: () => [],
    },
  },
  emits: {
    select: (_item: MenuAction) => true,
  },
  setup(props, { emit, slots }) {
    const containerRef: Ref<HTMLElement | undefined> = ref()
    const menuRef: Ref<HTMLElement | undefined> = ref()
    const menuRootRef: Ref<HTMLElement | undefined> = ref()
    const { x, y, showMenu } = useContextMenu(containerRef, [menuRootRef])
    const menuWidth = ref(0)
    const menuHeight = ref(0)
    const { vw, vh } = useViewport()
    const activeIndex = ref(-1)
    const uid = getCurrentInstance()?.uid ?? 0
    let resizeObserver: ResizeObserver | undefined

    const measureMenu = () => {
      const menuEl = menuRef.value
      if (!menuEl)
        return
      menuWidth.value = menuEl.clientWidth
      menuHeight.value = menuEl.clientHeight
    }

    const isDivider = (item: MenuItem): item is { type: 'divider' } => (item as any)?.type === 'divider'
    const isDisabled = (item: MenuItem) => !isDivider(item) && !!(item as MenuAction).disabled

    const selectableIndices = computed(() => {
      const indices: number[] = []
      props.menu.forEach((item, index) => {
        if (!isDivider(item) && !isDisabled(item))
          indices.push(index)
      })
      return indices
    })

    const getFirstSelectableIndex = () => selectableIndices.value[0] ?? -1

    const setActiveToClosest = (index: number) => {
      const indices = selectableIndices.value
      if (!indices.length) {
        activeIndex.value = -1
        return
      }
      if (indices.includes(index)) {
        activeIndex.value = index
        return
      }
      activeIndex.value = indices[0]
    }

    const moveActive = (delta: 1 | -1) => {
      const indices = selectableIndices.value
      if (!indices.length)
        return
      const currentPos = indices.indexOf(activeIndex.value)
      const startPos = currentPos >= 0 ? currentPos : (delta === 1 ? -1 : 0)
      const nextPos = (startPos + delta + indices.length) % indices.length
      activeIndex.value = indices[nextPos]
    }

    const renderIcon = (icon: MenuIcon | undefined) => {
      if (!icon)
        return undefined
      if (typeof icon === 'string')
        return h('span', { 'class': ['menu-icon', icon], 'aria-hidden': 'true' })
      if (typeof icon === 'object' && (icon as any).__v_isVNode)
        return icon
      return h(icon as any, { 'class': 'menu-icon', 'aria-hidden': 'true' })
    }

    const itemId = (index: number) => `vrc-${uid}-item-${index}`
    const activeDescendantId = computed(() => (activeIndex.value >= 0 ? itemId(activeIndex.value) : undefined))

    const setupResizeObserver = () => {
      const menuEl = menuRef.value
      if (!menuEl)
        return
      if (typeof ResizeObserver === 'undefined')
        return
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(() => measureMenu())
      resizeObserver.observe(menuEl)
    }

    const teardownResizeObserver = () => {
      resizeObserver?.disconnect()
      resizeObserver = undefined
    }

    watch(
      () => showMenu.value,
      async (v) => {
        if (!v) {
          teardownResizeObserver()
          return
        }
        await nextTick()
        measureMenu()
        setupResizeObserver()
        setActiveToClosest(getFirstSelectableIndex())
        menuRootRef.value?.focus?.()
      },
      { flush: 'post' },
    )

    const handleClick = (item: MenuItem) => {
      if (isDivider(item) || isDisabled(item))
        return
      showMenu.value = false
      emit('select', item as MenuAction)
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (!showMenu.value)
        return
      if (e.key === 'Escape') {
        e.preventDefault()
        showMenu.value = false
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveActive(1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveActive(-1)
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        activeIndex.value = getFirstSelectableIndex()
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        const indices = selectableIndices.value
        activeIndex.value = indices[indices.length - 1] ?? -1
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const item = props.menu[activeIndex.value]
        if (item)
          handleClick(item)
        return
      }
      if (e.key === 'Tab')
        showMenu.value = false
    }

    const styleComputed = computed(() => {
      let posX = x.value
      let posY = y.value
      if (posX + menuWidth.value > vw.value)
        posX -= menuWidth.value
      if (posY + menuHeight.value > vh.value)
        posY = vh.value - menuHeight.value
      posX = Math.max(0, posX)
      posY = Math.max(0, posY)
      return {
        left: `${posX}px`,
        top: `${posY}px`,
      }
    })

    onUnmounted(() => {
      teardownResizeObserver()
    })

    return () => h('div', {
      'ref': containerRef,
      'data-v-right-click': '',
      'class': 'container',
    },
    [
      ...(slots.default?.() ?? []),
      h(Teleport, {
        to: 'body',
      },
      h(Transition,
        {
          name: 'vrc-menu',
        },
        () => showMenu.value
          ? h('div', {
            'data-v-right-click': '',
            'style': styleComputed.value,
            'class': 'context-menu',
            'ref': menuRootRef,
            'tabindex': -1,
            'role': 'menu',
            'aria-activedescendant': activeDescendantId.value,
            'onKeydown': handleKeydown,
            'onContextmenu': (e: MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
            },
          },
          h('div', {
            class: 'menu-list',
            ref: menuRef,
          }, props.menu.map((item, index) => {
            if (isDivider(item)) {
              return createVNode('div', {
                class: 'menu-divider',
                role: 'separator',
              })
            }
            const disabled = isDisabled(item)
            const active = index === activeIndex.value
            return createVNode('div', {
              'id': itemId(index),
              'class': ['menu-item', { 'is-active': active, 'is-disabled': disabled }],
              'role': 'menuitem',
              'tabindex': -1,
              'aria-disabled': disabled ? 'true' : undefined,
              'onMouseenter': (_e: MouseEvent) => {
                if (!disabled)
                  activeIndex.value = index
              },
              'onClick': (_e: MouseEvent) => handleClick(item),
            }, [
              renderIcon(item.icon),
              h('span', { class: 'menu-label' }, item.label),
              item.shortcut ? h('span', { class: 'menu-shortcut' }, item.shortcut) : undefined,
            ])
          })),
          )
          : undefined,
      ),
      ),
    ],
    )
  },
}) as DefineComponent<Props>
