#!/usr/bin/env node
// tools/hash-password.js
// Produces the CRM_PASSWORD_HASH value for Netlify. Run it, type the new
// password twice, then paste the printed line into the Netlify environment
// variable. The password itself is read from the terminal with echo off, so
// it never lands in shell history, in a process argument, or in this repo.
//
//   node tools/hash-password.js

const crypto = require("crypto");
const readline = require("readline");

const N = 16384; // ~16 MB and ~100 ms per guess — the point is to be slow
const r = 8;
const p = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write(question);
    rl._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function derive(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N, r, p, maxmem: MAXMEM }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

(async () => {
  const password = await askHidden("New CRM password: ");
  if (!password) {
    console.error("Nothing entered — aborted.");
    process.exit(1);
  }
  const again = await askHidden("Confirm password: ");
  if (password !== again) {
    console.error("Passwords did not match — aborted.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error(`\nWARNING: that password is ${password.length} characters.`);
    console.error("The old hash was public in this repo's history, so assume anything");
    console.error("guessable is already burned. Use a long passphrase or a generated one.\n");
  }

  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt);
  const stored = ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");

  console.log("Set these in Netlify → Site settings → Environment variables:\n");
  console.log("CRM_PASSWORD_HASH");
  console.log(stored);
  console.log("\nCRM_SESSION_KEY  (rotate this too — the old one never expires");
  console.log("and is still sitting in localStorage on every device that has logged in)");
  console.log(crypto.randomBytes(32).toString("base64url"));
  console.log("\nRedeploy is not required; functions read these at runtime.");
  console.log("Everyone will be signed out and will need the new password.");
})();
