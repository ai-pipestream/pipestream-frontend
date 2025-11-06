<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card v-if="account">
          <v-card-title>Edit Account: {{ account.accountId }}</v-card-title>
          
          <v-card-text>
            <v-form v-model="valid" @submit.prevent="updateAccount">
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
              
              <v-chip
                :color="account.active ? 'success' : 'error'"
                size="large"
                class="ma-2"
              >
                {{ account.active ? 'Active' : 'Inactive' }}
              </v-chip>
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
              v-if="account.active"
              color="error"
              @click="confirmInactivate"
              :disabled="loading"
            >
              Inactivate Account
            </v-btn>
            <v-btn
              color="primary"
              @click="updateAccount"
              :disabled="!valid || loading"
              :loading="loading"
            >
              Update Account
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <v-card v-else-if="loading">
          <v-card-text class="text-center">
            <v-progress-circular indeterminate></v-progress-circular>
            <p class="mt-4">Loading account...</p>
          </v-card-text>
        </v-card>
        
        <v-card v-else>
          <v-card-text class="text-center">
            <p>Account not found</p>
            <v-btn @click="$router.push('/accounts')">Back to Accounts</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Inactivation Confirmation Dialog -->
    <v-dialog v-model="inactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Inactivate Account</v-card-title>
        <v-card-text>
          <p>Are you sure you want to inactivate account "{{ account?.name }}"?</p>
          <v-text-field
            v-model="inactivateReason"
            label="Reason for inactivation"
            variant="outlined"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="inactivateDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="inactivateAccount"
            :disabled="!inactivateReason.trim()"
          >
            Inactivate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAccount, inactivateAccount as inactivateAccountService, updateAccount as updateAccountService } from '../services/accountClient'
import type { Account } from '@io-pipeline/grpc-stubs/account'

const router = useRouter()

// Props
const props = defineProps<{
  accountId: string
}>()

// Reactive data
const account = ref<Account | null>(null)
const loading = ref(false)
const valid = ref(false)
const inactivateDialog = ref(false)
const inactivateReason = ref('')

// Form data
const form = ref({
  name: '',
  description: ''
})

// Form validation rules
const nameRules = [
  (v: string) => !!v || 'Account name is required',
  (v: string) => (v && v.length >= 2) || 'Account name must be at least 2 characters'
]

// Methods
const loadAccount = async () => {
  loading.value = true
  try {
    if (!props.accountId) {
      account.value = null
      return
    }

    account.value = await getAccount(props.accountId)
    if (account.value) {
      form.value.name = account.value.name
      form.value.description = account.value.description ?? ''
    }
    valid.value = true
  } catch (error) {
    console.error('Failed to load account:', error)
    account.value = null
  } finally {
    loading.value = false
  }
}

const updateAccount = async () => {
  if (!valid.value || !account.value) return
  
  loading.value = true
  try {
    const updated = await updateAccountService(
      account.value.accountId,
      form.value.name.trim(),
      form.value.description?.trim()
    )

    account.value = updated
    form.value.name = updated.name
    form.value.description = updated.description ?? ''
    valid.value = true
    console.info('Account updated successfully')
  } catch (error) {
    console.error('Failed to update account:', error)
  } finally {
    loading.value = false
  }
}

const confirmInactivate = () => {
  inactivateReason.value = ''
  inactivateDialog.value = true
}

const inactivateAccount = async () => {
  if (!account.value || !inactivateReason.value.trim()) return
  
  try {
    const result = await inactivateAccountService(
      account.value.accountId,
      inactivateReason.value
    )
    
    if (result.success) {
      // Update the account status
      account.value = { ...account.value, active: false }
      inactivateDialog.value = false
      inactivateReason.value = ''
    } else {
      console.error('Failed to inactivate account:', result.message)
    }
  } catch (error) {
    console.error('Error inactivating account:', error)
  }
}

// Lifecycle
watch(
  () => props.accountId,
  () => {
    loadAccount()
  },
  { immediate: true }
)
</script>
