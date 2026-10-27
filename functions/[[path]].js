// Tout le site est désormais servi par l'application Next.js (Worker « pepix », dépôt pepix-app).
// Cette fonction transmet chaque requête au Worker par une liaison de service (wrangler.toml) :
// l'adresse pepix.pages.dev ne change pas pour les visiteurs.
// Retour à l'ancien site statique : supprimer functions/ et wrangler.toml.
export const onRequest = ({ request, env }) => env.APP.fetch(request);
