/** Build-time flags (see .env.example). Both default to "on" so a bare build is a safe preview. */
export const designPreview: boolean = import.meta.env.PUBLIC_DESIGN_PREVIEW !== 'false';
export const noindex: boolean = import.meta.env.PUBLIC_NOINDEX !== 'false';
