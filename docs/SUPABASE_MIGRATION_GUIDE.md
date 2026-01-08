# Supabase Migration Workflow

This project uses Supabase for the backend database. We follow the standard Supabase migration workflow to manage schema changes and data seeding.

Reference: [Supabase Database Migrations Guide](https://supabase.com/docs/guides/deployment/database-migrations)

## Prerequisites

1.  **Supabase CLI**: [Install the CLI](https://supabase.com/docs/guides/cli/getting-started).
2.  **Login**: `supabase login`
3.  **Link Project**: `supabase link --project-ref <your-project-ref>`

## Workflow for Schema Changes

### 1. Make Changes
You can modify your database schema in two ways:
- **Dashboard**: Make changes in the Supabase Dashboard (Table Editor).
- **SQL**: Write SQL manually.

### 2. Generate Migration (Diff)
After making changes to the *remote* database (e.g., via Dashboard) or if you want to capture *local* changes:

```bash
supabase db diff -f name_of_migration
```
This generates a new file in `supabase/migrations/<timestamp>_name_of_migration.sql`.

### 3. Review Migration
Check the generated SQL file to ensure it captures what you intended.

### 4. Deploy Changes
To apply pending migrations to the remote database:

```bash
supabase db push
```

## Seeding Data
We handle two types of data:

1.  **Static Data (Lookup Tables)**:
    - Example: `habit_definitions`, `easy_formula_rules`.
    - These are essential for the app to function.
    - **Strategy**: Included as MIGRATION files (e.g., `..._seeds.sql`).
    - **Update**: To update this data, create a *new* migration file with `INSERT` or `UPDATE` statements.

2.  **Test Data (Development)**:
    - Example: Fake babies, logs.
    - **Strategy**: Use `supabase/seed.sql` (if you use verifying locally with `supabase start`).
    - Currently, we rely on the app's onboarding flow to create user data.

## Resetting the Database
If you need a clean slate (deletes all data!):

1.  Go to Supabase Dashboard > SQL Editor.
2.  Run generic cleanup or use CLI:
    ```bash
    supabase db reset --linked
    ```
    *(Note: Be careful with remote resets)*

## Summary of Commands

| Action | Command |
| :--- | :--- |
| **Pull changes from remote** | `supabase db pull` |
| **Generate migration from diff** | `supabase db diff -f <name>` |
| **Push migrations to remote** | `supabase db push` |
| **Run local dev instance** | `supabase start` |
