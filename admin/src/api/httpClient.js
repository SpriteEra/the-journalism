// import axios from "axios";
// import { handleRefreshToken, resetUser } from "./refreshToken";
// import { getUserFail } from "../redux/slices/user.slice";
// import store from "../redux/store";

// axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
// axios.defaults.withCredentials = true;

// // Variables to handle token refresh logic
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (token) {
//       prom.resolve(token);
//     } else {
//       prom.reject(error);
//     }
//   });
//   failedQueue = [];
// };

// axios.interceptors.request.use(
//   function (config) {
//     return config;
//   },
//   function (error) {
//     return Promise.reject(error);
//   }
// );

// axios.interceptors.response.use(
//   function (response) {
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response &&
//       error.response.status === 400 &&
//       originalRequest.url.includes("refresh-token")
//     ) {
//       // Refresh token request failed
//       store.dispatch(getUserFail("Refresh token failed"));
//       return Promise.reject(error);
//     }

//     if (
//       error.response &&
//       error.response.status === 401 &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;

//       if (isRefreshing) {
//         // Queue the request if a refresh token process is already ongoing
//         return new Promise((resolve, reject) => {
//           failedQueue.push({
//             resolve: (token) => {
//               originalRequest.headers["Authorization"] = `Bearer ${token}`;
//               resolve(axios(originalRequest));
//             },
//             reject: (err) => {
//               reject(err);
//             },
//           });
//         });
//       }

//       isRefreshing = true;

//       try {
//         const response = await handleRefreshToken();
//         const { accessToken, refreshToken } = response.data;

//         console.log("Token expired. Refreshing token...");
//         // Save new tokens in cookies
//         document.cookie = `accessToken=${accessToken};`;
//         document.cookie = `refreshToken=${refreshToken};`;

//         processQueue(null, accessToken);

//         // Retry the original request with the new access token
//         originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
//         return axios(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         store.dispatch(getUserFail("Refresh token failed"));
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axios;


import axios from "axios";
import { handleRefreshToken } from "./refreshToken";
import { getUserFail } from "../redux/slices/user.slice";
import store from "../redux/store";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;

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

// Always attach the token if we have one (works even when cookies are blocked)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the response has no config (network error / CORS), nothing to retry
    if (!originalRequest) return Promise.reject(error);

    const isRefreshCall = originalRequest.url?.includes("refresh-token");

    // The refresh request itself failed -> give up, don't queue/retry
    if (
      error.response &&
      [400, 401].includes(error.response.status) &&
      isRefreshCall
    ) {
      localStorage.removeItem("accessToken");
      store.dispatch(getUserFail("Refresh token failed"));
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;

      // A refresh is already running: wait for it, then retry
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await handleRefreshToken();
        const { accessToken } = response.data;

        localStorage.setItem("accessToken", accessToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
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