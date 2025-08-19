import { useAxios } from '@/api/ApiClient'
import { createStore } from 'vuex'

const UserModule = {
  state: () => ({
    username: '',
    password: '',
    selectedRole: null,
    roles: [],
    administrator: false,
  }),
  mutations: {
    setUsername(state, value) {
      state.username = value
    },
    setPassword(state, value) {
      state.password = value
    },
    setSelectedRole(state, value) {
      state.selectedRole = value
    },
    setRoles(state, value) {
      state.roles = value
    },
    setAdministrator(state, value) {
      state.administrator = value
    },
    setUserId(state, value) {
      state.userId = value
    },
  },
}

export default createStore({
  state: {
    sidebarVisible: '',
    sidebarUnfoldable: false,
    announceModlog: false,
    transcriptUrl: '',
    playerBan: {
      playerId: '',
      playerName: '',
      banEndsAt: '',
      banReason: '',
    },
    playerFade: {
      playerId: '',
      playerName: '',
      fadeReason: '',
    },
    playerWarn: {
      playerId: '',
      playerName: '',
      warnReason: '',
    },
    playerRefund: {
      playerId: '',
      playerName: '',
      deductMoney: false,
      fromBank: false,
      refundAmount: 0,
      refundReason: '',
    },
    playerDetails: {},
    playerUnban: {
      playerId: '',
      playerName: '',
      unbanReason: '',
    },
    roleActions: {},
    selectedRoleActions: [],
    selectedRoleName: '',
    selectedRoleId: 0,
  },
  mutations: {
    toggleSidebar(state) {
      state.sidebarVisible = !state.sidebarVisible
    },
    toggleUnfoldable(state) {
      state.sidebarUnfoldable = !state.sidebarUnfoldable
    },
    updateSidebarVisible(state, payload) {
      state.sidebarVisible = payload.value
    },
    setPlayerBanId(state, value) {
      state.playerBan.playerId = value
    },
    setPlayerName(state, value) {
      state.playerBan.playerName = value
    },
    setBanEndsAt(state, value) {
      state.playerBan.banEndsAt = value
    },
    setBanReason(state, value) {
      state.playerBan.banReason = value
    },
    setFadePlayerId(state, value) {
      state.playerFade.playerId = value
    },
    setFadePlayerName(state, value) {
      state.playerFade.playerName = value
    },
    setFadeReason(state, value) {
      state.playerFade.fadeReason = value
    },
    setMoneyPlayerId(state, value) {
      state.playerRefund.playerId = value
    },
    setMoneyPlayerName(state, value) {
      state.playerRefund.playerName = value
    },
    setMoneyAmount(state, value) {
      state.playerRefund.refundAmount = value
    },
    setMoneyReason(state, value) {
      state.playerRefund.refundReason = value
    },
    setPlayerDetails(state, value) {
      state.playerDetails = value
    },
    setPlayerUnbanId(state, value) {
      state.playerUnban.playerId = value
    },
    setPlayerUnbanName(state, value) {
      state.playerUnban.playerName = value
    },
    setPlayerUnbanReason(state, value) {
      state.playerUnban.unbanReason = value
    },
    setWarnPlayerId(state, value) {
      state.playerWarn.playerId = value
    },
    setWarnPlayerName(state, value) {
      state.playerWarn.playerName = value
    },
    setWarnReason(state, value) {
      state.playerWarn.warnReason = value
    },
    setAnnounceModlog(state, value) {
      state.announceModlog = value
    },
    setTranscriptUrl(state, value) {
      state.transcriptUrl = value
    },
    setRoleActions(state, value) {
      state.roleActions = value
    },
    setSelectedRoleActions(state, value) {
      state.selectedRoleActions = value
    },
    setSelectedRoleName(state, value) {
      state.selectedRoleName = value
    },
    setSelectedRoleId(state, value) {
      state.selectedRoleId = value
    },
    setDeductMoney(state, value) {
      state.playerRefund.deductMoney = value
    },
    setFromBank(state, value) {
      state.playerRefund.fromBank = value
    },
  },
  actions: {
    async banPlayer() {
      const axios = useAxios()
      await axios.post(
        `players/ban?announce=${this.state.announceModlog}&url=${this.state.transcriptUrl}`,
        this.state.playerBan,
      )
      this.state.announceModlog = false
    },
    async fadePlayer() {
      const axios = useAxios()
      await axios.post(
        `players/fade?announce=${this.state.announceModlog}&url=${this.state.transcriptUrl}`,
        this.state.playerFade,
      )
      this.state.announceModlog = false
    },
    async refundPlayer() {
      const axios = useAxios()
      await axios.post('players/refund', this.state.playerRefund)
    },
    async unbanPlayer() {
      const axios = useAxios()
      await axios.post('players/unban', this.state.playerUnban)
    },
    async warnPlayer() {
      const axios = useAxios()
      await axios.post(
        `players/warn?announce=${this.state.announceModlog}&url=${this.state.transcriptUrl}`,
        this.state.playerWarn,
      )
      this.state.announceModlog = false
    },
  },
  modules: {
    UserModule: UserModule,
  },
})
