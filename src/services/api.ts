import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { 
  LoginRequestDTO, LoginResponseDTO, Task, PagedResponse, Usuario, NotificationDocument 
} from '../types';

const hostUri = Constants.expoConfig?.hostUri?.split(':').shift();
const BASE_IP = hostUri || '192.168.0.83';

console.log(`[NETWORK] Conectando ao Backend no IP: ${BASE_IP}`);

const API_IAM_URL = `http://${BASE_IP}:8080/v1`;
const API_TASK_URL = `http://${BASE_IP}:8081/v1`;
const API_NOTIFICATION_URL = `http://${BASE_IP}:8082/v1`;

const iamApi = axios.create({ baseURL: API_IAM_URL, headers: { 'Content-Type': 'application/json' } });
export const taskApi = axios.create({ baseURL: API_TASK_URL, headers: { 'Content-Type': 'application/json' } });
export const notificationApi = axios.create({ baseURL: API_NOTIFICATION_URL, headers: { 'Content-Type': 'application/json' } });

const authInterceptor = async (config: any) => {
  try {
    const rawToken = await AsyncStorage.getItem('@TaskApp:token');
    
    if (rawToken) {
      const cleanToken = rawToken.replace(/["']/g, '').trim();
      
      config.headers.Authorization = `Bearer ${cleanToken}`;
      
    } else {
      console.warn(`[AUTH] NENHUM TOKEN ENCONTRADO PARA: ${config.url}`);
    }
  } catch (error) {
    console.error('[AUTH ERROR] Falha catastrófica ao ler storage:', error);
  }
  return config;
};

taskApi.interceptors.request.use(authInterceptor);
notificationApi.interceptors.request.use(authInterceptor);

export const authService = {
  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    const response = await iamApi.post<LoginResponseDTO>('/usuario/login', credentials);
    return response.data;
  },
  async register(data: any): Promise<Usuario> {
    const response = await iamApi.post<Usuario>('/usuario/register', data);
    return response.data;
  },
  async getAllUsers(params?: any): Promise<any> {
    const response = await iamApi.get<any>('/usuario/login', { params: { unPaged: true, ...params } });
    return response.data;
  }
};

export const taskService = {
  async getAll(params?: any): Promise<PagedResponse<Task>> {
    const response = await taskApi.get<PagedResponse<Task>>('/tasks', { params: { unPaged: false, ...params } });
    return response.data;
  },
  async create(tasks: Task[]): Promise<void> { await taskApi.post('/tasks', tasks); },
  async update(tasks: Task[]): Promise<void> { await taskApi.put('/tasks', tasks); },
  async delete(tasks: Task[]): Promise<void> { await taskApi.delete('/tasks', { data: tasks }); }
};

export const notificationService = {
  async getAll(params?: any): Promise<PagedResponse<NotificationDocument>> {
    const response = await notificationApi.get<PagedResponse<NotificationDocument>>('/notifications', { 
      params: { lida: false, unPaged: true, ...params } 
    });
    return response.data;
  },
  async update(notifications: any[]): Promise<void> {
    await notificationApi.put('/notifications', notifications);
  }
};

export default taskApi;