<template>
  <CModalHeader>
    <CModalTitle>Modal title</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Player Name:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Name"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Player ID:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.PlayerId"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Money:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Money"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Health:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Health"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Hunger:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Hunger"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Horse:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Horse"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Horse Harness:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.HorseHarness"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Equipment 0:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Equipment_0"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Equipment 1:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Equipment_1"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Equipment 2:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Equipment_2"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Equipment 3:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Equipment_3"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Armor Head:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Armor_Head"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Armor Body:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Armor_Body"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Armor Leg:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Armor_Leg"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Armor Gloves:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Armor_Gloves"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Armor Cape:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Armor_Cape"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Faction Index:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.FactionIndex"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">Class:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.Class"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">PosX:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.PosX"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">PosY:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.PosY"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="mr-2">PosZ:</div>
        <div class="w-3/4">
          <CFormInput
            type="text"
            v-model="playerInfo.PosZ"
            disabled
            aria-describedby="exampleFormControlInputHelpInline"
          />
        </div>
      </div>
    </div>
  </CModalBody>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const playerInfo = ref({
  Ammo_0: 0,
  Ammo_1: 0,
  Ammo_2: 0,
  Ammo_3: 0,
  Armor_Body: '',
  Armor_Cape: null,
  Armor_Gloves: null,
  Armor_Head: null,
  Armor_Leg: '',
  Class: '',
  Equipment_0: '',
  Equipment_1: '',
  Equipment_2: null,
  Equipment_3: null,
  FactionIndex: 6,
  Health: 0,
  Horse: null,
  HorseHarness: null,
  Hunger: 0,
  Id: 1,
  Money: 10094,
  Name: '',
  PlayerId: '',
  PosX: 0,
  PosY: 0,
  PosZ: 0,
})

const keys = Object.keys(store.state.playerDetails)
keys.forEach((item) => {
  playerInfo.value[item] = store.state.playerDetails[item]
})
</script>

<style lang="scss" scoped></style>
