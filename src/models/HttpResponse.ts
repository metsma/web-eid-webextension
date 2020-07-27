import { CertificateInfo } from "./Browser/WebRequest";
import TypedMap from "./TypedMap";

export default interface HttpResponse<T> {
  readonly certificateInfo?: CertificateInfo | null;
  readonly body: T;
  readonly headers: TypedMap<string>;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
}
