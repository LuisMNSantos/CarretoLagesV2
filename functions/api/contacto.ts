// Cloudflare Pages Function: POST /api/contacto. Only published with the formulario and sanity plans
// (scripts/deploy-plan.mjs deploys base from inside dist/, without this folder).
import { createContactHandler, type ContactEnv } from '../../src/server/contact-handler';

const handle = createContactHandler({ fetch: (input, init) => fetch(input, init), now: () => Date.now() });

export const onRequestPost = ({ request, env }: { request: Request; env: ContactEnv }): Promise<Response> => handle(request, env);
