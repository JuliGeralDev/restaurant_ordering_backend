export function maskPII(data: any): any {
  if (!data) return data;

  const clone = JSON.parse(JSON.stringify(data));

  if (clone.email) {
    const [user, domain] = clone.email.split('@');
    clone.email = `${user[0]}***@${domain}`;
  }

  if (clone.phone) {
    const last4 = clone.phone.slice(-4);
    clone.phone = `*******${last4}`;
  }

  return clone;
}