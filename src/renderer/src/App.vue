<template>
  <router-view />
</template>

<script setup lang="ts"></script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}
</style>
