export class EventPath {
  static async hash(path: string) {
    const encoder = new TextEncoder();

    const splittedPath = path.split("/");

    const arrayBuffers = await Promise.all(
      splittedPath.map((part) =>
        globalThis.crypto.subtle.digest("SHA-1", encoder.encode(part))
      )
    );

    return arrayBuffers.map((part) => new Uint8Array(part));
  }
}
