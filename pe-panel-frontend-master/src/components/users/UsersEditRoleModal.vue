<template>
  <div>
    <CModalBody>
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

const selectedRole = computed(() => store.state.UserModule.selectedRole)

const selectRole = (value) => {
  store.commit('setSelectedRole', value)
}
const roles = computed(() => store.state.UserModule.roles)
</script>

<style lang="scss" scoped></style>
