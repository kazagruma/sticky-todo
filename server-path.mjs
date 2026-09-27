export function decodeRequestPath(requestUrl) {
  const encodedPath = (requestUrl || "/").split("?")[0];

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}
