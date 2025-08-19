<template>
  <div>
    <div class="text-xl mb-4">Refund Calculator</div>
    <div class="text-lg mb-3">
      Here you can get the total price of lost items. Please copy the dropped
      items from logs.
    </div>
    <div class="mb-2">For example:</div>
    <div
      class="border-2 border-black p-1 break-words mb-4"
      style="width: 500px"
    >
      PE_heavy_round_shield*1,PE_western_2hsword_t3*1,PE_imperial_spear_t2*1,PE_imperial_mail_coif*1,PE_imperial_mail_over_leather*1,PE_northern_plated_boots*1,PE_northern_plated_gloves*1,PE_pauldron_cape_a*1,pe_silverore*10,pe_silverore*10,pe_silverore*1
    </div>
    <div style="max-width: 500px">
      <CFormTextarea
        v-model="compensateString"
        id="exampleFormControlTextarea1"
        label="Dropped Items"
        rows="6"
        text="Please type dropped items with specified format above."
      ></CFormTextarea>
      <CButton
        :disabled="calculateButtonDisabled"
        @click="dispatchCalculation"
        class="mt-3"
        color="primary"
        >Calculate</CButton
      >
      <CCard v-if="pricesLoaded" class="mt-3" style="width: 18rem">
        <CListGroup flush>
          <CListGroupItem
            >Max Total Price: {{ prices.maxPrice }}</CListGroupItem
          >
          <CListGroupItem
            >Min Total Price: {{ prices.minPrice }}</CListGroupItem
          >
        </CListGroup>
      </CCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAxios } from '@/api/ApiClient'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const axios = useAxios()

const compensateString = ref('')
const prices = ref({
  maxPrice: null,
  minPrice: null,
})
const pricesLoaded = ref(false)
const calculateButtonDisabled = ref(false)

const fetchCalculationFromServer = async (itemsStr) => {
  return await axios.get('tools/compcalculator', {
    params: { droppedItems: itemsStr },
  })
}

const dispatchCalculation = async () => {
  calculateButtonDisabled.value = true
  setTimeout(() => {
    calculateButtonDisabled.value = false
  }, 800)
  try {
    const result = await fetchCalculationFromServer(compensateString.value)
    prices.value.maxPrice = result.data.maxPrice
    prices.value.minPrice = result.data.minPrice
    pricesLoaded.value = true
  } catch (error) {
    toast.error(error.response.data.message)
  }
}
</script>
