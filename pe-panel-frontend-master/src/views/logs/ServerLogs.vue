<template>
  <div>
    <div class="flex mb-4">
      <div class="w-2/4 mr-6">
        <div class="flex justify-between mb-3 items-center">
          <Datepicker v-model="startTime" text-input />
          <div>---</div>
          <Datepicker v-model="endTime" text-input />
        </div>
        <div class="mb-4">
          <CButtonGroup role="group" aria-label="Basic example">
            <CButton @click="setTimeQuick(30)" color="info">30 Mins</CButton>
            <CButton @click="setTimeQuick(60)" color="info">1 Hours</CButton>
            <CButton @click="setTimeQuick(60 * 2)" color="info"
              >2 Hours</CButton
            >
            <CButton @click="setTimeQuick(60 * 3)" color="info"
              >3 Hours</CButton
            >
            <CButton @click="setTimeQuick(60 * 6)" color="info"
              >6 Hours</CButton
            >
            <CButton @click="setTimeQuick(60 * 24)" color="info">1 Day</CButton>
          </CButtonGroup>
        </div>
        <CFormCheck
          type="radio"
          name="flexRadioDefault"
          id="flexRadioDefault1"
          label="Full Search"
          value="full"
          @change="searchModeChange"
          checked
        />
        <CFormCheck
          type="radio"
          name="flexRadioDefault"
          id="flexRadioDefault2"
          label="Exact Search"
          value="exact"
          @change="searchModeChange"
        />
        <div class="mb-4 flex items-center">
          <Multiselect
            v-model="playerNames"
            mode="tags"
            placeholder="Type player names."
            :close-on-select="true"
            :filter-results="false"
            :min-chars="1"
            :resolve-on-load="false"
            :delay="400"
            :searchable="true"
            :options="searchPlayers"
          />
          <div class="ml-4">
            <CDropdown>
              <CDropdownToggle color="primary">{{
                playerLogModeDropdown.find(
                  (item) => item.value === playerLogMode,
                ).label
              }}</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  @click="playerLogMode = item.value"
                  v-for="(item, index) in playerLogModeDropdown"
                  :key="index"
                  >{{ item.label }}</CDropdownItem
                >
              </CDropdownMenu>
            </CDropdown>
          </div>
        </div>
        <div class="mb-4">
          <Multiselect
            v-model="selectedActionTypes"
            mode="tags"
            :close-on-select="false"
            :searchable="true"
            :create-option="false"
            :options="parsedActionTypes"
          />
        </div>
        <CButton class="mr-3" @click="searchButtonClick" color="primary"
          >Search</CButton
        >
        <CButton @click="getLogsAsTxt" color="secondary">Download</CButton>
        <!-- <CDropdown>
          <CDropdownToggle color="primary">Select Actions</CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem
              v-for="(item, index) in dropdownActions"
              :key="index"
              >{{ item.label }}</CDropdownItem
            >
          </CDropdownMenu>
        </CDropdown> -->
      </div>
      <!-- <div class="border w-2/4 p-2 overflow-scroll">
        <div class="tag-item rounded-2xl py-2 px-3 text-sm inline-block m-1">
          <div class="flex items-center">
            <span class="mr-2">asdfasd</span>
            <Icon>
              <Close />
            </Icon>
          </div>
        </div>
      </div> -->
    </div>
    <EasyDataTable
      v-model:server-options="serverOptions"
      :headers="headers"
      :items="items"
      buttons-pagination
      :loading="loading"
      :server-items-length="serverItemsLength"
      :rows-items="[100, 200, 300]"
    >
      <template #item-CreatedAt="item">
        {{ dayJS(item.CreatedAt).utc() }}
      </template>
      <template #item-AffectedPlayers="item">
        {{
          JSON.parse(item.AffectedPlayers).map((value) => value['PlayerName'])
        }}
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useAxios } from '@/api/ApiClient'
import Multiselect from '@vueform/multiselect'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { API_URL } from '@/config/config'
import { inject } from 'vue'

const dayJS = inject('dayJS')

const startTime = ref(null)
const endTime = ref(null)
const playerNames = ref([])
const axios = useAxios()
const selectedActionTypes = ref([])
const fetchedActionTypes = ref([])

