const mongoose = require('mongoose');
const { AUTH_TYPE } = require('../../constants');

const Schema = mongoose.Schema;

const TYPES = {
  TEXT: 'TEXT',
  JSONATA: 'JSONATA',
  INPUT_FIELD: 'INPUT_FIELD',
  LOOKUP: 'LOOKUP',
  USER_INPUT: 'USER_INPUT',
};

const mapperDefaultSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.keys(TYPES),
      required: true,
    },
  },
  {
    _id: false,
    discriminatorKey: 'type',
  },
);

const DefaultModel = mongoose.model('MapperDefault', mapperDefaultSchema);

const LOOKUPTYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
}

const lookupSchema = new Schema({
  data: {
    componentId: { type: String, required: true },
    functionName: { type: String, required: true },
    keyPath: { type: String, required: true },
    labelPath: { type: String, required: true },
    parameterName: { type: String, required: true },
    type: { type: String, enum: Object.values(LOOKUPTYPES), default: LOOKUPTYPES.SINGLE, required: true },
  },
});

const userInputSchema = new Schema({
  data: {
    parameterName: {
      type: String,
      required: true,
    },
  },
});

const defaultSchema = new Schema({
  data: {
    value: {
      type: String,
      required: true,
    },
  },
});

const TYPES_MODELS = {
  TEXT: DefaultModel.discriminator(TYPES.TEXT, defaultSchema),
  JSONATA: DefaultModel.discriminator(TYPES.JSONATA, defaultSchema),
  INPUT_FIELD: DefaultModel.discriminator(TYPES.INPUT_FIELD, defaultSchema),
  LOOKUP: DefaultModel.discriminator(TYPES.LOOKUP, lookupSchema),
  USER_INPUT: DefaultModel.discriminator(TYPES.USER_INPUT, userInputSchema),
};

const customValidate = (mapper) => {
  if (mapper) {
    Object.keys(mapper).forEach((key) => {
      const currentField = mapper[key];
      if (currentField.type) {
        if (!TYPES_MODELS[currentField.type]) {
          throw new Error(
            `${key}##Path  \`type\` can only be ${Object.keys(TYPES_MODELS)}.`,
          );
        }
        const fieldModel = new TYPES_MODELS[currentField.type](currentField);
        const validations = fieldModel.validateSync();
        if (validations) {
          const errorKeys = Object.keys(validations.errors);
          const property = key;
          const message = validations.errors[errorKeys[0]].message;
          throw new Error(`${property}##${message}`);
        }
      } else {
        throw new Error(`${key}##Path  \`type\` is required.`);
      }
    });
  }
  return true;
};

const node = new Schema(
  {
    id: {
      type: String,
      required: [true, 'Flow Template nodes require an id.'],
    },
    componentId: {
      type: mongoose.Types.ObjectId,
      required: [true, 'Flow Template nodes require a componentId.'],
    },
    virtualComponentId: {
      type: String,
      description: 'The virtual component id',
    },
    function: {
      type: String,
      required: [true, 'Flow Template nodes require a function.'],
    },
    name: { type: String },
    credentials_id: { type: mongoose.Types.ObjectId },
    description: { type: String },
    fields: {},
    nodeSettings: {},
    tenant: { type: String },
    authorization: {
      authType: {
        type: String,
        enum: Object.keys(AUTH_TYPE),
      },
      authClientId: {
        type: mongoose.Types.ObjectId,
      },
    },
    mapper: {
      type: mongoose.Mixed,
      validate: {
        validator: customValidate,
        message: (props) => {
          const [errorPath, errorMessage] = props.reason.message.split('##');
          return `Error in 'mapper.${errorPath}', ${errorMessage}`;
        },
      },
    },
  },
  { _id: false },
);

const edge = new Schema({
  id: { type: String },
  config: {
    condition: { type: String },
    mapper: {},
  },
  source: {
    type: String,
    required: [true, 'Flow Template edges require a source.'],
  },
  target: {
    type: String,
    required: [true, 'Flow Template edges require a target.'],
  },
  _id: false,
});

const owner = new Schema({
  id: { type: String, required: [true, 'Flow Template owners require an id.'] },
  type: {
    type: String,
    required: [true, 'Flow Template owners require a type.'],
  },
  _id: false,
});

const graph = new Schema({
  nodes: {
    type: [node],
    validate: {
      validator(n) {
        return n.length > 0;
      },
      message: 'Flow Templates require at least one node.',
    },
  },
  edges: {
    type: [edge],
    validate: {
      validator(e) {
        return !(this.nodes.length > 1 && e.length === 0);
      },
      message: 'Flow Templates with more than one node require edges.',
    },
  },
  _id: false,
});

// Define schema
const flowTemplate = new Schema(
  {
    name: { type: String },
    description: { type: String },
    graph: { type: graph, required: [true, 'Flow Templates require a graph.'] },
    type: { type: String },
    tenant: { type: String },
    owners: { type: [owner] },
    status: { type: String, default: 'draft' },
    cron: { type: String },
    flowSettings: {},
    sourceTemplate: { type: mongoose.Types.ObjectId },
  },
  { collection: 'flowTemplates', timestamps: true },
);

module.exports.flowTemplate = flowTemplate;
