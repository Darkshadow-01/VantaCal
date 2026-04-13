export interface User {
  _id: string;
  userId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export interface UserKeys {
  _id: string;
  userId: string;
  encryptedMasterKey: string;
  salt: string;
  iv: string;
  recoveryEncryptedMasterKey?: string;
  recoverySalt?: string;
  recoveryIv?: string;
  createdAt: number;
  updatedAt: number;
}

export * from "@/convex/users/index";
export * from "@/convex/userKeys/index";