export type ResponseFormat = "html" | "png";

export type BlockResource = "image" | "javascript" | "video";

export type ClearContent = "js" | "css";

export interface NameValuePair {
  name: string;
  value: string;
}

export interface WebUnblockerRequestInput {
  target_url: string;
  response_format?: ResponseFormat;
  js_render?: boolean;
  country?: string;
  block_resources?: BlockResource[];
  clear?: ClearContent[];
  wait_ms?: number;
  wait_selector?: string;
  headers?: NameValuePair[];
  cookies?: NameValuePair[];
  follow_redirects?: boolean;
}

export interface WebUnblockerResult {
  status: number;
  contentType: string;
  responseHeaders: Record<string, string>;
  bytes: number;
  bodyText?: string;
  bodyBase64?: string;
  bodyTruncated: boolean;
}
