
export type DerivedKeyOptions = {
	version: '001';
	deriveKeyAlgorithm: 'PBKDF2';
	key: {
		iterations: 900_000;
		algorithm: 'AES-GCM';
		hash: 'SHA-256';
		salt: Uint8Array;
		length: 256;
	};
};

export type DerivedKeyJson = {
	key: JsonWebKey;
	options: DerivedKeyOptions;
};
