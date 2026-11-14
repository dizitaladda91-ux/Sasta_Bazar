import bcrypt from 'bcryptjs';

export const DUMMY_PASSWORD_HASH = '$2a$12$vY4d2EKFN54KORvQmgrmyObLoi29E7a1BcbrO0m4LcShAZzlFohmS';

export async function verifyPassword(password, passwordHash, compare = bcrypt.compare) {
  const matches = await compare(password, passwordHash || DUMMY_PASSWORD_HASH);
  return Boolean(passwordHash) && matches;
}