const playerLogModeDropdown = [
  { value: 0, label: 'AND' },
  { value: 1, label: 'OR' },
]
const playerLogMode = ref(1)
const playerSearchMode = ref('full')

const searchModeChange = (val) => {
  playerSearchMode.value = val.target._value
}

const fetchLogs = async (
  startTime,
  endTime,
  player,
  page,
  limit,
  mode,
  actions,
) => {
  return await axios.get(
    `logs/server?${startTime ? 'startTime=' + startTime : ''}&${
      endTime ? 'endTime=' + endTime : ''
    }${player.length > 0 ? '&playerNames=' + player : ''}${
      mode ? '&mode=' + mode : '&mode=OR'
    }${actions ? '&actions=' + actions : ''}${
      page ? '&page=' + page : '&page=0'
    }${limit ? '&limit=' + limit : '&limit=25'}`,
  )
}

const setActionTypes = async () => {
  const actions = await axios.get('logs/actiontypes')
  fetchedActionTypes.value = actions.data
  console.log(JSON.stringify(actions.data))
  return
}

const parsedActionTypes = computed(() =>
  fetchedActionTypes.value.map((item) => {
    return { value: item, label: item }
  }),
)

const getLogDownloadLink = (startTime, endTime, player) => {
  return `${API_URL()}logs/server/txt?${
    startTime ? 'startTime=' + startTime : ''
  }&${endTime ? 'endTime=' + endTime : ''}&${
    'token=' + localStorage.getItem('token')
  }${player.length > 0 ? '&playerNames=' + player : ''}&mode=OR`
}

const searchPlayers = async (playername) => {
  const resp = await axios.get('players/search', {
    params: { playername: playername, search: playerSearchMode.value },
  })
  return resp.data.map((item) => item.PlayerName)
}

const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 100,
})

// const dropdownActions = [
//   { value: 0, label: 'Hit' },
//   { value: 1, label: 'Kill' },
//   { value: 2, label: 'Heal' },
//   { value: 3, label: 'Buy' },
//   { value: 4, label: 'Sell' },
//   { value: 5, label: 'Money pouch drop' },
//   { value: 6, label: 'Money pouch take' },
//   { value: 7, label: 'Drop item' },
//   { value: 8, label: 'Take item' },
//   { value: 9, label: 'Build and upgrade' },
//   { value: 10, label: 'Item craft' },
// ]

const headers = [
  { text: 'Created At', value: 'CreatedAt', width: 150 },
  { text: 'Issuer Player Name', value: 'IssuerPlayerName', width: 100 },
  { text: 'Issuer Player Id', value: 'IssuerPlayerId', width: 80 },
  { text: 'Affected Players', value: 'AffectedPlayers', width: 150 },
  { text: 'Log', value: 'LogMessage', width: 300 },
]

const items = ref([])

const getLogs = async () => {
  loading.value = true
  try {
    const result = await fetchLogs(
      startTime.value,
      endTime.value,
      playerNames.value,
      serverOptions.value.page - 1,
      serverOptions.value.rowsPerPage,
      playerLogModeDropdown.find((item) => item.value === playerLogMode.value)
        .label,
      selectedActionTypes.value.toString(),
    )
    items.value = result.data[0]
    serverItemsLength.value = result.data[1]
    loading.value = false
  } catch (error) {
    toast.error(error.response.data.message)
    loading.value = false
  }
}

const searchButtonClick = () => {
  serverOptions.value.page = 1
  getLogs()
}

const downloadLogsTxt = (uri) => {
  var link = document.createElement('a')
  link.download = 'logs.txt'
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getLogsAsTxt = async () => {
  try {
    const uri = getLogDownloadLink(
      startTime.value,
      endTime.value,
      playerNames.value,
    )
    downloadLogsTxt(uri)
    toast.success('Succesfully downloaded.')
  } catch (error) {
    toast.error(error.response.data.message)
  }
}

const setTimeQuick = (minutes) => {
  let date = new Date()
  startTime.value = new Date(date.getTime() - minutes * 60000).toISOString()
  endTime.value = date.toISOString()
}

setActionTypes()

watch(serverOptions, () => {
  getLogs()
})
</script>

<style lang="scss">
.dp__theme_light {
  --dp-icon-color: #1083e0 !important;
  --dp-hover-icon-color: #076cbf !important;
}
.tag-item {
  color: white;
  background-color: #2ab7ca;
}
</style>
