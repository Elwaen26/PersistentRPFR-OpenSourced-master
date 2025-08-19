<template>
  <div>
    <CModal
      size="xl"
      :visible="isRoleModalVisible"
      @close="
        () => {
          isRoleModalVisible = false
        }
      "
    >
      <NewRoleAddModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              isRoleModalVisible = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="createNewRole" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <CModal
      size="xl"
      :visible="isRoleEditModalVisible"
      @close="
        () => {
          isRoleEditModalVisible = false
        }
      "
    >
      <NewRoleAddModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              isRoleEditModalVisible = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="editTheRole" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <div class="text-xl mb-4">Role Management</div>
    <CButton class="my-3" @click="getRoleActions" color="warning"
      >Add New Role</CButton
    >
    <div class="w-3/4">
      <EasyDataTable
        v-model:server-options="serverOptions"
        :headers="headers"
        :items="items"
        buttons-pagination
        :loading="loading"
        :server-items-length="serverItemsLength"
      >
        <template #item-CreatedAt="{ CreatedAt }">
          {{ new Date(CreatedAt).toLocaleString() }}
        </template>
        <template #item-Power="{ Power }">
          {{ Power == 2 ? 'Master Admin' : 'Moderator' }}
        </template>
        <template #item-operations="item">
          <CButton
            @click="editRole(item.Id)"
            class="mr-3"
            color="primary"
            shape="rounded-0"
            size="sm"
            >Edit</CButton
          >
          <CButton
            @click="removeRole(item.Id)"
            color="danger"
            shape="rounded-0"
            size="sm"
            >Remove</CButton
          >
        </template>
      </EasyDataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAxios } from '@/api/ApiClient'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import store from '@/store'
import NewRoleAddModal from '@/components/roles/NewRoleAddModal.vue'

const axios = useAxios()

const headers = [
  { text: 'Role', value: 'Name' },
  { text: 'Operations', value: 'operations' },
]

const items = ref([])

const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: null,
  sortType: null,
})

const isRoleModalVisible = ref(false)
const isRoleEditModalVisible = ref(false)
const openNewRoleAddModal = () => {
  isRoleModalVisible.value = true
}

const editRole = async (roleId) => {
  const result = await axios.get('roles/info', { params: { roleId: roleId } })
  const roleActions = await axios.get('roles/actions')
  const currentRoleActions = Object.values(roleActions.data).filter((item) =>
    result.data.actions.includes(item.action),
  )
  store.commit('setSelectedRoleActions', currentRoleActions)
  store.commit('setRoleActions', Object.values(roleActions.data))
  store.commit('setSelectedRoleName', result.data.Name)
  store.commit('setSelectedRoleId', result.data.Id)
  isRoleEditModalVisible.value = true
}

const createNewRole = async () => {
  const actions = store.state.selectedRoleActions.map((item) => item.action)
  const roleName = store.state.selectedRoleName
  const payload = { name: roleName, permissions: actions }

  try {
    await axios.post('roles', payload)
    toast.success('Successfully added.')
  } catch (error) {
    toast.error(error.response.data.message)
  }
  isRoleModalVisible.value = false
  getRoles()
  return
}

const editTheRole = async () => {
  const actions = store.state.selectedRoleActions.map((item) => item.action)
  const roleId = store.state.selectedRoleId
  const payload = { id: roleId, permissions: actions }

  try {
    await axios.put('roles', payload)
    toast.success('Successfully added.')
  } catch (error) {
    toast.error(error.response.data.message)
  }
  isRoleEditModalVisible.value = false
  getRoles()
  return
}

const getRoleActions = async () => {
  const result = await axios.get('roles/actions')
  store.commit('setRoleActions', result.data)
  openNewRoleAddModal()
}

const removeRole = async (roleId) => {
  try {
    await axios.delete('roles', { params: { roleId: roleId } })
    getRoles()
    toast.success('Successfully deleted.')
  } catch (error) {
    toast.error(error.response.message)
  }
}

const fetchRoles = async (page, limit) => {
  return axios.get(`roles`, { params: { page: page, limit: limit } })
}

const getRoles = async () => {
  loading.value = true
  const result = await fetchRoles(
    serverOptions.value.page - 1,
    serverOptions.value.rowsPerPage,
  )
  items.value = result.data[0]
  serverItemsLength.value = result.data[1]
  loading.value = false
}

getRoles()

watch(serverOptions, () => {
  getRoles()
})
</script>

<style lang="scss" scoped></style>
