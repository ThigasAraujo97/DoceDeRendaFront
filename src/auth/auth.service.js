import api from "../services/api.js";
import jwtDecode from "jwt-decode";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export async function register(email, password) {
  const res = await api.post("/api/auth/register", { Email: email, Password: password });
  return res.data;
}

export async function login(email, password) {
  const res = await api.post("/login", { Email: email, Password: password });
  // Accept token from multiple possible fields to be tolerant with backend responses
  const token = res.data?.token || res.data?.Token || res.data?.access_token || res.data?.accessToken || res.data?.data?.token;
  if (!token) throw new Error("No token returned");
  localStorage.setItem(TOKEN_KEY, token);
  // also set a generic `token` key for compatibility with other code that expects it
  try { localStorage.setItem("token", token); } catch (e) {}
  let decoded = decodeToken(token) || {};
  // If the token payload doesn't include a username, use API response fields as fallback
  try {
    if (!decoded || Object.keys(decoded).length === 0) decoded = {};
    if (res.data?.userName && !decoded.userName) decoded.userName = res.data.userName;
    if (res.data?.UserName && !decoded.UserName) decoded.UserName = res.data.UserName;
    if (res.data?.email && !decoded.email) decoded.email = res.data.email;
  } catch (e) {
    // ignore
  }
  localStorage.setItem(USER_KEY, JSON.stringify(decoded));
  return decoded;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}
