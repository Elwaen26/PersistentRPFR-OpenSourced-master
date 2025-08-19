<template>
  <div>
    <CModal
      :visible="newUserModalVisible"
      @close="
        () => {
          newUserModalVisible = false
        }
      "
    >
      <CModalHeader>
        <CModalTitle>Add New User</CModalTitle>
      </CModalHeader>
      <UsersCreateModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              newUserModalVisible = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="registerNewUser" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <CModal
      :visible="userRoleEditModalVisible"
      @close="
        () => {
          userRoleEditModalVisible = false
        }
      "
    >
      <CModalHeader>
        <CModalTitle>Edit User Role</CModalTitle>
      </CModalHeader>
      <UsersEditRoleModal />
      <CModalFooter>
        <CButton
          color="secondary"
          @click="
            () => {
              userRoleEditModalVisible = false
            }
          "
        >
          Close
        </CButton>
        <CButton @click="updateUserRole" color="primary">Save changes</CButton>
      </CModalFooter>
    </CModal>
    <div class="text-xl mb-4">User Management</div>
    <div class="my-3 flex items-center">
      <div>
        <CFormInput
          type="text"
          label="Panel User Name"
          v-model="usernameSearch"
          placeholder="Exp. 'Alverrt'"
          text="Type panel user name."
          aria-describedby="exampleFormControlInputHelpInline"
        />
      </div>
      <CButton
        @click="getPanelUsers"
        class="ml-5 h-9 rounded-sm"
        color="primary"
        shape="rounded-0"
        size="sm"
        >Search</CButton
      >
    </div>
    <CButton class="my-3" @click="openNewUserModalVisible" color="warning"
      >Add New User</CButton
    >
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
      <template #item-role="item">
        {{ item && item.role ? item.role.Name : 'Null' }}
      </template>
      <template #item-operations="item">
        <CButton
          class="mr-3"
          @click="editUserRole(item.Username)"
          color="primary"
          shape="rounded-0"
          size="sm"
          >Edit Role</CButton
        >
        <CButton
          @click="removeUser(item.Username)"
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
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import UsersCreateModal from '@/components/users/UsersCreateModal.vue'
import UsersEditRoleModal from '@/components/users/UsersEditRoleModal.vue'
import { useStore } from 'vuex'

const axios = useAxios()
const store = useStore()
useAxios
const headers = [
  { text: 'Username', value: 'Username' },
  { text: 'Added At', value: 'CreatedAt' },
  { text: 'Permission', value: 'role' },
  { text: 'Operations', value: 'operations' },
]

const usernameSearch = ref('')

const newUserModalVisible = ref(false)
const userRoleEditModalVisible = ref(false)
const items = ref([])
const loading = ref(false)
const serverItemsLength = ref(0)
const serverOptions = ref({
  page: 1,
  rowsPerPage: 25,
})

const removeUser = async (username) => {
  try {
    await axios.delete(`users?username=${username}`)
    toast.success('Successfully removed.')
    getPanelUsers()
  } catch (error) {
    toast.error('WTF AN ERROR HAPPENED')
  }
}

const editUserRole = (username) => {
  store.commit('setUsername', username)
  openUserRoleEditModalVisible()
}

const updateUserRole = async () => {
  try {
    await axios.put('users', {
      roleid: store.state.UserModule.selectedRole
        ? store.state.UserModule.selectedRole.Id
        : null,
      admin: store.state.UserModule.administrator,
      username: store.state.UserModule.username,
    })
    toast.success('Successfully updated user role.')
    userRoleEditModalVisible.value = false
    getPanelUsers()
  } catch (error) {
    toast.error(error.response.data.message)
  }
}

const registerNewUser = async () => {
  try {
    await axios.post(`users/register`, {
      username: store.state.UserModule.username,
      password: store.state.UserModule.password,
      roleid: store.state.UserModule.selectedRole
        ? store.state.UserModule.selectedRole.Id
        : null,
      admin: store.state.UserModule.administrator,
    })
    toast.success('Successfully added.')
    newUserModalVisible.value = false
    store.commit('setUsername', '')
    store.commit('setPassword', '')
    store.commit('setSelectedRole', null)
    store.commit('setAdministrator', false)
    getPanelUsers()
  } catch (error) {
    console.log(error)
    toast.error('Internal server error.')
  }
}

const openNewUserModalVisible = () => {
  newUserModalVisible.value = true
}

const openUserRoleEditModalVisible = () => {
  userRoleEditModalVisible.value = true
}

const fetchPanelUsers = async (username, page, limit) => {
  return await axios.get(
    `users?${page ? 'page=' + page : 'page=0'}${
      limit ? '&limit=' + limit : '&limit=25'
    }${username ? '&username=' + username : ''}`,
  )
}

const fetchRoles = async () => {
  const result = await axios.get('roles')
  store.commit('setRoles', result.data[0])
  return
}

fetchRoles()

const getPanelUsers = async () => {
  loading.value = true
  const result = await fetchPanelUsers(
    usernameSearch.value,
    serverOptions.value.page - 1,
    serverOptions.value.rowsPerPage,
  )
  items.value = result.data[0]
  serverItemsLength.value = result.data[1]
  loading.value = false
}

getPanelUsers()

watch(serverOptions, () => {
  getPanelUsers()
})
</script>

<style lang="scss" scoped></style>
