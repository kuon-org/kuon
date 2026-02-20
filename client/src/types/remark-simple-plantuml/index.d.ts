declare module "@akebifiky/remark-simple-plantuml" {
  interface RemarkSimplePlantumlOptions {
    baseUrl?: string;
  }

  type RemarkSimplePlantumlPlugin = (options?: RemarkSimplePlantumlOptions) => (
    tree: unknown,
    file: unknown
  ) => void;

  const remarkSimplePlantuml: RemarkSimplePlantumlPlugin;

  export default remarkSimplePlantuml;
}
