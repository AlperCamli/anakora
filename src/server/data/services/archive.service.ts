import { getDataClient, type DataClient } from "../client";
import { DEFAULT_LOCALE, type ArchiveDTO, type Locale } from "../types";
import { getProgramsList } from "./programs.service";

export async function getArchive(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<ArchiveDTO> {
  const cards = await getProgramsList(
    locale,
    {
      statuses: ["completed"],
    },
    client,
  );

  if (cards.length === 0) {
    return {
      locale,
      years: [],
      totalPrograms: 0,
    };
  }

  const byYear = cards.reduce<Record<number, typeof cards>>((acc, card) => {
    const year = new Date(card.startsAt).getUTCFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(card);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map((key) => Number(key))
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      programs: byYear[year],
    }));

  return {
    locale,
    years,
    totalPrograms: cards.length,
  };
}
