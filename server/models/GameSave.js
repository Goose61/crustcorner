import mongoose from 'mongoose';

const gameSaveSchema = new mongoose.Schema(
  {
    wallet: { type: String, required: true, unique: true, index: true },
    state: { type: mongoose.Schema.Types.Mixed, required: true },
    clientUpdatedAt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GameSave = mongoose.model('GameSave', gameSaveSchema);
