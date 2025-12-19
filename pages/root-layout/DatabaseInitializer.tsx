import { MigrationHandler } from './MigrationHandler';

// Component that initializes database (Native version)
// On native platforms, database is initialized automatically, so we just pass through to MigrationHandler
export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  return <MigrationHandler>{children}</MigrationHandler>;
}
