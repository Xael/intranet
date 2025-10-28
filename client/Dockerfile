# Estágio 1: Build da aplicação
# Usamos uma imagem oficial do Node.js como base.
# 'alpine' é uma versão leve, ótima para builds rápidos.
FROM node:20-alpine AS build

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package*.json ./

# Instala as dependências do projeto
# O --frozen-lockfile garante que as versões exatas do package-lock.json sejam usadas
RUN npm install --frozen-lockfile

# Copia todo o resto do código-fonte da aplicação para o contêiner
COPY . .

# Executa o script de build (que será definido no seu package.json)
# Isso irá compilar o TypeScript/TSX e gerar os arquivos estáticos na pasta /dist
RUN npm run build

# Estágio 2: Servir a aplicação
# Usamos uma imagem leve do Nginx, um servidor web de alta performance.
FROM nginx:stable-alpine

# Copia os arquivos estáticos gerados no estágio de build para o diretório
# onde o Nginx serve os arquivos por padrão.
COPY --from=build /app/dist /usr/share/nginx/html

# Informa ao Docker que o contêiner escuta na porta 80
EXPOSE 80

# O comando padrão para iniciar o Nginx e manter o contêiner rodando
CMD ["nginx", "-g", "daemon off;"]
