// Rebuilds the site every morning so new YouTube uploads appear on MFTV.
// Needs an environment variable NETLIFY_BUILD_HOOK in Netlify (a build hook URL).
export default async () => {
  const hook = process.env.NETLIFY_BUILD_HOOK;
  if (!hook) {
    console.log("NETLIFY_BUILD_HOOK is not set, skipping the daily rebuild.");
    return;
  }
  const res = await fetch(hook, { method: "POST", body: "{}" });
  console.log(`Daily rebuild requested: ${res.status}`);
};

export const config = { schedule: "17 6 * * *" };
