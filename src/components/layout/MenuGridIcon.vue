<template>
  <span class="menu-grid-icon" aria-hidden="true">
    <i /><i /><i /><i />
  </span>
</template>

<style scoped>
.menu-grid-icon {
  display: inline-grid;
  grid-template-columns: repeat(2, 4px);
  gap: 2px;
  width: 10px;
  height: 10px;
  margin-right: 10px;
  vertical-align: middle;
  flex-shrink: 0;
}

.menu-grid-icon i {
  display: block;
  width: 4px;
  height: 4px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 1px;
}
</style>
