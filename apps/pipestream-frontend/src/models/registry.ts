export type RegistryKind = "SERVICE" | "MODULE" | "INFRA" | "EXTERNAL";

export interface RegistryEntry {
  name: string;
  displayName: string;
  kind: RegistryKind;
  tags: string[];
  capabilities: string[];
  version?: string;
  metadata: Record<string, string>;
  resolvable: boolean;
  targetHint?: string;
}

export interface RegistryGroups {
  core: RegistryEntry[];
  services: RegistryEntry[];
  modules: RegistryEntry[];
  infra: RegistryEntry[];
  external: RegistryEntry[];
}

export function createEmptyRegistryGroups(): RegistryGroups {
  return {
    core: [],
    services: [],
    modules: [],
    infra: [],
    external: [],
  };
}

export function sortEntries(entries: RegistryEntry[]): RegistryEntry[] {
  return [...entries].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

