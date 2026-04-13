export interface User {
  _id: string;
  userId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}