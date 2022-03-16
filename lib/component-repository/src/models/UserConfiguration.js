const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Define schema
const userConfiguration = new Schema(
  {
    componentId: {
      type: Schema.Types.ObjectId,
      ref: 'Component',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Configuration requires a User Id'],
    },
    configuration: {
        type: Schema.Types.Mixed,
    },
    secretsIds: {
      type: [Schema.Types.ObjectId],
      required: true,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model('UserConfig', userConfiguration);
