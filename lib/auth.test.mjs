// Quick verification of auth logic
import { validateEmail, hashPassword } from "./auth.ts";

function runTests() {
  console.log("Running Auth Unit Tests...");

  // 1. Email validation
  if (!validateEmail("test@example.com")) throw new Error("test@example.com should be valid");
  if (!validateEmail("user.name+tag@domain.co.id")) throw new Error("complex email should be valid");
  if (validateEmail("not-an-email")) throw new Error("not-an-email should be invalid");
  if (validateEmail("@missing-user.com")) throw new Error("@missing-user.com should be invalid");
  if (validateEmail("no-domain@")) throw new Error("no-domain@ should be invalid");
  console.log("✓ Email validation passed");

  // 2. Hash password
  const hash1 = hashPassword("secret123");
  const hash2 = hashPassword("secret123");
  const hash3 = hashPassword("secret124");
  if (hash1 !== hash2) throw new Error("Identical passwords must produce identical hashes");
  if (hash1 === hash3) throw new Error("Different passwords must produce different hashes");
  console.log("✓ Password hashing passed");

  console.log("All Auth Unit Tests Passed Successfully!");
}

runTests();
