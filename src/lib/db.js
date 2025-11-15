import mongoose from 'mongoose';
let MongoMemoryServerInstance = null;

const USE_INMEMORY_DB = process.env.USE_INMEMORY_DB === 'true';
const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/book-trading-club';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_LOCAL_URI;

// No-op error when using in-memory; otherwise enforce URI presence
if (!USE_INMEMORY_DB && !MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // If using in-memory MongoDB for local development
    if (USE_INMEMORY_DB) {
      cached.promise = (async () => {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!MongoMemoryServerInstance) {
          MongoMemoryServerInstance = await MongoMemoryServer.create();
        }
        const uri = MongoMemoryServerInstance.getUri();
        const conn = await mongoose.connect(uri, opts);
        return conn;
      })();
    } else {
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
