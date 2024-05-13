import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema({
  products: [
    { product_id: String }
  ],
  total: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);
export default OrderModel;