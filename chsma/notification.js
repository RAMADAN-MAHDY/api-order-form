// notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    message: String,
    timestamp: { type: Date, default: Date.now },
    seenBy: [String], // Array of user IDs who have seen the notification
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
