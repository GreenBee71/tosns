# Stage 1: Build
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# Disable analytics
RUN flutter config --no-analytics

# Copy only pubspec first to leverage Docker cache for dependencies
COPY pubspec.yaml pubspec.lock* ./
RUN flutter pub get

# Copy the rest of the source code
COPY . .

# Build the web application (Optimization O2 to reduce memory usage during compilation)
RUN flutter build web --release

# Stage 2: Serve
FROM nginx:alpine

# Copy built files from Stage 1
COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
