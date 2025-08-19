<template>
  <div>
    <CModalHeader>
      <CModalTitle>New Role Add</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="w-1/3 mb-4">
        <CFormInput
          v-model="selectedRoleName"
          label="Role Name"
          text="Please type the role name."
        />
      </div>
      <EasyDataTable
        v-model:items-selected="selectedRoleActions"
        :headers="headers"
        :items="roleActions"
        :hide-rows-per-page="true"
        :hide-footer="true"
      ></EasyDataTable>
    </CModalBody>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import store from '@/store'

const headers = [
  { text: 'Action Name', value: 'title' },
  { text: 'Action Description', value: 'desc' },
]

const selectedRoleActions = computed({
  get() {
    return store.state.selectedRoleActions
  },
  set(value) {
    store.commit('setSelectedRoleActions', value)
  },
})

const selectedRoleName = computed({
  get() {
    return store.state.selectedRoleName
  },
  set(value) {
    store.commit('setSelectedRoleName', value)
  },
})

const roleActions = computed({
  get() {
    return store.state.roleActions
  },
  set(value) {
    store.commit('setRoleActions', value)
  },
})
</script>

<style lang="scss" scoped></style>
