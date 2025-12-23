<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title>Create New Account</v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="createAccount">
              <v-text-field
                v-model="form.accountId"
                label="Account ID"
                :rules="accountIdRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-text-field
                v-model="form.name"
                label="Account Name"
                :rules="nameRules"
                variant="outlined"
                required
                :disabled="loading"
              ></v-text-field>
              
              <v-textarea
                v-model="form.description"
                label="Description"
                variant="outlined"
                rows="3"
                :disabled="loading"
              ></v-textarea>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              @click="$router.push('/accounts')"
              :disabled="loading"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              @click="createAccount"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Create Account
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createAccount as createAccountService } from '../services/accountClient'

const router = useRouter()

// Form data
const form = ref({
  accountId: '',
  name: '',
  description: ''
})

const valid = ref(false)
const loading = ref(false)

// Form validation rules
const accountIdRules = [
  (v: string) => !!v || 'Account ID is required',
  (v: string) => (v && v.length >= 3) || 'Account ID must be at least 3 characters',
  (v: string) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Account ID can only contain letters, numbers, hyphens, and underscores'
]

const nameRules = [
  (v: string) => !!v || 'Account name is required',
  (v: string) => (v && v.length >= 2) || 'Account name must be at least 2 characters'
]

// Methods
const createAccount = async () => {
  if (!valid.value) return
  
  loading.value = true
  try {
    const result = await createAccountService(
      form.value.accountId,
      form.value.name,
      form.value.description
    )
    
    if (result.created) {
      // Navigate back to list view
      router.push('/accounts')
    } else {
      console.log('Account already exists:', result.account)
      // Still navigate back, the account exists
      router.push('/accounts')
    }
  } catch (error) {
    console.error('Failed to create account:', error)
    // Handle error (show snackbar, etc.)
  } finally {
    loading.value = false
  }
}
</script>
