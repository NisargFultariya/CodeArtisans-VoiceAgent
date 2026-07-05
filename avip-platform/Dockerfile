# Build: docker build --build-arg MODULE=platform-api -t avip-platform-api .
#        docker build --build-arg MODULE=platform-worker -t avip-platform-worker .
ARG MODULE=platform-api

FROM node:22-bookworm-slim AS web
WORKDIR /web
COPY platform-web/package.json ./
RUN npm install
COPY platform-web/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk-jammy AS build
ARG MODULE
WORKDIR /src

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY platform-api/build.gradle.kts ./platform-api/
COPY platform-marketing/build.gradle.kts ./platform-marketing/
COPY platform-worker/build.gradle.kts ./platform-worker/
COPY platform-workflow/build.gradle.kts ./platform-workflow/
COPY platform-api/src ./platform-api/src
COPY platform-marketing/src ./platform-marketing/src
COPY platform-worker/src ./platform-worker/src
COPY platform-workflow/src ./platform-workflow/src
COPY --from=web /web/dist ./platform-api/src/main/resources/static

RUN chmod +x gradlew \
    && sed -i 's/\r$//' gradlew \
    && ./gradlew :${MODULE}:bootJar -x test -PskipWebBuild --no-daemon

FROM eclipse-temurin:25-jre-jammy
ARG MODULE
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/${MODULE}/build/libs/*.jar /app/app.jar

USER nobody
EXPOSE 3000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
