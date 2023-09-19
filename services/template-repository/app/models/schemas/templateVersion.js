const mongoose = require('mongoose');
const TemplateSchema = require('./flowTemplate').flowTemplate;

const Schema = mongoose.Schema;

const clonedTemplate = TemplateSchema.clone().set('_id', false);

const templateVersion = new Schema(
  {
    templateId: { type: mongoose.Types.ObjectId, required: true, index: true },
    template: clonedTemplate,
  },
  { collection: 'templateVersions', timestamps: true },
);

module.exports.templateVersion = templateVersion;
