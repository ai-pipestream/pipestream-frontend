export type NavItem = {
  title: string
  icon?: string
  to?: string
  href?: string
  external?: boolean
  disabled?: boolean
  children?: NavItem[]
}

export type NavMenuFetcher = (target?: string) => Promise<NavItem[]>

export interface NavShellProps {
  title?: string
  items?: NavItem[]
  modelValue?: boolean
  rail?: boolean
  permanent?: boolean
  expandOnHover?: boolean
  target?: string
  autoLoadMenu?: boolean
  itemsUrl?: string
  fetchMenuItems?: NavMenuFetcher
  periodicRefreshMs?: number
}
