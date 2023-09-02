const mongoose = require("mongoose");
require("dotenv").config();

/** mongoose schema */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const exerciseLogSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Default to the current date if not provided
  },
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseLogSchema],
});

// Define a virtual property 'count' based on the length of 'log' array
userSchema.virtual('count').get(function () {
  return this.log.length;
});

const User = mongoose.model('User', userSchema);
const Exercise =  mongoose.model('Exercise', exerciseLogSchema);
/**EXPORTS */
exports.User = User;
exports.Exercise = Exercise