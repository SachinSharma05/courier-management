import { db } from "@/lib/db/postgres";
import { providers } from "@/db/schema/providers";
import { clientCredentials } from "@/db/schema/clientCredentials";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto/encryption";

export async function getClientProviderCredentials(clientId: number, providerKey: string) {
  const prov = await db.select().from(providers).where(eq(providers.key, providerKey)).limit(1);
  const provider = prov[0];
  if (!provider) throw new Error("Provider not found: " + providerKey);

  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId))
    .where(eq(clientCredentials.provider_id, provider.id));

  const credentials: Record<string, string> = {};
  for (const row of rows) {
    credentials[row.env_key] = decrypt(row.encrypted_value);
  }

  return { provider, credentials };
}
