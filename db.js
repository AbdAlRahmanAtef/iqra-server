const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI environment variable is not set!");
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false, // Disabled for serverless compatibility
    deprecationErrors: true,
  },
});

let cachedDb = null;
let connectionPromise = null;

// Get database connection (lazy initialization with caching for serverless)
const getDb = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  // If already connecting, wait for that connection
  if (connectionPromise) {
    await connectionPromise;
    return cachedDb;
  }

  // Start connecting
  connectionPromise = client.connect();

  try {
    await connectionPromise;
    cachedDb = client.db("quran_tracker");
    console.log("Connected to MongoDB");
    return cachedDb;
  } catch (error) {
    connectionPromise = null;
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

// Helper function to get a collection
const getCollection = async (collectionName) => {
  const database = await getDb();
  return database.collection(collectionName);
};

// Export helpers
module.exports = {
  getDb,
  getCollection,
  ObjectId,
  client,
};
