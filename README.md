# 💬 Echo — Chat em tempo real
<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Em%20desenvolvimento-blue?style=for-the-badge" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React-61DBFB?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img alt="DB" src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
</p>

> Echo é uma aplicação full‑stack de chat em tempo real, pensada para oferecer comunicação fluida, segura e escalável. Frontend em React (Vite) e backend em Spring Boot com suporte a WebSockets, JWT e persistência em MySQL.

---

## Índice
- [Status atual](#status-atual)
- [Principais funcionalidades](#principais-funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Pré-requisitos](#pré-requisitos)
- [Configuração / Variáveis de ambiente](#configuração--variáveis-de-ambiente)
- [Como rodar localmente](#como-rodar-localmente)
- [Endpoints e WebSocket](#endpoints-e-websocket)
- [Testes](#testes)
- [Boas práticas de segurança](#boas-práticas-de-segurança)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)
- [Licença e contato](#licença-e-contato)

---

## Status atual
O projeto já possui as principais funcionalidades implementadas:
- Comunicação em tempo real via WebSocket (Spring WebSocket)
- Autenticação com JWT + armazenamento de senhas com BCrypt
- CRUD de mensagens, listagem de chats e gerenciamento de usuários
- Upload de avatares/imagens
- Integração básica de envio de e‑mail (Spring Mail)
- Frontend em Vite + React com consumo seguro da API

---

## Principais funcionalidades
- Mensagens em tempo real (WebSocket / STOMP)
- Autenticação e autorização (JWT + Spring Security)
- Persistência com Spring Data JPA e MySQL
- Upload e gerenciamento de imagens/avatares
- Endpoints REST para usuários, chats e mensagens
- UI responsiva em React (Vite)

---

## Tecnologias
- Front-end: React, Vite, Axios, CSS Modules
- Back-end: Java 21, Spring Boot 3.2.2, Spring Security, Spring Data JPA, Spring WebSocket
- Banco: MySQL (Connector/J 8.0.33)
- Autenticação: JWT (jjwt 0.11.5), BCrypt
- Utilitários: MapStruct, Lombok
- Build: Maven (backend), npm (frontend)

---

## Estrutura do repositório
- `/backend` — Aplicação Spring Boot (API REST, WebSocket, segurança, persistência)
- `/frontend` — Cliente web (Vite + React)
- `application.yml` — arquivo de configuração presente na raiz (ajuste conforme ambiente)
- Diretórios de IDE/build: `.idea`, `.vite`, `node_modules`, `target`

> Há um README com instruções específicas dentro de `/frontend/`.

---

## Pré-requisitos
- Java 21
- Maven
- Node.js 16+ / 18+
- npm ou yarn
- MySQL (local ou container)
- (Opcional) Docker & Docker Compose

---

## Configuração / Variáveis de ambiente (exemplos)
Ajuste o `application.yml` (ou crie um `application-local.yml`/variáveis de ambiente) para o backend:

Backend (exemplos)
- SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/echo_db
- SPRING_DATASOURCE_USERNAME=echo_user
- SPRING_DATASOURCE_PASSWORD=secret
- ECHO_JWT_SECRET=your_jwt_secret
- FILE_UPLOAD_PATH=./uploads
- spring.mail.host, spring.mail.username, spring.mail.password (se usar envio de e-mail)

Frontend (`frontend/.env` ou `.env.local`)
- VITE_API_BASE=http://localhost:8080/api

---

## Como rodar localmente

1) Clone
```bash
git clone https://github.com/cauaadev/echo.git
cd echo
```

2) Backend (Spring Boot)
```bash
# opcional: ajustar application.yml ou criar application-local.yml
cd backend

# rodar com Maven (se houver mvnw, prefira usar ./mvnw)
./mvnw spring-boot:run        # *se existir mvnw
# ou
mvn spring-boot:run
```

Para empacotar e rodar:
```bash
mvn package
java -jar target/*.jar
```

3) Frontend (Vite + React)
```bash
cd frontend
npm install
# ajuste .env com VITE_API_BASE apontando para a API
npm run dev
```
---

## Endpoints
REST (exemplos)
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/users
- GET  /api/chats
- GET  /api/messages
- POST /api/messages
- POST /api/uploads/avatar

## Testes
- Backend: `mvn -f backend/ test` (ou `./mvnw test`)
- Frontend: `npm test` (dependendo da configuração)
Recomenda-se ter testes de integração cobrindo autenticação, envio/recebimento via WebSocket e persistência.

---

## Boas práticas de segurança
- Use HTTPS em produção
- Não persistir JWTs em localStorage em produção — prefira cookies HttpOnly se possível
- Defina expiração e refresh tokens apropriados
- Proteja endpoints com roles/authorities bem definidas
- Restringir CORS apenas aos domínios necessários

---

## Roadmap (prioridades)
1. Notificações push
2. Sistema de grupos / canais
3. Painel administrativo (admin dashboard)
4. Melhorias UX/UI e acessibilidade
5. CI/CD, testes de integração e monitoramento

---

## Contribuição
1. Abra uma issue descrevendo o que pretende alterar
2. Faça um fork do repositório
3. Crie uma branch com prefixo `feature/` ou `fix/`
4. Envie PR com descrição clara e testes quando aplicável

---

## Licença
O repositório atualmente não possui licença definida

---

## Contato
Repositório: https://github.com/cauaadev/echo  
Autor: @cauaadev

---

Obrigado por conferir o Echo!
