const mongoose = require('mongoose');

const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');
const CONSTANTS = require('../../constants');

const validateEmail = function(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        email,
  ); // eslint-disable-line
};

// const membershipsSchema = new Schema({
//     roles: [{
//         type: Schema.ObjectId, ref: 'role',
//     }],
//     tenant: {
//         type: Schema.ObjectId,
//         ref: 'tenant',
//     },
//     scope: String,
//     permissions: [String],
//     active: Boolean,
// }, {
//     _id: false,
// });

// membershipsSchema.index({ active: 1 }, { unique: true, partialFilterExpression: { active: true } });

const schema = {
    username: {
        type: String,
        lowercase: true,
        required: true,
    },

    firstname: { type: String, index: true },
    lastname: { type: String, index: true },
    phone: String,
    avatar: String,
    status: {
        type: String,
        enum: [
            CONSTANTS.STATUS.ACTIVE,
            CONSTANTS.STATUS.DISABLED,
            CONSTANTS.STATUS.PENDING,
        ],
        default: CONSTANTS.STATUS.ACTIVE,
    },
    confirmed: { type: Boolean, default: false },
    // accountType: {
    //     type: String,
    //     'enum': [
    //         CONSTANTS.ROLES.USER,
    //         CONSTANTS.ROLES.ADMIN,
    //         CONSTANTS.ROLES.SERVICE_ACCOUNT,
    //     ],
    //     'default': CONSTANTS.ROLES.USER,
    //
    // },
    canLogin: {
        type: Boolean,
        default: true,
    },
    tenant: {
        type: Schema.ObjectId,
        ref: 'tenant',
    },
    roles: [
        {
            type: Schema.ObjectId,
            ref: 'role',
        },
    ],
    // memberships: [membershipsSchema],
    permissions: [String],
    safeguard: {
        lastLogin: Date,
        failedLoginAttempts: Number,
    },
};

const account = new Schema(schema, {
    timestamps: true,
    strict: true,
});

// adding unique index tenant & username
account.index({
    username: 1,
}, {
    unique: true,
    partialFilterExpression: { canLogin: true },
});
account.index(
    {
        username: 1,
        tenant: 1,
    },
    {
        unique: true,
        partialFilterExpression: { canLogin: false }, 
    },
);

// adding canLogin: true
account.plugin(passportLocalMongoose, {
    usernameUnique: false,

    findByUsername: (model, queryParameters) => {
        queryParameters.canLogin = true;
        return model.findOne(queryParameters);
    },
});

account.path('username').validate(function(email) {
    if (this.canLogin) {
        if (!validateEmail(email)) {
            throw new Error(CONSTANTS.ERROR_CODES.EMAIL_NOT_VALID);
        }
    }
    return true;
}, 'Name `{VALUE}` is not valid');

const accountFull = new Schema(
    {
        ...schema,
        hash: String,
        salt: String,
    },
    {
        timestamps: true,
        strict: true,
    },
);

module.exports.account = account;
module.exports.accountFull = accountFull;
