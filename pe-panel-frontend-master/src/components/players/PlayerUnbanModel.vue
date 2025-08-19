<template>
  <div>
    <CModalHeader>
      <CModalTitle>Are you sure?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div>Are you sure to unban this player?</div>
      <CForm class="mt-4">
        <CFormTextarea
          v-model="unbanReason"
          id="exampleFormControlTextarea1"
          label="Unban Reason"
          rows="3"
          text="Please type a unban reason."
        ></CFormTextarea> </CForm
    ></CModalBody>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const unbanReason = computed({
  get() {
    return store.state.playerUnban.unbanReason
  },
  set(value) {
    store.commit('setPlayerUnbanReason', value)
  },
})
</script>

<style lang="scss" scoped></style>
