<template>
  <div>
    <CModalHeader>
      <CModalTitle>Are you sure?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-2">
        When you warn a player, a warning will be showed up in players
        moderation log.
      </div>
      <CFormTextarea
        v-model="warnReason"
        id="exampleFormControlTextarea1"
        label="Warn Reason"
        rows="3"
        text="Please type a warn reason."
      ></CFormTextarea>
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
    </CModalBody>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const warnReason = computed({
  get() {
    return store.state.playerWarn.warnReason
  },
  set(value) {
    store.commit('setWarnReason', value)
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
</script>

<style lang="scss" scoped></style>
