import type { Component, VNode } from 'vue'

export type MenuIcon = string | Component | VNode

export interface MenuDivider {
  type: 'divider'
}

export interface MenuAction extends Record<string, unknown> {
  label: string
  disabled?: boolean
  icon?: MenuIcon
  shortcut?: string
}

export type MenuItem = MenuAction | MenuDivider

export interface Props {
  menu: MenuItem[]
}
