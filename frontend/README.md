# Messenger Frontend (Vite + React)

Projeto frontend minimal, profissional e orientado a consumo seguro da API.

## Como usar localmente

1. Extraia o ZIP e entre na pasta do projeto:
```powershell
cd messenger-frontend
npm install
# configure .env com VITE_API_BASE apontando para sua API (usar https)
npm run dev
```

2. Endpoints esperados (exemplo):
- POST /auth/login -> { token: "JWT" } (ou configure seu backend para cookies HttpOnly)
- GET /messages -> [ { id, author, text, from } ]
- POST /messages -> cria mensagem e retorna objeto criado

## Segurança
- O frontend adiciona `Authorization: Bearer <token>` automaticamente se token estiver em localStorage.
- Recomendamos usar HttpOnly cookies no backend para maior segurança e evitar armazenamento de token no localStorage.
- Configure CORS no backend apenas para domínios confiáveis e use HTTPS em produção.

## Ajustes
- Para trocar a base da API, atualize `.env` (VITE_API_BASE) antes de rodar `npm run dev`.
