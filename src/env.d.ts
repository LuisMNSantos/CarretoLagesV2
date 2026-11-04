interface ImportMetaEnv {
  readonly PUBLIC_DESIGN_PREVIEW?: string;
  readonly PUBLIC_NOINDEX?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module '*.woff2?url' {
  const url: string;
  export default url;
}
