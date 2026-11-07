import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

export default defineConfig({
  name: 'carretolages',
  title: 'Carreto Lages & Associados',
  projectId: '6e31nwsq',
  dataset: 'production',
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // Settings is a single document: no "new settings" in the create menu.
    templates: (templates) => templates.filter((t) => t.schemaType !== 'settings'),
  },
  document: {
    actions: (actions, ctx) => (ctx.schemaType === 'settings' ? actions.filter((a) => !['duplicate', 'delete', 'unpublish'].includes(a.action ?? '')) : actions),
  },
});
