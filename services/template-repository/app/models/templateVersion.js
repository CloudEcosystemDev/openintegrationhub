const mongoose = require('mongoose');

const TemplateVersion = require('./schemas/templateVersion').templateVersion;

// Compile model from schema
module.exports = mongoose.model('TemplateVersion', TemplateVersion);
