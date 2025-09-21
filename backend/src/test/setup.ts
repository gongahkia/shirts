import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.VECTOR_DB_PATH = './test-data/vector_db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.UPLOAD_DIR = './test-uploads';
process.env.LOG_LEVEL = 'error';