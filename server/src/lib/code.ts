import { randomInt } from "node:crypto";

// No vowels (avoids accidental words) and no look-alike characters, since
// codes get read aloud and retyped from a shared link.
const ALPHABET = "bcdfghjkmnpqrstvwxyz23456789";

function block(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** Generates a Meet-style code, e.g. `kfx-mtqd-rwp`. */
export function generateMeetingCode(): string {
  return `${block(3)}-${block(4)}-${block(3)}`;
}
