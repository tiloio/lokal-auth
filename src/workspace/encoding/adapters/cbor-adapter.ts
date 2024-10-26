import type { CborType } from "jsr:@std/cbor@0.1.2/types";
import { decodeCbor } from "jsr:@std/cbor@0.1.2/decode-cbor";
import { encodeCbor } from "jsr:@std/cbor@0.1.2/encode-cbor";
import type { EncodingAdapter } from "./encoding-adapter.types.ts";

export class CborAdapter implements EncodingAdapter<{ [k: string]: CborType }> {
  encode<T extends { [k: string]: CborType }>(data: T): Uint8Array {
    return encodeCbor(data);
  }

  decode(data: Uint8Array) {
    return decodeCbor(data) as unknown;
  }
}
