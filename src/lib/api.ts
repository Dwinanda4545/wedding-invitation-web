import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8000'

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
  
  // Add this interceptor to manually attach the CSRF token
  api.interceptors.request.use(config => {
    // Read the XSRF-TOKEN cookie
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    let token = '';
    
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        token = c.substring(name.length, c.length);
        break;
      }
    }
  
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
  });

export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
}
