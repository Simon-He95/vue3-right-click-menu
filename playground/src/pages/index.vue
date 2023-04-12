<script setup lang="ts">
import { RightClick } from '../../../src'
const menu = [
  { label: '新增', name: 'simon' },
  { label: '编辑', name: 'simon' },
  { label: '删除', name: 'simon' },
]
const handleSelect = (item: any) => {
  // eslint-disable-next-line no-console
  console.log(item)
}
</script>

<template>
  <RightClick
    :menu="menu"
    @select="handleSelect"
  >
    <div w-50 h-50 bg-red />
  </RightClick>
</template>
