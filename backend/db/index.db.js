import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
	try {
		const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		console.log(`\n MongoDB connected Successfully !! DB HOST:${connectionInstance.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MONGODB", error.message);
		process.exit(1);
	}
};
export default connectDB