FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

RUN chmod +x gradlew
RUN ./gradlew bootJar -x test

EXPOSE 8080

CMD ["sh", "-c", "java -jar build/libs/*.jar"]