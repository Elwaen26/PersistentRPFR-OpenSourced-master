<template>
  <CModalHeader>
    <CModalTitle
      >Player Ban: {{ store.state.playerBan.playerName }}</CModalTitle
    >
  </CModalHeader>
  <CModalBody>
    <div>
      <EasyDataTable
        v-if="items.length > 0"
        v-model:server-options="serverOptions"
        :headers="headers"
        :hide-rows-per-page="true"
        :items="items"
        :buttons-pagination="items.length > serverOptions.rowsPerPage"
        :loading="loading"
        :server-items-length="serverItemsLength"
      >
        <template #item-CreatedAt="{ CreatedAt }">
          {{ new Date(CreatedAt).toLocaleString() }}</template
        >
        <template #item-Reason="{ Reason }">
          <span :title="Reason">{{
            `${Reason.substring(0, 160)}${Reason.length > 160 ? '...' : ''}`
          }}</span>
        </template>
      </EasyDataTable>
      <div class="flex items-center mb-3" :class="{ 'mt-4': items.length > 0 }">
        <div class="mr-3">Ban Type:</div>
        <CDropdown class="mb-3">
          <CDropdownToggle color="secondary">{{
            dropdownActions[
              dropdownActions.findIndex((item) => item.value == banType)
            ].label
          }}</CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem
              v-for="(item, index) in dropdownActions"
              @click="banTypeToggle(dropdownActions[index].value)"
              :key="index"
              >{{ item.label }}</CDropdownItem
            >
          </CDropdownMenu>
        </CDropdown>
      </div>
      <div class="flex justify-between mb-5 w-full items-center">
        <Datepicker
          :disabled="banType == 1"
          v-model="banEndsAt"
          :min-date="new Date()"
        />
      </div>
      <CButtonGroup v-if="banType == 0" role="group" aria-label="Basic example">
        <CButton @click="setBanEndingTime(60)" color="primary">1 Hour</CButton>
        <CButton @click="setBanEndingTime(60 * 6)" color="primary"
          >6 Hour</CButton
        >
        <CButton @click="setBanEndingTime(60 * 24)" color="primary"
          >1 day</CButton
        >
        <CButton @click="setBanEndingTime(60 * 24 * 3)" color="primary"
          >3 day</CButton
        >
        <CButton @click="setBanEndingTime(60 * 24 * 5)" color="primary"
          >5 day</CButton
        >
        <CButton @click="setBanEndingTime(60 * 24 * 7)" color="primary"
          >1 week</CButton
        >
      </CButtonGroup>
      <CForm class="mt-4">
        <CFormTextarea
          v-model="banReason"
          id="exampleFormControlTextarea1"
          label="Ban Reason"
          rows="3"
          text="Please type a ban reason."
        ></CFormTextarea>
      </CForm>
      <div class="mt-3">
        <CFormCheck
          id="flexCheckDefault"
          v-model="annonuncementCheckbox"
          label="Announce it in modlog"
        />
      </div>
      <div v-if="annonuncementCheckbox">
        <CFormInput
          v-model="transcriptUrl"
          label="Transcript URL"
          text="Please type the transcript channel url from discord."
        />
      </div>
    </div>
  </CModalBody>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useAxios } from '@/api/ApiClient'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const store = useStore()
const axios = useAxios()

const dropdownActions = [
  { value: 0, label: 'Custom' },
  { value: 1, label: 'Permanent' },
]

const fetchPlayerModerationLogs = async (playerId, page, limit) => {
  return await axios.get(`players/modlog/${playerId}`, {
    params: { page: page, limit: limit },
  })
}

const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 5,
})

const headers = [
  { text: 'Datetime (UTC)', value: 'CreatedAt' },
  { text: 'Admin', value: 'BannedBy' },
  { text: 'Punishment', value: 'PunishmentType' },
  { text: 'Reason', value: 'Reason', width: 520 },
]

const items = ref([])

const getPlayerModerationLogs = async () => {
  loading.value = true
  try {
    const result = await fetchPlayerModerationLogs(
      store.state.playerBan.playerId,
      serverOptions.value.page - 1,
      serverOptions.value.rowsPerPage,
    )
    items.value = result.data[0]
    serverItemsLength.value = result.data[1]
    loading.value = false
  } catch (error) {
    toast.error(error.response.data.message)
    loading.value = false
  }
}

watch(serverOptions, () => {
  getPlayerModerationLogs()
})

onMounted(() => {
  getPlayerModerationLogs()
})

const banEndsAt = computed({
  get() {
    return store.state.playerBan.banEndsAt
  },
  set(value) {
    store.commit('setBanEndsAt', value)
  },
})

const banReason = computed({
  get() {
    return store.state.playerBan.banReason
  },
  set(value) {
    store.commit('setBanReason', value)
  },
})

const annonuncementCheckbox = computed({
  get() {
    return store.state.announceModlog
  },
  set(value) {
    store.commit('setAnnounceModlog', value)
  },
})

const transcriptUrl = computed({
  get() {
    return store.state.transcriptUrl
  },
  set(value) {
    store.commit('setTranscriptUrl', value)
  },
})

const setBanEndingTime = (minutes) => {
  const date = new Date()
  banEndsAt.value = new Date(date.getTime() + minutes * 60000)
}
const banType = ref(0)

const banTypeToggle = (value) => {
  banEndsAt.value = ''
  banType.value = value
  if (value == 1) {
    banEndsAt.value = new Date(2212688185000)
  }
}
</script>

<style lang="scss" scoped></style>
