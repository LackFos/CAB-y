import mongoose from "mongoose";

const connectToDatabase = async () => {
  try {
    const startTime = Date.now();
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_DB);
    console.log(
      `Database Connected, ${(new Date() - startTime).toLocaleString(
        "id-ID"
      )}MS\n`
    );
  } catch (error) {
    console.log("Unable to connect to the database.", error);
  }
};

export default connectToDatabase;
