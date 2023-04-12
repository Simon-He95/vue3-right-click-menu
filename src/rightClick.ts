import type { DefineComponent, PropType } from 'vue'
import { type Ref, Teleport, Transition, computed, defineComponent, h, ref } from 'vue'
import { useContextMenu } from './contextMenu'
import type { Props } from './types'

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
    const { x, y, showMenu } = useContextMenu(containerRef)
    const handleClick = (item: Record<string, string>) => {
      showMenu.value = false
      emit('select', item)
    }
    const styleComputed = computed(() => ({
      left: `${x.value}px`,
      top: `${y.value}px`,
    }))

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
