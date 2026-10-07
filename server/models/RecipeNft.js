import mongoose from 'mongoose';

const recipeNftSchema = new mongoose.Schema(
  {
    wallet: { type: String, required: true, index: true },
    cardId: { type: Number, required: true },
    recipeIndex: { type: Number, required: true },
    name: String,
    avg: Number,
    value: Number,
    reviews: Number,
    retired: { type: Boolean, default: false },
    mintedAt: { type: Date, default: Date.now },
    onChain: {
      mint: String,
      signature: String,
      network: String,
    },
  },
  { timestamps: true }
);

recipeNftSchema.index({ wallet: 1, recipeIndex: 1 });

export const RecipeNft = mongoose.model('RecipeNft', recipeNftSchema);
