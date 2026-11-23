<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 900 },
})

const display = ref(0)
let frame = null

function animate(to) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    display.value = to
    return
  }
  const from = display.value
  const start = performance.now()
  cancelAnimationFrame(frame)

  function tick(now) {
    const progress = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = Math.round(from + (to - from) * eased)
    if (progress < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => animate(props.value))
watch(
  () => props.value,
  (next) => animate(next),
)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span>{{ display }}</span>
</template>
