<template>
  <div>
    <div class="w-2/4 mb-3">
      <div class="mb-3">
        <Multiselect
          v-model="username"
          placeholder="Type player names."
          :close-on-select="true"
          :filter-results="false"
          :min-chars="1"
          :resolve-on-load="false"
          :delay="400"
          :searchable="true"
          :options="searchUsers"
        />
      </div>
      <CButton @click="getLogs" color="primary">Search</CButton>
    </div>
    <EasyDataTable
      v-model:server-options="serverOptions"
      :headers="headers"
      :items="items"
      buttons-pagination
      :loading="loading"
      :rows-items="[100, 200, 300]"
      :server-items-length="serverItemsLength"
    >
      <template #item-CreatedAt="item">
        {{ new Date(item.CreatedAt).toLocaleString() }}
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { useAxios } from '@/api/ApiClient'
import { ref, watch } from 'vue'
import Multiselect from '@vueform/multiselect'

const axios = useAxios()

const startTime = ref(null)
const endTime = ref(null)
const username = ref('')

const fetchLogs = async (startTime, endTime, username, page, limit) => {
  return await axios.get(
    `logs/panel?${page ? 'page=' + page : '&page=0'}${
      limit ? '&limit=' + limit : '&limit=25'
    }${startTime ? '&startTime=' + startTime : ''}${
      endTime ? '&endTime=' + endTime : ''
    }${username ? '&username=' + username : ''}`,
  )
}

const searchUsers = async (username) => {
  const resp = await axios.get('users/search', {
    params: { username: username },
  })
  return resp.data.map((item) => item.Username)
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
  { text: 'Admin Name', value: 'Username', width: 100 },
  { text: 'Action Type', value: 'ActionType', width: 80 },
  { text: 'Log', value: 'LogMessage', width: 300 },
]

const items = ref([])

const getLogs = async () => {
  loading.value = true
  const result = await fetchLogs(
    startTime.value,
    endTime.value,
    username.value,
    serverOptions.value.page - 1,
    serverOptions.value.rowsPerPage,
  )
  items.value = result.data[0]
  serverItemsLength.value = result.data[1]
  loading.value = false
}

getLogs()

watch(serverOptions, () => {
  getLogs()
})
</script>

<style lang="scss" scoped>
.tag-item {
  color: white;
  background-color: #2ab7ca;
}
</style>
