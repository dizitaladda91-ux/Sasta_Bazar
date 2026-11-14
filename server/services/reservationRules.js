export function getReservationLockKeys(email, ip) {
  return [`checkout-email:${email.toLowerCase()}`, `checkout-ip:${ip}`].sort();
}

export function hasReservationCapacity(emailCount, ipCount, limit = 3) {
  return emailCount < limit && ipCount < limit;
}
