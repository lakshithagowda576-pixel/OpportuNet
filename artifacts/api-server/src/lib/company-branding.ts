import { db } from "@workspace/db";
import { companyBrandingTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function getCompanyBranding(companyName: string) {
  const [branding] = await db
    .select()
    .from(companyBrandingTable)
    .where(eq(companyBrandingTable.companyName, companyName));
  return branding || null;
}

export async function upsertCompanyBranding(branding: typeof companyBrandingTable.$inferInsert) {
  return await db
    .insert(companyBrandingTable)
    .values(branding)
    .onConflictDoUpdate({
      target: companyBrandingTable.companyName,
      set: {
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        logoUrl: branding.logoUrl,
        formBackgroundColor: branding.formBackgroundColor,
        buttonColor: branding.buttonColor,
        buttonTextColor: branding.buttonTextColor,
      },
    })
    .returning();
}
