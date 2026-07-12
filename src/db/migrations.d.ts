// drizzle-kit emits drizzle/migrations.js (untyped). Declare its shape so the
// expo migrator import stays type-safe.
declare module '*/drizzle/migrations' {
  const migrations: {
    journal: { entries: { idx: number; when: number; tag: string }[] };
    migrations: Record<string, string>;
  };
  export default migrations;
}
