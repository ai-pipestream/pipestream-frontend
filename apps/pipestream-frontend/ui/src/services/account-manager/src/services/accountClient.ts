import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { create } from '@bufbuild/protobuf'
import {
  AccountService,
  AccountSchema,
  CreateAccountRequestSchema,
  GetAccountRequestSchema,
  InactivateAccountRequestSchema,
  ReactivateAccountRequestSchema,
  ListAccountsRequestSchema,
  ListAccountsResponseSchema,
  UpdateAccountRequestSchema,
  type Account,
  type CreateAccountRequest,
  type GetAccountRequest,
  type InactivateAccountRequest,
  type ReactivateAccountRequest,
  type ListAccountsRequest,
  type ListAccountsResponse,
  type UpdateAccountRequest
} from '@ai-pipestream/protobuf-forms/generated'

// Create transport to connect through web-proxy using binary format
// The web-proxy will route to account-manager based on the service definitions
const transport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true
})

// Create service client
export const accountClient = createClient(AccountService, transport)

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

/**
 * Create a new account
 */
export async function createAccount(
  accountId: string,
  name: string,
  description?: string
): Promise<{ account: Account; created: boolean }> {
  const request = create(CreateAccountRequestSchema, {
    accountId,
    name,
    description: description || ''
  }) as CreateAccountRequest

  const response = await accountClient.createAccount(request)
  return {
    account: response.account!,
    created: response.created
  }
}

/**
 * Get an account by ID
 */
export async function getAccount(accountId: string): Promise<Account> {
  const request = create(GetAccountRequestSchema, {
    accountId
  }) as GetAccountRequest

  const response = await accountClient.getAccount(request)
  return response
}

/**
 * Inactivate an account (soft delete)
 */
export async function inactivateAccount(
  accountId: string,
  reason: string
): Promise<{ success: boolean; message: string; drivesAffected: number }> {
  const request = create(InactivateAccountRequestSchema, {
    accountId,
    reason
  }) as InactivateAccountRequest

  const response = await accountClient.inactivateAccount(request)
  return {
    success: response.success,
    message: response.message,
    drivesAffected: response.drivesAffected
  }
}

/**
 * Reactivate an account
 */
export async function reactivateAccount(
  accountId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const request = create(ReactivateAccountRequestSchema, {
    accountId,
    reason
  }) as ReactivateAccountRequest

  const response = await accountClient.reactivateAccount(request)
  return {
    success: response.success,
    message: response.message
  }
}

/**
 * Create an Account object from form data
 */
export function createAccountFromForm(formData: {
  accountId: string
  name: string
  description?: string
}): Account {
  const now = new Date()
  return create(AccountSchema, {
    accountId: formData.accountId,
    name: formData.name,
    description: formData.description || '',
    active: true,
    createdAt: {
      seconds: BigInt(Math.floor(now.getTime() / 1000)),
      nanos: (now.getTime() % 1000) * 1000000
    },
    updatedAt: {
      seconds: BigInt(Math.floor(now.getTime() / 1000)),
      nanos: (now.getTime() % 1000) * 1000000
    }
  }) as Account
}

/**
 * List accounts with optional filtering/pagination
 */
export async function listAccounts(options: {
  query?: string
  includeInactive?: boolean
  pageSize?: number
  pageToken?: string
} = {}): Promise<ListAccountsResponse> {
  const request = create(ListAccountsRequestSchema, {
    query: options.query ?? '',
    includeInactive: options.includeInactive ?? false,
    pageSize: options.pageSize ?? 50,
    pageToken: options.pageToken ?? ''
  }) as ListAccountsRequest

  return accountClient.listAccounts(request)
}

/**
 * Update an existing account's metadata
 */
export async function updateAccount(
  accountId: string,
  name: string,
  description?: string
): Promise<Account> {
  const request = create(UpdateAccountRequestSchema, {
    accountId,
    name,
    description: description ?? ''
  }) as UpdateAccountRequest
  const response = await accountClient.updateAccount(request)
  return response.account!
}
