/**
 * Worker Cloudflare : reçoit le webhook Stripe "checkout.session.completed"
 * envoyé après le paiement d'un acompte, récupère la date de l'événement
 * (transmise via client_reference_id dans le lien Stripe) et met à jour
 * automatiquement data/unavailable-dates.json sur GitHub.
 *
 * Variables d'environnement attendues (voir SETUP.md) :
 * - STRIPE_WEBHOOK_SECRET
 * - GITHUB_TOKEN
 * - GITHUB_REPO       (ex: "cppcoaching/photobooth-site")
 * - GITHUB_BRANCH     (ex: "main")
 * - GITHUB_FILE_PATH  (ex: "data/unavailable-dates.json")
 */

const TOLERANCE_SECONDS = 5 * 60;

async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) return false;

  const parts = sigHeader.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isNaN(age) || age > TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expectedSig, signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function updateUnavailableDates(env, dateToAdd) {
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${env.GITHUB_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "booth-in-lyon-worker",
    Accept: "application/vnd.github+json"
  };

  const getRes = await fetch(`${apiUrl}?ref=${env.GITHUB_BRANCH}`, { headers });
  if (!getRes.ok) {
    throw new Error(`Lecture du fichier GitHub échouée (${getRes.status})`);
  }
  const fileData = await getRes.json();
  const content = JSON.parse(atob(fileData.content.replace(/\n/g, "")));

  content.dates = content.dates || [];
  if (content.dates.includes(dateToAdd)) {
    return { updated: false, reason: "date déjà présente" };
  }

  content.dates.push(dateToAdd);
  content.dates.sort();

  const newContentB64 = btoa(JSON.stringify(content, null, 2) + "\n");

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Réservation automatique : blocage du ${dateToAdd} (paiement Stripe confirmé)`,
      content: newContentB64,
      sha: fileData.sha,
      branch: env.GITHUB_BRANCH
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Écriture du fichier GitHub échouée (${putRes.status}) : ${errText}`);
  }

  return { updated: true, date: dateToAdd };
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = await request.text();
    const sig = request.headers.get("stripe-signature");

    const valid = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      return new Response("Signature Stripe invalide", { status: 400 });
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      return new Response("JSON invalide", { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      return new Response("Événement ignoré", { status: 200 });
    }

    const session = event.data.object;
    const dateRef = session.client_reference_id;

    if (!dateRef || !/^\d{4}-\d{2}-\d{2}$/.test(dateRef)) {
      // Paiement reçu mais aucune date valide associée : à traiter manuellement.
      return new Response("Paiement reçu, mais pas de date valide dans client_reference_id", { status: 200 });
    }

    try {
      const result = await updateUnavailableDates(env, dateRef);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error(err);
      return new Response(`Erreur : ${err.message}`, { status: 500 });
    }
  }
};
