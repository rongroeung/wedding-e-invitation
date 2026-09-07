/** Password policy and hashing for the admin accounts. */
import bcrypt from "bcryptjs";
import { z } from "zod";

/** The work factor the seeded account was created with; keep them in step. */
const BCRYPT_ROUNDS = 12;

/**
 * Ten characters, no composition rules.
 *
 * Length is what actually resists guessing; forcing a symbol and a digit mostly
 * produces `Password1!` and a note on a monitor.
 */
export const passwordRule = z
  .string()
  .min(10, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ១០ តួអក្សរ")
  .max(200);

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
