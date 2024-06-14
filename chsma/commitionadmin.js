// models/User.js
import mongoose from 'mongoose';

const commitionschma  = new mongoose.Schema({
    commition: {
    type: String,
    required: true,
  
  },
  id: {
    type: String,
    required: true,
    unique: true
  }
});

const Commitionschma = mongoose.model('Commitionschma', commitionschma);
export default Commitionschma;