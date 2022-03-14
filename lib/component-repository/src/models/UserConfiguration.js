const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serverParamSchema = new Schema({
  componentId: {
    type: Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  cfg: {
    otherServer: {
      type: String,
    },
  },
});

const secretSchema = new Schema({
  componentId: {
    type: Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  secretId: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
});

// Define schema
const userConfig = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Configuration requires a User Id'],
    },
    serverParams: {
      type: [serverParamSchema],
    },
    secrets: {
      type: [secretSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserConfig', userConfig);
