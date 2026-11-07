import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: { projectId: '6e31nwsq', dataset: 'production' },
  studioHost: 'carretolages',
  deployment: { appId: 'e9b4fq7ugscwas1lwxd6v20r', autoUpdates: true },
});
