FROM gcc:latest

WORKDIR /app

# Установка зависимостей
RUN apt-get update && apt-get install -y \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование исходного кода
COPY . .

# Компиляция
RUN g++ -o backend main.cpp -lssl -lcrypto -pthread

# Открываем порт
EXPOSE 8080

# Запуск приложения
CMD ["./backend"]
