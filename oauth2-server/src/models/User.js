import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Never store or select plaintext passwords - only the bcrypt hash.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

// toJSON is the last line of defense against accidentally leaking the hash in an API response.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
