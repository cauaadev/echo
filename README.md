# Echo

Echo é uma plataforma de mensageria fullstack, criada para proporcionar uma experiência de comunicação ágil, segura e moderna, conectando pessoas de forma eficiente.

## Funcionalidades principais
- Mensagens em tempo real (planejado via WebSocket)
- Autenticação e segurança via JWT
- Registro e login de usuários
- Criação e listagem de mensagens
- Listagem de chats e gerenciamento de usuários
- Upload de avatares e imagens
- Interface moderna e responsiva (Vue.js / React)

## Tecnologias
- Frontend: Vue.js, React, TailwindCSS (ou outro framework CSS moderno)
- Backend: Java, Spring Boot, Spring Data JPA, Spring Security
- Banco de dados: MySQL
- Autenticação: JWT (JSON Web Token)
- Hash de senhas: BCrypt

## Arquitetura (visão geral)
O projeto está organizado com separação clara entre frontend e backend:
- /backend — Spring Boot (REST API, autenticação, persistência)
- /frontend-vue — client Vue.js (ou /frontend-react para React)
- Arquivos estáticos, uploads e configurações separadas por módulo

## Convenções
- Código em inglês (funções, variáveis, endpoints)
- Nomenclatura: camelCase para Java e JavaScript/TypeScript
- Padrões: separação de camadas (controller, service, repository) no backend

## Pré-requisitos
- Java 17+ (ou conforme build)
- Maven ou Gradle
- Node 18+ e npm ou yarn
- MySQL (ou container Docker)
- (Opcional) Docker e Docker Compose

## Instalação rápida (exemplo local)

1. Clone o repositório
   git clone https://github.com/cauaadev/echo.git
   cd echo

2. Backend
   - Copie o arquivo de configuração de exemplo:
     cp backend/src/main/resources/application.example.properties backend/src/main/resources/application.properties
   - Ajuste as variáveis de conexão com o MySQL e a secret do JWT no `application.properties`:
     spring.datasource.url=jdbc:mysql://localhost:3306/echo_db
     spring.datasource.username=echo_user
     spring.datasource.password=secret
     echo.jwt.secret=your_jwt_secret
   - Executar:
     ./mvnw -f backend/ spring-boot:run
     ou
     mvn -f backend/ spring-boot:run

3. Frontend (Vue / React)
   - Entre na pasta do frontend:
     cd frontend-vue
     npm install
     npm run dev
   - ou para React:
     cd frontend-react
     npm install
     npm start

## Banco de dados
- Crie a base de dados MySQL (ex.: echo_db).
- Sugestão: usar Flyway ou Liquibase para migrations. Se não houver migrations, execute o script SQL em /backend/db/schema.sql (se disponível).

## Variáveis de ambiente (exemplos)
- JWT_SECRET (echo.jwt.secret)
- SPRING_DATASOURCE_URL
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD
- FILE_UPLOAD_PATH

## Segurança
- Autenticação stateless com JWT.
- Senhas armazenadas com BCrypt.
- Pontos a checar: expiração de token, refresh tokens (se implementar), revogação de tokens.

## Documentação da API
- Se Swagger/ OpenAPI estiver configurado, será acessível em:
  /swagger-ui.html ou /swagger-ui/index.html
- Endpoints principais (exemplos):
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/users
  - GET /api/chats
  - POST /api/messages
  - POST /api/uploads/avatar

## Testes
- Backend: mvn test (ou ./mvnw test)
- Frontend: npm test (dependendo do setup)
- Recomenda-se implementar testes de integração para endpoints críticos e mocks para serviços externos.

## Roadmap
- Implementação de chat em tempo real com WebSocket
- Notificações push
- Sistema de grupos e canais
- Painel administrativo para gerenciamento de usuários
- Melhorias UX/UI e acessibilidade

## Como contribuir
- Abra uma issue para discutir grandes mudanças
- Faça fork e crie uma branch com prefixo `feature/` ou `fix/`
- Envie PR com descrição clara e testes quando aplicável
- Siga as convenções de código e inclua changelog/commit claro

## Licença
Atualmente não há licença definida. Recomenda-se adicionar uma licença (por exemplo MIT) para deixar claro o uso permitido.

## Contato
Repositório: https://github.com/cauaadev/echo
Autor: @cauaadev
