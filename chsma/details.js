import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const conditionDetail = new Schema({
    condition: {
        type: String, 
        required: true,
    },
    number: Number,
    note: String,
    email:String,
    timestamp: { type: Date, default: Date.now }
});

const conditionDetailSchema = new Schema({
    idOrder :  Schema.Types.ObjectId,
    conditions:[conditionDetail],
})


const DetailSchema =mongoose.model('ConditionDetail', conditionDetailSchema);

export default DetailSchema;