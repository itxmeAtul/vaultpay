import mongoose from 'mongoose';

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Missing MONGO_URL in .env file');
    }

    await mongoose.connect(process.env.MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('🌍 Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    process.exit(1);
  }
}
