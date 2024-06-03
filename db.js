import mongoose from 'mongoose';

const uri = "mongodb+srv://ramadanmahdy52:dfgHRKMbTeQBuTJF@cluster0.q9vkaty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
