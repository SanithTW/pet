import axios from 'axios';
import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig || Constants.manifest;
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || expoConfig?.extra?.apiUrl;

const api = axios.create({
  baseURL: apiUrl,
});

export const apiBaseUrl = apiUrl;

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
