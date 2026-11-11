# One container = React frontend + Spring Boot backend (for Google Cloud Run)

# 1) Build the React app
FROM node:22 AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npx vite build --outDir /app/web-dist

# 2) Build the Spring Boot jar with the React files inside (served at /)
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /api
COPY backend/pom.xml .
RUN mvn -q -Pgcp dependency:go-offline
COPY backend/src ./src
COPY --from=web /app/web-dist ./src/main/resources/static
RUN mvn -q -Pgcp -DskipTests package

# 3) Small runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=api /api/target/eduboard.jar app.jar
ENV SPRING_PROFILES_ACTIVE=mysql
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
