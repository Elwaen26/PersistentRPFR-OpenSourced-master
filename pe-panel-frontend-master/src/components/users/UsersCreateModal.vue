<template>
  <div>
    <CModalBody>
      <div class="w-3/4">
        <div class="flex items-center mb-3">
          <div class="mr-2">Username:</div>
          <CFormInput
            type="text"
            placeholder="Please type user name."
            v-model="username"
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
        <div class="flex items-center">
          <div class="mr-2">Password:</div>
          <CFormInput
            type="text"
            placeholder="Please type password."
            v-model="password"
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
        <div class="mt-4 mb-2">
          <CFormCheck
            id="flexCheckDefault"
            v-model="administratorCheckbox"
            label="Administrator"
          />
        </div>
        <div v-if="!administratorCheckbox" class="my-4">
          <CDropdown>
            <CDropdownToggle color="info">{{
              selectedRole ? selectedRole.Name : 'Please select role'
            }}</CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                @click="selectRole(item)"
                v-for="(item, index) in roles"
                :key="index"
                >{{ item.Name }}</CDropdownItem
              >
            </CDropdownMenu>
          </CDropdown>
        </div>
      </div>
    </CModalBody>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { computed } from 'vue'
const store = useStore()

const administratorCheckbox = computed({
  get() {
    return store.state.UserModule.administrator
  },
  set(value) {
    store.commit('setAdministrator', value)
  },
})

const username = computed({
  get() {
    return store.state.UserModule.username
  },
  set(value) {
    store.commit('setUsername', value)
  },
})

const password = computed({
  get() {
    return store.state.UserModule.password
  },
  set(value) {
    store.commit('setPassword', value)
  },
})

const selectedRole = computed(() => store.state.UserModule.selectedRole)

const selectRole = (value) => {
  store.commit('setSelectedRole', value)
}
const roles = computed(() => store.state.UserModule.roles)
</script>

<style lang="scss" scoped></style>
