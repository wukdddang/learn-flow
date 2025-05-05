import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../mongodb";

export const adapter = MongoDBAdapter(clientPromise);
