import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow";

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is not defined");
}

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);

    // 개발 환경에서 쿼리 디버깅
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }

    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error("MongoDB 연결 오류:", error);
    throw error;
  }
}
