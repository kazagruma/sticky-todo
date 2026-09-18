const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=UTF-8",
    "cache-control": "no-store",
  },
});

export function onRequestGet({ request, env }) {
  const expectedToken = env.API_TOKEN;
  const receivedToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
    return json({ error: "unauthorized" }, 401);
  }

  return json({
    service: "sticky-todo",
    status: "ok",
    apiVersion: "v1",
  });
}
