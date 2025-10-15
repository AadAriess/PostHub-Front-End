export interface Address {
  street: string;
  city: string;
  country: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  address: Address | null;
}

// Tipe untuk respons mutasi update user
export interface UpdateUserResponse {
  updateUser: {
    id: string;
    firstName: string;
    age: number;
    address: Address | null;
  };
}
