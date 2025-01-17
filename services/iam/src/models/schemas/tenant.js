const mongoose = require('mongoose');

const { Schema } = mongoose;
const CONSTANTS = require('../../constants');
const settings = new Schema({
    key: { type: String},
    value: { type: String},
    label: { type: String},
})

const TenantSchema = new Schema({
    name: { type: String, index: true,unique:true },
    confirmed: { 
        type: Boolean, 
        default: true, 
    },
    status: {
        type: String,
        enum: [
            CONSTANTS.STATUS.ACTIVE,
            CONSTANTS.STATUS.DISABLED,
            CONSTANTS.STATUS.PENDING,
        ],
        default: CONSTANTS.STATUS.ACTIVE,
    },
    settings: [ settings ],
}, {
    timestamps: true,
});

module.exports = TenantSchema;
