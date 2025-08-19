<template>
  <div>
    <CModal
      :visible="confirmationModalVisible"
      @close="
        () => {
          confirmationModalVisible = false
        }
      "
    >
      <ConfirmationModal />
      <CModalFooter>
        <CButton
          @click="
            () => {
              confirmationModalVisible = false
            }
          "
          color="secondary"
          >No</CButton
        >
        <CButton @click="dispatchAnnouncement" color="primary">Yes</CButton>
      </CModalFooter>
    </CModal>
    <div class="mt-5">
      <div class="mb-3" v-if="permissionCheck('tools/announcement:create')">
        <div class="text-xl mb-2">Make In-Game Announcement</div>
        <div style="width: 500px">
          <CFormTextarea
            v-model="message"
            id="exampleFormControlTextarea1"
            label="Announcement"
            rows="3"
            text="Please type the announcement you want to make."
          ></CFormTextarea>
        </div>
        <CButton class="mt-3" @click="openConfirmationModal" color="primary"
          >Announce</CButton
        >
      </div>

      <div v-if="permissionCheck('administrator')">
        <div class="text-xl mb-2">Configure Modlog Expiration Interval</div>
        <div style="width: 500px">
          <CFormInput
            v-model="modlogexpireinterval"
            id="exampleFormControlTextarea1"
            label="Days"
            rows="3"
            text="Please provide number of days."
          ></CFormInput>
        </div>
        <CButton class="mt-3" @click="setModlogIntervalConfig" color="primary"
          >Set</CButton
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useAxios } from '@/api/ApiClient'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { RoleBasedAccessCheck } from '@/utils/rbac'

const axios = useAxios()

const confirmationModalVisible = ref(false)
const adminPower = ref(false)
const message = ref('')
const modlogexpireinterval = ref(0)

adminPower.value = parseInt(localStorage.getItem('kaju')) === 2 ? true : false

const fetchModlogIntervalConfig = async () => {
  return await axios.get('settings/modloginterval')
}

const getModlogIntervalConfig = async () => {
  const result = await fetchModlogIntervalConfig()
  const days = parseInt(result.data.ConfigValue)
  modlogexpireinterval.value = days
}

const setModlogIntervalConfig = async () => {
  try {
    await axios.post(`settings/modloginterval/${modlogexpireinterval.value}`)
    toast.success('Successfully set.')
  } catch (error) {
    toast.error(error.response.data.message)
  }
}

const openConfirmationModal = () => {
  confirmationModalVisible.value = true
}

const permissionCheck = (requiredPermission) => {
  const str = `["${requiredPermission}"]`
  return RoleBasedAccessCheck(str)
}

const dispatchAnnouncement = async () => {
  confirmationModalVisible.value = false
  try {
    const result = await axios.post('tools/announcement', {
      Message: message.value,
    })
    if (result.status === 201 || result.status === 200) {
      toast.success('Succesfully made the announcement.')
    } else {
      toast.warning('You can send only one announcement in every 15 seconds.')
    }
  } catch (error) {
    toast.error(error.response.data.message)
  }
}

getModlogIntervalConfig()
</script>

<style lang="scss" scoped></style>
