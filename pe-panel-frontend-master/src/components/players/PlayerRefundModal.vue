<template>
  <CModalHeader>
    <CModalTitle>Money Actions</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <div>
      <div>
        <div>Player Name: {{}}</div>
      </div>
      <CFormInput
        type="number"
        label="Amount"
        v-model="fundAmount"
        placeholder="Exp. 20000 or 40000"
        text="Please type the money amount. Dont use negative values."
        aria-describedby="exampleFormControlInputHelpInline"
      />
      <div class="mt-2">
        <CFormCheck
          id="flexCheckDefault"
          v-model="deductMoney"
          label="Deduct money"
        />
        <CFormCheck
          id="flexCheckDefault2"
          v-model="fromBank"
          label="From bank"
        />
      </div>
      <CFormTextarea
        v-model="fundingReason"
        id="exampleFormControlTextarea1"
        label="Reason"
        rows="3"
        text="Please type reason."
      ></CFormTextarea>
    </div>
  </CModalBody>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const fundingReason = computed({
  get() {
    return store.state.playerRefund.refundReason
  },
  set(value) {
    store.commit('setMoneyReason', value)
  },
})

const fundAmount = computed({
  get() {
    return store.state.playerRefund.refundAmount
  },
  set(value) {
    store.commit('setMoneyAmount', value)
  },
})

const deductMoney = computed({
  get() {
    return store.state.playerRefund.deductMoney
  },
  set(value) {
    store.commit('setDeductMoney', value)
  },
})

const fromBank = computed({
  get() {
    return store.state.playerRefund.fromBank
  },
  set(value) {
    store.commit('setFromBank', value)
  },
})
</script>

<style lang="scss" scoped></style>
