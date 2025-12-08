const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

// Get database connection (lazy initialization)
const getDb = async () => {
  if (!db) {
    await client.connect();
    db = client.db("quran_tracker");
  }
  return db;
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
