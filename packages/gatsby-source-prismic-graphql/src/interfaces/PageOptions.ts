export interface Data {
  [key: string]: any;
}
export interface PageOptions {
  pattern: string;
  component: string;
  customType?: string;
  context: { [key: string]: any };
  params: { data: Data; [key: string]: any | Data };
}
