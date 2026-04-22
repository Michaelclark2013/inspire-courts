import { createClient } from "@libsql/client";
import 'dotenv/config';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const r = await client.execute("SELECT id, email, name, role, approved FROM users WHERE role='admin' ORDER BY id");
console.log("Admins:", r.rows);
