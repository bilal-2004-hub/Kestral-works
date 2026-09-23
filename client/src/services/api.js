import axios from 'axios';

/* One axios instance for the whole app. The access token lives in memory only;
   the refresh token is an httpOnly cookie the browser sends automatically. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

let accessToken = null;
let onSessionLost = () => {};

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const setSessionLostHandler = (fn) => { onSessionLost = fn; };

import { getCurrentUserToken } from '../firebase/auth.js';

api.interceptors.request.use(async (config) => {
  let token = accessToken;
  if (!token) {
    try {
      token = await getCurrentUserToken();
      if (token) accessToken = token;
    } catch {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* On a 401, try one silent refresh and replay the original request.
   Concurrent 401s share a single refresh call. */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.includes('/auth/');

    if (response?.status === 401 && !config?._retried && !isAuthCall) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || api.post('/auth/refresh');
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.data.accessToken);
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        onSessionLost();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/* Turns any failure into the message we actually want to show a person. */
export function readError(error) {
  if (error?.response?.data?.message) {
    return { message: error.response.data.message, fields: error.response.data.errors || {} };
  }
  if (error?.code === 'ECONNABORTED') return { message: 'That took too long. Check your connection and try again.', fields: {} };
  if (!error?.response && error?.message && !error.message.includes('fetch') && !error.message.includes('Network Error')) {
    return { message: error.message, fields: {} };
  }
  if (!error?.response) return { message: 'Cannot reach the server right now.', fields: {} };
  return { message: error?.message || 'Something went wrong. Please try again.', fields: {} };
}

export default api;
