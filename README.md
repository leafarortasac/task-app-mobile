Mobile App - Task Management System 📱

Este é o aplicativo móvel do ecossistema de gerenciamento de tarefas, desenvolvido em React Native. Ele oferece uma experiência nativa para o usuário gerenciar atividades e receber notificações críticas em tempo real através de uma arquitetura orientada a eventos.

🚀 Tecnologias e Ferramentas

React Native & Expo/Bare Workflow: Desenvolvimento nativo multiplataforma.

React Navigation: Gestão de rotas (Login, Dashboard, Criação/Edição).

Context API: Gerenciamento de estado global e autenticação.

Axios: Comunicação com os microsserviços via REST com interceptores de segurança.

AsyncStorage: Persistência local segura para o token JWT e perfil do usuário.

MQTT (Paho/MQTT.js): Recebimento de notificações push em tempo real via protocolo leve.

Lucide React Native: Conjunto de ícones consistentes com a versão Web.

🛠️ Funcionalidades Implementadas

Autenticação Segura: Fluxo de Login e Registro com persistência de sessão.

Dashboard Dinâmico: Listagem de tarefas integrada ao cache do backend.

Gestão de Tarefas: Criação, edição e exclusão de atividades diretamente pelo dispositivo.

Central de Notificações Real-Time: Recebimento de alertas via MQTT com interface estilizada para visualização de detalhes e marcação de leitura.

📡 Configuração e Conectividade
O aplicativo está configurado para se comunicar com o backend através do IP local da máquina (Host).

IAM API: Autenticação e validação de tokens.

Task API: Gerenciamento das atividades.

MQTT Broker: Subscrição no tópico notificacoes/usuario/{id} para alertas instantâneos.

📦 Execução com Docker (Metro Bundler)

O ambiente do Mobile está integrado ao docker-compose.yml principal, servindo o Metro Bundler na porta 9000.

1. Iniciar via Docker

Bash

docker-compose up -d --build mobile-app

2. Conectar o Dispositivo

Com o container rodando, certifique-se de que o arquivo .env ou a constante de configuração aponte para o IP correto:

Snippet de código

API_URL=http://192.168.0.83:8080


MQTT_URL=ws://192.168.0.83:9001


🏗️ Diferenciais Técnicos

Resiliência de Token: Tratamento automático de erros 401 para garantir a sincronia da sessão.

Sincronia Total: O clique no sino de notificações força uma atualização no estado para garantir que o usuário veja apenas dados frescos.

Design Nativo: UI otimizada para Android e iOS com suporte a feedback tátil e carregamento assíncrono.
