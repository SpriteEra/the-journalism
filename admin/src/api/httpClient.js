import axios from "axios";
import { handleRefreshToken, resetUser } from "./refreshToken";
import { getUserFail } from "../redux/slices/user.slice";
import store from "../redux/store";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;

// Variables to handle token refresh logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

axios.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  function (response) {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 400 &&
      originalRequest.url.includes("refresh-token")
    ) {
      // Refresh token request failed
      store.dispatch(getUserFail("Refresh token failed"));
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request if a refresh token process is already ongoing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(axios(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await handleRefreshToken();
        const { accessToken, refreshToken } = response.data;

        console.log("Token expired. Refreshing token...");
        // Save new tokens in cookies
        document.cookie = `accessToken=${accessToken};`;
        document.cookie = `refreshToken=${refreshToken};`;

        processQueue(null, accessToken);

        // Retry the original request with the new access token
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(getUserFail("Refresh token failed"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
