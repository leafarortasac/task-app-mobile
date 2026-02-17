export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum TaskStatus {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA'
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

export interface LoginRequestDTO {
  email: string;
  senha: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface Task {
  id?: string;
  titulo: string;
  descricao: string;
  status: TaskStatus | string;
  dataCriacao: string;
  usuarioId: string;
}

export interface PagedResponse<T> {
  registros: T[];
  pagina: {
    totalPaginas: number;
    totalElementos: number;
  };
}

export interface AuthContextType {
  token: string | null;
  user: Usuario | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export enum NotificacaoStatus {
  INCLUSAO = 'INCLUSAO',
  ALTERACAO = 'ALTERACAO',
  CONCLUSAO = 'CONCLUSAO'
}

export interface Notification {
  id: string;
  taskId: string;
  usuarioId: string;
  titulo: string;
  mensagem: string;
  status: NotificacaoStatus | string;
  lida: boolean;
  dataNotificacao: string;
}

export interface NotificationDocument {
  notification: Notification;
}