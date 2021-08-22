import {
  Format,
  listFormat,
  parseDuration,
  parseNumber,
  print,
  round,
} from "../../src/utilities/Util";
import { expect, test } from "@jest/globals";

test("Percent format", () => {
  const num = 1.123123;
  const result = print(num, Format.Percent);
  expect(result).toBe("112.31%");
});

test("Dollar format", () => {
  const num = 1.123123;
  const result = print(num, Format.Dollar);
  expect(result).toBe("$1.12");
});

test("Integer format", () => {
  const result = print(1.123123, Format.Integer);
  expect(result).toBe("1");

  const result2 = print(1.523123, Format.Integer);
  expect(result2).toBe("2");
});

test("Parse duration", () => {
  const duration = parseDuration("I want the time parsed for 16d 21h 43m 4s 455ms 803x please!");
  expect(duration.asMilliseconds()).toBe(1460584455);
});

test("Rounding", () => {
  const result = round(1.499);
  expect(result).toBe(1.5);

  const result2 = round(1.494);
  expect(result2).toBe(1.49);
});

test("Parse number", () => {
  expect(parseNumber("$400,123.349")).toBe(400123.35);
  expect(parseNumber("Not a number 1")).toBe(undefined);
  expect(parseNumber("-$2345.")).toBe(-2345);
  expect(parseNumber("4,560.5%")).toBe(45.61);
  expect(parseNumber("+$3")).toBe(3);
});

test("List format", () => {
  const list1 = ["apple", "banana", "camera"];
  expect(listFormat(list1)).toBe("apple, banana, and camera");

  const list2 = ["liberty", "death"];
  expect(listFormat(list2, "or")).toBe("liberty or death");
});
