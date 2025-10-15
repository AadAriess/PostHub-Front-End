// --- TIPE INPUT UNTUK REGISTER ---
interface AddressInput {
  street: string;
  city: string;
  country: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  address: AddressInput;
}

// --- TIPE RESPONSE (DATA) UNTUK REGISTER ---
export interface RegisterResponse {
  register: {
    token: string;
    user: {
      id: string;
      email: string;
      address: AddressInput;
      firstName: string;
    };
  };
}

// --- TIPE RESPONSE (DATA) UNTUK LOGIN ---
export interface LoginResponse {
  login: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
    };
  };
}
