import test from "node:test";
import assert from "node:assert/strict";

function enqueue(logs, { taskId, title, queuedAt = "2026-09-22T00:00:00.000Z" }) {
  const next = logs.map(entry => entry.status === "待ち" && entry.taskId === taskId ? { ...entry, status: "置換" } : entry);
  return [{ id: `${taskId}-${queuedAt}`, taskId, title, queuedAt, scheduledAt: "2026-09-22T00:02:00.000Z", status: "待ち" }, ...next];
}

test("新しい変更は保存待ちキューに入る", () => {
  const logs = enqueue([], { taskId: "task-1", title: "買い物" });
  assert.equal(logs[0].status, "待ち");
  assert.equal(logs[0].title, "買い物");
  assert.equal(logs[0].scheduledAt, "2026-09-22T00:02:00.000Z");
});

test("同じ付箋紙の再変更は前回の待ちを置換する", () => {
  const first = enqueue([], { taskId: "task-1", title: "買い物" });
  const second = enqueue(first, { taskId: "task-1", title: "牛乳を買う" });
  assert.equal(second[0].status, "待ち");
  assert.equal(second[0].title, "牛乳を買う");
  assert.equal(second[1].status, "置換");
});

test("保存成功時は待ちを成功にできる", () => {
  const logs = enqueue([], { taskId: "task-1", title: "買い物" });
  const completed = logs.map(entry => ({ ...entry, status: "成功" }));
  assert.equal(completed[0].status, "成功");
});
