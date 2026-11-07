// Builds one variant and publishes it to its own Pages project: `npm run deploy:plan -- <base|formulario|sanity>`.
// base is deployed from inside dist/ so the functions/ folder (the form endpoint) is not uploaded.
import { execFileSync } from 'node:child_process';
import { PLANS } from './plan-build.mjs';

const plan = process.argv[2];
if (!PLANS.includes(plan)) {
  console.error(`usage: npm run deploy:plan -- <${PLANS.join('|')}>`);
  process.exit(1);
}
const run = (args, cwd = '.') => execFileSync('npx', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

run(['astro', 'build', '--mode', plan]);
const project = `carretolages-${plan}`;
if (plan === 'base') run(['wrangler', 'pages', 'deploy', '.', '--project-name', project, '--branch', 'main'], 'dist');
else run(['wrangler', 'pages', 'deploy', 'dist', '--project-name', project, '--branch', 'main']);
