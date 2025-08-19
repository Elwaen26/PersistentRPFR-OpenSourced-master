<template>
  <div>
    <CModal
      :visible="editModalVisible"
      @close="
        () => {
          editModalVisible = false
          playerDetailsLoaded = false
        }
      "
    >
      <PlayersEditModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              editModalVisible = false
              playerDetailsLoaded = false
            }
          "
        >
          Close
        </CButton>
      </CModalFooter>
    </CModal>
    <CModal
      :keyboard="false"
      :visible="slayConfirmationIsShow"
      @close="
        () => {
          slayConfirmationIsShow = false
        }
      "
    >
      <ConfirmationModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              slayConfirmationIsShow = false
            }
          "
          >No</CButton
        >
        <CButton @click="dispatchFade" color="primary">Yes</CButton>
      </CModalFooter>
    </CModal>
    <CModal
      size="xl"
      :keyboard="false"
      :visible="banModelIsShow"
      @close="
        () => {
          banModelIsShow = false
        }
      "
    >
      <PlayerBanModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              banModelIsShow = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="dispatchBan" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <CModal
      :keyboard="false"
      :visible="refundModalIsShow"
      @close="
        () => {
          refundModalIsShow = false
        }
      "
    >
      <PlayerRefundModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              refundModalIsShow = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="dispatchRefund" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <CModal
      :keyboard="false"
      :visible="playerWarnModalVisible"
      @close="
        () => {
          playerWarnModalVisible = false
        }
      "
    >
      <PlayerWarnModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              playerWarnModalVisible = false
            }
          "
          >No</CButton
        >
        <CButton @click="dispatchWarn" color="primary">Yes</CButton>
      </CModalFooter>
    </CModal>
    <div class="text-xl mb-4">Player Management</div>
    <div class="w-2/4 mb-3">
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
      <CButton @click="getPlayers" color="primary">Search</CButton>
    </div>
    <EasyDataTable
      v-model:server-options="serverOptions"
      :headers="headers"
      :items="items"
      buttons-pagination
      :loading="loading"
      :server-items-length="serverItemsLength"
    >
      <template #item-operations="item">
        <CButton
          v-if="permissionCheck('FadePlayers')"
          @click="setPlayerFadeInfo(item.PlayerId, item.Name)"
          class="mr-3"
          color="warning"
          shape="rounded-0"
          size="sm"
          >Slay</CButton
        >
        <CButton
          v-if="permissionCheck('BanPlayers')"
          @click="setPlayerBanInfo(item.PlayerId, item.Name)"
          class="mr-3"
          color="danger"
          shape="rounded-0"
          size="sm"
          >Ban</CButton
        >
        <CButton
          v-if="permissionCheck('WarnPlayers')"
          @click="setPlayerWarnInfo(item.PlayerId, item.Name)"
          class="mr-3"
          color="dark"
          shape="rounded-0"
          size="sm"
          >Warn</CButton
        >
        <CButton
          v-if="permissionCheck('RefundPlayers')"
          @click="setPlayerMoneyInfo(item.PlayerId, item.Name)"
          color="info"
          class="mr-3"
          shape="rounded-0"
          size="sm"
          >Money</CButton
        >
        <CButton
          @click="getPlayerInfo(item.PlayerId)"
          color="secondary"
          shape="rounded-0"
          size="sm"
          >Details</CButton
        >
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { useAxios } from '@/api/ApiClient'
import ConfirmationModal from '@/components/players/FadeModal.vue'
import PlayerBanModal from '@/components/players/PlayerBanModal.vue'
import PlayerRefundModal from '@/components/players/PlayerRefundModal.vue'
import PlayersEditModal from '@/components/players/PlayersEditModal.vue'
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import PlayerWarnModal from '@/components/players/PlayerWarnModal.vue'
import Multiselect from '@vueform/multiselect'
import { RoleBasedAccessCheck } from '@/utils/rbac'

const store = useStore()
const axios = useAxios()

const headers = [
  { text: 'In-Game Name', value: 'Name', width: 300 },
  { text: 'SteamID', value: 'PlayerId', width: 300 },
  { text: 'Money', value: 'Money', sortable: true },
  { text: 'Bank', value: 'BankAmount', sortable: true },
  { text: 'Operations', value: 'operations' },
]

