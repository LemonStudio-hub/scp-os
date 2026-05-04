<template>
  <Modal
    :visible="visible"
    :title="title"
    width="400px"
    @close="$emit('cancel')"
    @update:visible="(v: boolean) => !v && $emit('cancel')"
  >
    <div class="confirm-dialog">
      <div class="confirm-dialog__icon" :class="`confirm-dialog__icon--${type}`">
        <svg v-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64538 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64155 19.6871 1.81442 19.9905C1.98729 20.2939 2.23668 20.5467 2.53762 20.7239C2.83856 20.9011 3.18075 20.9962 3.53 21H20.47C20.8192 20.9962 21.1614 20.9011 21.4624 20.7239C21.7633 20.5467 22.0127 20.2939 22.1856 19.9905C22.3584 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89722 12 2.89722C11.6563 2.89722 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16H12.01M12 8V12M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <p class="confirm-dialog__message">{{ message }}</p>
    </div>
    <template #footer>
      <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="onCancel">
        {{ cancelText }}
      </button>
      <button
        class="confirm-dialog__btn"
        :class="`confirm-dialog__btn--${type}`"
        @click="onConfirm"
      >
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  type: 'danger',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.confirm-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.confirm-dialog__icon--danger {
  background: rgba(255, 59, 48, 0.12);
  color: #ff3b30;
}

.confirm-dialog__icon--warning {
  background: rgba(255, 204, 0, 0.12);
  color: #ffcc00;
}

.confirm-dialog__icon--info {
  background: rgba(10, 132, 255, 0.12);
  color: #0a84ff;
}

.confirm-dialog__message {
  margin: 0;
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.5;
}

.confirm-dialog__btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.confirm-dialog__btn:active {
  transform: scale(0.96);
}

.confirm-dialog__btn--cancel {
  background: #242424;
  color: #a0a0a0;
  border: 1px solid #2a2a2a;
}

.confirm-dialog__btn--cancel:hover {
  background: #303030;
  color: #e0e0e0;
}

.confirm-dialog__btn--danger {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.confirm-dialog__btn--danger:hover {
  background: rgba(255, 59, 48, 0.25);
}

.confirm-dialog__btn--warning {
  background: rgba(255, 204, 0, 0.15);
  color: #ffcc00;
}

.confirm-dialog__btn--warning:hover {
  background: rgba(255, 204, 0, 0.25);
}

.confirm-dialog__btn--info {
  background: rgba(10, 132, 255, 0.15);
  color: #0a84ff;
}

.confirm-dialog__btn--info:hover {
  background: rgba(10, 132, 255, 0.25);
}
</style>
