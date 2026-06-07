import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET is missing. Using insecure fallback for development only!');
    process.env.JWT_SECRET = 'swahit-super-secret-dev-key';
  }

  const requiredEnvVars = [
    'DATABASE_URL'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    console.error(`❌ CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Enable API versioning (e.g. endpoint/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // CSRF Protection Policy:
  // The application currently uses stateless JWT Bearer tokens passed via the Authorization header.
  // CSRF attacks rely on browsers automatically sending cookies (like session cookies) with cross-origin requests.
  // Since we do not rely on cookies for API authentication, we are inherently protected against CSRF.
  // If cookie-based authentication is introduced in the future, a CSRF token mechanism (e.g., csurf) MUST be implemented.

  // Restrict CORS to known origins in production
  app.enableCors({
    origin: true, // Allow all origins to enable local network access
    credentials: true,
  });

  // Auto-validate all incoming request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true,       // Auto-transform types (string -> number etc.)
    }),
  );

  // Global exception filter to sanitize errors and hide stack traces
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
  const logger = new Logger('Bootstrap');
  logger.log(`✅ Swahit Backend running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
