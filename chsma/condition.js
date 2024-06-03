import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ordrSchema = new Schema({
    clientname: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    covernorate: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    productname: {
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
    productprece: {
        type: String,
        required: true
    },
    productorder: {
        type: String,
        required: true
    },
  
    commition: {
        type: String,
        required: true
    },
    total: {
        type: String,
        required: true
    },
    notes: {
        type: String,
    },
    imagePaths: [String],
    timestamp: {
        type: Date,
        default: Date.now
    },
    state : String,

   commitionreq : String,
});

const conditionDetailSchema = new Schema({
    name: String,
    code: Number,
    conditions: [ordrSchema]
});

const conditions = mongoose.model('condition', conditionDetailSchema);

export default conditions;
