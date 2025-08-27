const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
    title: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Board', BoardSchema);
