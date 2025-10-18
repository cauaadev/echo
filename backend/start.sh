#!/bin/bash
# Navega para a pasta do backend
cd backend

# Limpa e constrói o projeto
./mvnw clean package -DskipTests

# Roda a aplicação
java -jar target/messenger-backend-0.0.1-SNAPSHOT.jar
