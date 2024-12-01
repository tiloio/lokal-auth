// deno-lint-ignore no-explicit-any
export interface EventEncodingAdapter<Extends = any> {
    encode<T extends Extends>(data: T): Uint8Array;
    decode(data: Uint8Array): unknown;
}
