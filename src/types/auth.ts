export type AccountType = 'individual' | 'company';

export interface SignupData {
  step: number;
  accountType: AccountType;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  cities: string[];
  carsRange: string;
  bankAccount: string;
  ifscCode: string;
  upiId?: string;
}