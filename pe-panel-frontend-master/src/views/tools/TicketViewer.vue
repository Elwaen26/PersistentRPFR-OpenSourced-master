<template>
  <div class="flex justify-center bg-slate-700">
    <div class="flex items-center w-1/4 h-screen justify-center">
      <div>
        <img
          src="@/assets/brand/pe.png"
          class="mx-auto"
          style="width: 90%"
          alt=""
        />
        <div class="w-full mt-6 shadow-lg rounded-xl p-5 bg-slate-200">
          <div>
            <div class="text-center px-3">
              Here you can view ticket transcripts by giving ticket number.
            </div>
            <div class="mt-3">
              <CFormInput
                type="text"
                placeholder="Please type valid ticket number."
                v-model="ticketNumber"
                aria-describedby="exampleFormControlInputHelpInline"
              />
            </div>
            <div class="mt-3">
              <CButton
                :disabled="disabledButton"
                @click="fetchTicket"
                color="primary"
                >Get Transcript</CButton
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { API_URL } from '@/config/config'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const ticketNumber = ref(null)
const disabledButton = ref(false)

const downloadTranscript = (ticketId, uri) => {
  var link = document.createElement('a')
  link.download = `ticket-${ticketId}.html`
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Download started.')
}

const fetchTicket = async () => {
  disabledButton.value = true
  setTimeout(() => {
    disabledButton.value = false
  }, 5000)

  downloadTranscript(
    ticketNumber.value,
    `${API_URL}tools/ticketview?ticketId=${ticketNumber.value}`,
  )
}
</script>

<style lang="scss" scoped></style>
