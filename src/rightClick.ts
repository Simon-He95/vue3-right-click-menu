import type { DefineComponent, PropType, Ref } from 'vue'
import { Teleport, Transition, computed, defineComponent, h, nextTick, ref, watch } from 'vue'
import type { Props } from './types'
import { useContextMenu } from './contextMenu'
import useViewport from './useViewport'

export const RightClick = defineComponent({
  name: 'RightClick',
  props: {
    menu: {
      type: Array as PropType<{ label: string }[]>,
      default: () => [],
    },
  },
  emits: ['select'],
  setup(props, { emit, slots }) {
    const containerRef: Ref<HTMLElement | undefined> = ref()
    const menuRef: Ref<HTMLElement | undefined> = ref()
    const { x, y, showMenu } = useContextMenu(containerRef)
    const _w = ref(0)
    const _h = ref(0)
    const { vw, vh } = useViewport()

    watch(() => showMenu.value, async (v) => {
      if (v) {
        await nextTick()
        const menuEl = menuRef.value
        if (!menuEl)
          return
        _w.value = menuEl.clientWidth
        _h.value = menuEl.clientHeight
      }
    })
    const handleClick = (item: Record<string, string>) => {
      showMenu.value = false
      emit('select', item)
    }

    const styleComputed = computed(() => {
      let posX = x.value
      let posY = y.value
      if (x.value > vw.value - _w.value)
        posX -= _w.value
      if (y.value > vh.value - _h.value)
        posY -= y.value - vh.value + _h.value
      return {
        left: `${posX}px`,
        top: `${posY}px`,
      }
    })

    return () => h('div', {
      'ref': containerRef,
      'data-v-right-click': '',
      'class': 'container',
    },
    [
      h('slot', slots.default?.()),
      h(Teleport, {
        to: 'body',
      },
      h(Transition,
        {
          'data-v-right-click': '',
          onBeforeEnter(el) {
            (el as HTMLElement).style.height = '0'
          },
          onEnter(el) {
            (el as HTMLElement).style.height = 'auto'
            const h = (el as HTMLElement).clientHeight;
            (el as HTMLElement).style.height = '0'
            requestAnimationFrame(() => {
              (el as HTMLElement).style.transition = '.5s';
              (el as HTMLElement).style.height = `${h}px`
            })
          },
          onLeave(el) {
            (el as HTMLElement).style.transition = 'none'
          },
        },
        () => showMenu.value
          ? h('div', {
            style: styleComputed.value,
            class: 'context-menu',
          },
          h('div', {
            class: 'menu-list',
            ref: menuRef,
          }, props.menu.map(item => h('div', {
            key: item.label,
            class: 'menu-item',
            onClick: () => handleClick(item),
          }, item.label))),
          )
          : undefined,
      ),
      ),
    ],
    )
  },
}) as DefineComponent<Props>
