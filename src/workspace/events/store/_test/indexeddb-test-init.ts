// indexeddb polyfill
import "npm:fake-indexeddb@6.0.0/auto";
import { IDBFactory } from "npm:fake-indexeddb@6.0.0";

declare global {
    let indexedDB: typeof IDBFactory;
}

export function testInitIndexedDB() {
    indexedDB = new IDBFactory();
}
