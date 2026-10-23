'use strict';

const { CommentService } = require('./commentService');
const { Store } = require('./store');
const errors = require('./errors');

module.exports = { CommentService, Store, ...errors };
