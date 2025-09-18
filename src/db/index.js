import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected")
    } catch (error) {
        console.error("❌ MongoDB connection error", error);
        process.exit(1);
    }
};

export default connectDB;










/* Mongoose is ODM(object Data Modeling) library serving as bridge between application and mongoDB DataBase. 
We use MongoDB Atlas which is an online service that helps to get an instance of MongoDB from their online URL
One thing to remember while working with DataBase the database may throw an error and database is on another continent so it will take some time to connect*/