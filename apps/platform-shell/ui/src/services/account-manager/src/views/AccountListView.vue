<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center">
            <span class="text-h6">Accounts</span>
            <v-spacer></v-spacer>
            <v-switch
              v-model="includeInactive"
              color="primary"
              inset
              hide-details
              label="Show inactive"
              :disabled="loading"
            ></v-switch>
            <v-text-field
              v-model="search"
              label="Search accounts..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              single-line
              class="mr-2"
              :disabled="loading"
              clearable
              @keyup.enter="reloadAccounts"
              @click:clear="onSearchCleared"
            ></v-text-field>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="$router.push('/accounts/create')"
            >
              Create Account
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="accounts"
              :loading="loading"
              :items-length="totalCount"
              class="elevation-1"
            >
              
              <template v-slot:item.active="{ item }">
                <v-chip
                  :color="item.active ? 'success' : 'error'"
                  size="small"
                >
                  {{ item.active ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>
              
              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              
              <template v-slot:item.updatedAt="{ item }">
                {{ formatDate(item.updatedAt) }}
              </template>
              
              <template v-slot:item.actions="{ item }">
                <!-- Active accounts: Edit and Inactivate -->
                <template v-if="item.active">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    @click="editAccount(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    color="error"
                    @click="confirmInactivate(item)"
                  ></v-btn>
                </template>
                <!-- Inactive accounts: Reactivate only -->
                <template v-else>
                  <v-btn
                    icon="mdi-restart"
                    size="small"
                    color="success"
                    @click="confirmReactivate(item)"
                  ></v-btn>
                </template>
              </template>
            </v-data-table>
            <div
              v-if="nextPageToken"
              class="d-flex justify-center mt-4"
            >
              <v-btn
                variant="text"
                color="primary"
                :disabled="loading"
                @click="loadMore"
              >
                Load More
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Inactivation Confirmation Dialog -->
    <v-dialog v-model="inactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Inactivate Account</v-card-title>
        <v-card-text>
          <p>Are you sure you want to inactivate account "{{ selectedAccount?.name }}"?</p>
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

    <!-- Reactivation Confirmation Dialog -->
    <v-dialog v-model="reactivateDialog" max-width="500">
      <v-card>
        <v-card-title>Reactivate Account</v-card-title>
        <v-card-text>
          <p>Are you sure you want to reactivate account "{{ selectedAccount?.name }}"?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="reactivateDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            @click="reactivateAccount"
          >
            Reactivate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAccount, inactivateAccount as inactivateAccountService, reactivateAccount as reactivateAccountService, listAccounts as listAccountsService } from '../services/accountClient'
import type { Account } from '@ai-pipestream/grpc-stubs/dist/repository/account/account_service_pb'

const router = useRouter()

// Reactive data
const accounts = ref<Account[]>([])
const loading = ref(false)
const search = ref('')
const includeInactive = ref(false)
const inactivateDialog = ref(false)
const reactivateDialog = ref(false)
const selectedAccount = ref<Account | null>(null)
const inactivateReason = ref('')
const nextPageToken = ref('')
const totalCount = ref(0)

// Table headers
const headers = [
  { title: 'Account ID', key: 'accountId', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Status', key: 'active', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Methods
const loadAccounts = async (options: { append?: boolean; pageToken?: string } = {}) => {
  loading.value = true
  try {
    const response = await listAccountsService({
      query: search.value.trim(),
      includeInactive: includeInactive.value,
      pageToken: options.pageToken
    })

    if (options.append) {
      accounts.value = [...accounts.value, ...(response.accounts ?? [])]
    } else {
      accounts.value = response.accounts ?? []
    }

    nextPageToken.value = response.nextPageToken || ''
    totalCount.value = response.totalCount || accounts.value.length
  } catch (error) {
    console.error('Failed to load accounts:', error)
    if (!options.append) {
      accounts.value = []
      nextPageToken.value = ''
      totalCount.value = 0
    }
  } finally {
    loading.value = false
  }
}

const reloadAccounts = () => {
  nextPageToken.value = ''
  loadAccounts()
}

const onSearchCleared = () => {
  if (!search.value) {
    reloadAccounts()
  }
}

const loadMore = () => {
  if (!nextPageToken.value) return
  loadAccounts({ append: true, pageToken: nextPageToken.value })
}

const viewAccount = (account: Account) => {
  // Navigate to account details view
  console.log('View account:', account)
}

const editAccount = (account: Account) => {
  router.push({ name: 'accounts-edit', params: { accountId: account.accountId } })
}

const confirmInactivate = (account: Account) => {
  selectedAccount.value = account
  inactivateReason.value = ''
  inactivateDialog.value = true
}

const inactivateAccount = async () => {
  if (!selectedAccount.value || !inactivateReason.value.trim()) return

  try {
    const result = await inactivateAccountService(
      selectedAccount.value.accountId,
      inactivateReason.value
    )

    if (result.success) {
      // Refresh the account list to show updated status
      await loadAccounts()

      inactivateDialog.value = false
      selectedAccount.value = null
      inactivateReason.value = ''
    } else {
      console.error('Failed to inactivate account:', result.message)
    }
  } catch (error) {
    console.error('Error inactivating account:', error)
  }
}

const confirmReactivate = (account: Account) => {
  selectedAccount.value = account
  reactivateDialog.value = true
}

const reactivateAccount = async () => {
  if (!selectedAccount.value) return

  try {
    const result = await reactivateAccountService(
      selectedAccount.value.accountId,
      'Reactivated via UI'
    )

    if (result.success) {
      // Refresh the account list to show updated status
      await loadAccounts()

      reactivateDialog.value = false
      selectedAccount.value = null
    } else {
      console.error('Failed to reactivate account:', result.message)
    }
  } catch (error) {
    console.error('Error reactivating account:', error)
  }
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A'
  const seconds = Number(timestamp.seconds || 0)
  const nanos = Number(timestamp.nanos || 0)
  const date = new Date(seconds * 1000 + nanos / 1000000)
  return date.toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadAccounts()
})

watch(includeInactive, () => {
  reloadAccounts()
})
</script>