const slayConfirmationIsShow = ref(false)
const banModelIsShow = ref(false)
const refundModalIsShow = ref(false)
const editModalVisible = ref(false)
const playerWarnModalVisible = ref(false)
const playerNameOrId = ref('')
const playerSearchMode = ref('full')

const searchModeChange = (val) => {
  playerSearchMode.value = val.target._value
}

const openConfirmationModal = () => {
  slayConfirmationIsShow.value = true
}

const openPlayerWarnModal = () => {
  playerWarnModalVisible.value = true
}

const permissionCheck = (requiredPermission) => {
  const str = `["${requiredPermission}"]`
  return RoleBasedAccessCheck(str)
}

const dispatchBan = () => {
  store
    .dispatch('banPlayer')
    .then(() => {
      toast.success('Succesfully done.')
    })
    .catch(() => {
      toast.error('Error happened.')
    })
  banModelIsShow.value = false
}

const dispatchFade = () => {
  store
    .dispatch('fadePlayer')
    .then(() => {
      toast.success('Succesfully done.')
    })
    .catch(() => {
      toast.error('Error happened.')
    })
  slayConfirmationIsShow.value = false
}

const dispatchWarn = () => {
  store
    .dispatch('warnPlayer')
    .then(() => {
      toast.success('Succesfully done.')
    })
    .catch(() => {
      toast.error('Error happened.')
    })
  playerWarnModalVisible.value = false
}

const dispatchRefund = () => {
  store
    .dispatch('refundPlayer')
    .then(() => {
      toast.success('Succesfully done.')
    })
    .catch(() => {
      toast.error('Error happened.')
    })
  refundModalIsShow.value = false
}

const setPlayerBanInfo = (playerId, playerName) => {
  store.commit('setPlayerBanId', playerId)
  store.commit('setPlayerName', playerName)
  openBanModal()
}

const setPlayerFadeInfo = (playerId, playerName) => {
  store.commit('setFadePlayerId', playerId)
  store.commit('setFadePlayerName', playerName)
  openConfirmationModal()
}

const setPlayerMoneyInfo = (playerId, playerName) => {
  store.commit('setMoneyPlayerId', playerId)
  store.commit('setMoneyPlayerName', playerName)
  openRefundModal()
}

const setPlayerWarnInfo = (playerId, playerName) => {
  store.commit('setWarnPlayerId', playerId)
  store.commit('setWarnPlayerName', playerName)
  openPlayerWarnModal()
}

const getPlayerInfo = async (playerId) => {
  const result = await axios.get(`players/info`, {
    params: { playerId: playerId },
  })
  store.commit('setPlayerDetails', result.data)
  editModalVisible.value = true
}

const searchPlayers = async (playername) => {
  const resp = await axios.get('players/search', {
    params: { playername: playername, search: playerSearchMode.value },
  })
  return resp.data.map((item) => item.PlayerName)
}

const openBanModal = () => {
  banModelIsShow.value = true
}

const openRefundModal = () => {
  refundModalIsShow.value = true
}

const items = ref([])

const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: null,
  sortType: null,
})

const fetchPlayers = async (player, page, limit, sortBy, sortType, mode) => {
  return await axios.get(
    `players?${player ? 'player=' + player : ''}${
      page ? '&page=' + page : '&page=0'
    }${limit ? '&limit=' + limit : '&limit=25'}${
      mode ? '&mode=' + mode : '&mode=full'
    }${sortBy ? '&sortBy=' + sortBy : ''}${
      sortType ? '&sortType=' + sortType : ''
    }`,
  )
}

const getPlayers = async () => {
  loading.value = true
  const result = await fetchPlayers(
    playerNameOrId.value,
    serverOptions.value.page - 1,
    serverOptions.value.rowsPerPage,
    serverOptions.value.sortBy,
    serverOptions.value.sortType,
    playerSearchMode,
  )
  items.value = result.data[0]
  serverItemsLength.value = result.data[1]
  loading.value = false
}

getPlayers()

watch(serverOptions, () => {
  getPlayers()
})
</script>

<style lang="scss" scoped></style>
