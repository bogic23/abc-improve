<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 900 },
  decimals: { type: Number, default: 0 },
})

const display = ref(0)
let frame = 0

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animate(target) {
  cancelAnimationFrame(frame)

  if (prefersReducedMotion) {
    display.value = target
    return
  }

  const from = display.value
  const start = performance.now()

  const step = (now) => {
    const progress = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = from + (target - from) * eased

    if (progress < 1) {
      frame = requestAnimationFrame(step)
    } else {
      display.value = target
    }
  }

  frame = requestAnimationFrame(step)
}

onMounted(() => animate(props.value))
watch(() => props.value, animate)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span>{{ Number(display).toFixed(decimals) }}</span>
</template>
