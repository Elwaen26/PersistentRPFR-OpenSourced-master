<template>
  <div>
    <CModal
      :visible="unbanModalVisible"
      @close="
        () => {
          unbanModalVisible = false
        }
      "
    >
      <PlayerUnbanModel />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              unbanModalVisible = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="dispatchUnban" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <div class="text-xl mb-4">Ban List</div>
    <div class="w-2/4 mb-3">
      <div class="mb-3">
        <Multiselect
          v-model="playerNameOrId"
          placeholder="Type player names."
          :close-on-select="true"
          :filter-results="false"
          :min-chars="1"
          :resolve-on-load="false"
          :delay="400"
          :searchable="true"
          :options="searchPlayers"
        />
      </div>
      <CButton @click="getBanList" color="primary">Search</CButton>
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
      <template #item-CreatedAt="{ CreatedAt }">
        {{ new Date(CreatedAt).toLocaleString() }}
      </template>
      <template #item-BannedBy="{ BannedBy }">
        {{ BannedBy ? BannedBy : 'Unknown' }}
      </template>
      <template #item-BanEndsAt="{ BanEndsAt }">
        {{ parseRemainingTime(BanEndsAt) }}
      </template>
      <template #item-operations="item">
        <CButton
          @click="openUnbanModel(item.PlayerId, item.PlayerName)"
          color="danger"
          shape="rounded-0"
          size="sm"
          >Remove</CButton
        >
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAxios } from '@/api/ApiClient'
import { useStore } from 'vuex'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import PlayerUnbanModel from '@/components/players/PlayerUnbanModel.vue'
import Multiselect from '@vueform/multiselect'

const store = useStore()
const axios = useAxios()

const unbanModalVisible = ref(false)

const headers = [
  { text: 'In-Game Name', value: 'PlayerName', width: 160 },
  { text: 'SteamID', value: 'PlayerId', width: 160 },
  { text: 'Banned By', value: 'BannedBy', width: 160 },
  { text: 'Banned At', value: 'CreatedAt', width: 160 },
  {
    text: 'Remaining Time To Unban',
    value: 'BanEndsAt',
    width: 160,
  },
  { text: 'Reason', value: 'BanReason', width: 360 },
  { text: 'Operations', value: 'operations' },
]

const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 100,
})

const playerNameOrId = ref('')

const openUnbanModel = (playerId, playerName) => {
  store.commit('setPlayerUnbanId', playerId)
  store.commit('setPlayerUnbanName', playerName)
  unbanModalVisible.value = true
}

const dispatchUnban = () => {
  store
    .dispatch('unbanPlayer')
    .then(() => {
      toast.success('Succesfully done.')
    })
    .then(() => getBanList())
    .catch(() => {
      toast.error('Error happened.')
    })
  unbanModalVisible.value = false
}

const items = ref([])

const fetchBanList = async (player, page, limit) => {
  return await axios.get(
    `players/banlist?${page ? 'page=' + page : 'page=0'}${
      limit ? '&limit=' + limit : '&limit=25'
    }${player ? '&player=' + player : ''}`,
  )
}

const parseRemainingTime = (BanEndsAt) => {
  const MINUTESSEC = 60
  const HOURSSEC = MINUTESSEC * 60
  const DAYSSEC = HOURSSEC * 24

  const totalSeconds = Math.floor(
    (new Date(BanEndsAt).getTime() - new Date().getTime()) / 1000,
  )
  if (totalSeconds < 0) {
    return `Unbanned`
  }
  const days =
    Math.floor(totalSeconds / DAYSSEC) > 0
      ? Math.floor(totalSeconds / DAYSSEC)
      : 0
  const hours =
    Math.floor(totalSeconds / HOURSSEC) > 0
      ? Math.floor((totalSeconds - days * DAYSSEC) / HOURSSEC)
      : 0

  const minutes =
    Math.floor(totalSeconds / MINUTESSEC) > 0
      ? Math.floor(
          (totalSeconds - (hours * HOURSSEC + days * DAYSSEC)) / MINUTESSEC,
        )
      : 0

  return `${days} day, ${hours} hours, ${minutes} mins`
}

const searchPlayers = async (playername) => {
  const resp = await axios.get('players/search', {
    params: { playername: playername },
  })
  return resp.data.map((item) => item.PlayerName)
}

const getBanList = async () => {
  loading.value = true
  const result = await fetchBanList(
    playerNameOrId.value,
    serverOptions.value.page - 1,
    serverOptions.value.rowsPerPage,
  )
  items.value = result.data[0]
  serverItemsLength.value = result.data[1]
  loading.value = false
}
getBanList()

watch(serverOptions, () => {
  getBanList()
})
</script>

<style lang="scss" scoped></style>
