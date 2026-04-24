export interface IEventEncryptor {
  encrypt<T extends object>(data: T): Promise<EncryptedPayload>;
  decrypt<T>(payload: EncryptedPayload): Promise<T>;
}

export interface IKeyManager {
  hasMasterKey(): boolean;
  setMasterKey(key: CryptoKey): void;
  getMasterKey(): CryptoKey | null;
  clearMasterKey(): void;
  unlock(password: string, storage: MasterKeyStorage): Promise<boolean>;
  setup(password: string): Promise<SetupResult>;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt?: string;
}

export interface MasterKeyStorage {
  encryptedMasterKey: string;
  salt: string;
  iv: string;
  iterations: number;
  stretchingRounds?: number;
}

export interface SetupResult {
  success: boolean;
  recoveryPhrase?: string;
  storage?: MasterKeyStorage;
}

export interface IEncryptionPort {
  keyManager: IKeyManager;
  encryptor: IEventEncryptor;
  isAvailable(): boolean;
}