export interface VagalumeResult {
  id: string;
  song: string;
  artist: string;
  url: string;
  artistUrl: string;
}

interface VagalumeDoc {
  id: string;
  sing: string;
  url: string;
  art: {
    id: string;
    name: string;
    url: string;
  };
}

interface VagalumeResponse {
  type: string;
  doc?: VagalumeDoc;
  docs?: VagalumeDoc[];
}

export async function searchVagalume(
  song: string,
  artist: string
): Promise<VagalumeResult[]> {
  const params = new URLSearchParams({
    musica: song,
    ...(artist ? { art: artist } : {}),
    limit: "5",
  });

  const res = await fetch(
    `https://api.vagalume.com.br/search.php?${params.toString()}`
  );

  if (!res.ok) return [];

  const data: VagalumeResponse = await res.json();

  const docs: VagalumeDoc[] = [];
  if (data.doc) docs.push(data.doc);
  if (data.docs) docs.push(...data.docs);

  return docs.map((doc) => ({
    id: doc.id,
    song: doc.sing,
    artist: doc.art?.name ?? artist,
    url: `https://www.vagalume.com.br${doc.url}`,
    artistUrl: `https://www.vagalume.com.br${doc.art?.url ?? ""}`,
  }));
}
