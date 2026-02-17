# Estágio de desenvolvimento do Metro Bundler
FROM node:20-alpine
WORKDIR /app

# Instalação de dependências do sistema para o React Native
RUN apk add --no-cache bash git

# Instalação de dependências do projeto
COPY package*.json ./
RUN npm install --frozen-lockfile || npm install

# Copia o restante do código
COPY . .

# Configuração de fuso horário para Manaus
RUN apk add --no-cache tzdata
ENV TZ=America/Manaus

# Porta para o Metro Bundler
EXPOSE 9000

# Variáveis para o React Native encontrar o IP correto (Substitua se seu IP mudar)
ENV REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.83

# Comando otimizado para Expo no Docker
# --port 9000: Define a porta solicitada
# --lan: Força o modo Local Area Network (fundamental para o Docker)
# --clear: Limpa o cache do Metro Bundler em cada subida
CMD ["npx", "expo", "start", "--port", "9000", "--lan", "--clear"]