// Parti comuni degli script che scaricano foto da Wikimedia Commons: pausa, richieste "educate" e tabella delle licenze aperte.
// Ogni script passa la propria intestazione generica (nessun dato personale nelle richieste).
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const LICENSE_URL = {
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 3.0 igo": "https://creativecommons.org/licenses/by-sa/3.0/igo/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/"
};

// Richieste che aspettano e riprovano quando il server risponde 429 o 503.
export function makeFetcher(UA) {
  const polite = async (u, opts = {}) => {
    for (let i = 0; i < 6; i++) {
      const r = await fetch(u, { ...opts, headers: { "User-Agent": UA } });
      if (r.status !== 429 && r.status !== 503) { if (!r.ok) throw new Error(`${r.status} ${u}`); return r; }
      const wait = (Number(r.headers.get("retry-after")) || 20 * (i + 1)) * 1000;
      console.log(`  ${r.status}: attendo ${Math.round(wait / 1000)} s`);
      await sleep(wait);
    }
    throw new Error(`troppi tentativi: ${u}`);
  };
  const j = async (u) => (await polite(u, {})).json();
  const get = async (u, out, fs) => { const r = await polite(u, { redirect: "follow" }); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); };
  return { polite, j, get };
}
