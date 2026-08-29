export type ProfileLanguage = 'TR' | 'EN' | 'AR' | 'RU';

export type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  preferredLanguage: ProfileLanguage | null;
  preferredCurrency: string | null;
  createdAt: string;
  roles: string[];
};

export type UpdateProfile = Pick<
  Profile,
  'fullName' | 'phone' | 'preferredLanguage' | 'preferredCurrency'
>;
