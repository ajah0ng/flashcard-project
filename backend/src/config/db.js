import mongoose from "mongoose"

export const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Mongo connected successfully")
    } catch (error) {
        console.log("Error connecting to MongoDb", error)
        throw error
    }
}
