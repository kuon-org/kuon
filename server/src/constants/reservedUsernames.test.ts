import assert from "node:assert/strict";
import test from "node:test";
import {
  isReservedUsername,
  isValidUsernameFormat,
  normalizeUsername,
  sanitizeExternalUsername,
} from "./reservedUsernames.js";

test("normalizes username to lowercase and trims whitespace", () => {
  assert.equal(normalizeUsername("  Hiro-Ppe  "), "hiro-ppe");
});

test("accepts usernames between 4 and 16 characters", () => {
  assert.equal(isValidUsernameFormat("hiro"), true);
  assert.equal(isValidUsernameFormat("hiro_ppe-0409"), true);
  assert.equal(isValidUsernameFormat("abcdefghijklmnop"), true);
});

test("rejects usernames shorter than 4 or longer than 16 characters", () => {
  assert.equal(isValidUsernameFormat("abc"), false);
  assert.equal(isValidUsernameFormat("abcdefghijklmnopq"), false);
});

test("rejects symbols at the beginning or end and unsupported characters", () => {
  assert.equal(isValidUsernameFormat("-hiro"), false);
  assert.equal(isValidUsernameFormat("hiro_"), false);
  assert.equal(isValidUsernameFormat("hiro.ppe"), false);
  assert.equal(isValidUsernameFormat("ひろっぺ"), false);
});

test("reserved usernames are case insensitive", () => {
  assert.equal(isReservedUsername("ADMIN"), true);
  assert.equal(isReservedUsername("administrator"), false);
});

test("sanitizes external IdP usernames and rejects reserved results", () => {
  assert.equal(sanitizeExternalUsername("Hiro.Ppe"), "hiro-ppe");
  assert.equal(sanitizeExternalUsername("_Hiro_"), "hiro");
  assert.equal(sanitizeExternalUsername("ADMIN"), null);
});
