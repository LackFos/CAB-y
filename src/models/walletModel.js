import { model, Schema } from "mongoose";

const walletSchema = new Schema(
  {
    user: { type: String, unique: true },
    items: { type: Array },
    isSubscriber: { type: Boolean },
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

walletSchema.virtual("investedCapital").get(function () {
  return this.items.reduce((total, item) => total + item.pricePerItem * item.quantity, 0);
});

const WalletModel = model("Wallet", walletSchema);

export default WalletModel;
