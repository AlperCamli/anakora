import { getDataClient, type DataClient } from "../client";
import { getLayout } from "./layout.service";
import { DEFAULT_LOCALE, type LayoutDTO, type Locale } from "../types";

// Alias service for callers that want explicit "site settings" semantics.
export async function getSiteSettings(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<LayoutDTO> {
  return getLayout(locale, client);
}
