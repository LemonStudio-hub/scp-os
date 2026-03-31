<script setup lang="ts">
import SCPTerminal from './components/SCPTerminal.vue'
</script>

<template>
  <SCPTerminal />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Courier New', Consolas, monospace;
  background: #0a0a0a;
  color: #ffffff;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>