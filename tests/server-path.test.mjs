import test from "node:test";
import assert from "node:assert/strict";
import { decodeRequestPath } from "../server-path.mjs";

test("URLパスを安全にデコードし、クエリを除外する", () => {
  assert.equal(decodeRequestPath("/notes/%E3%81%82?view=board"), "/notes/あ");
});

test("不正なパーセントエンコードは例外でなく不正値として返す", () => {
  assert.equal(decodeRequestPath("/%E0%A4%A"), null);
});
