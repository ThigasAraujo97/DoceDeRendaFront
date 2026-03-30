const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  try {
    if (typeof input === "string") {
      let url = input;
      if (url.startsWith("/api/")) url = API_BASE + url;
      return originalFetch(url, init);
    }

    // when input is a Request object
    const req = input;
    let url = req.url || "";
    if (url.startsWith("/api/")) url = API_BASE + url;
    const newReq = new Request(url, req);
    return originalFetch(newReq, init);
  } catch (e) {
    return originalFetch(input, init);
  }
};

// patch window.open so links that open API endpoints also use the base
const originalOpen = window.open.bind(window);
window.open = (url, target, features) => {
  try {
    if (typeof url === "string" && url.startsWith("/api/")) {
      url = API_BASE + url;
    }
  } catch (e) {
    // ignore
  }
  return originalOpen(url, target, features);
};

export {};
