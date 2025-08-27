const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    text: String,
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    assignedTo: String,
    description: String,
    listId: { type: String, default: 'todo' }, // 'todo', 'doing', 'done'
    position: { type: Number, default: 0 }, // Position within the list
    dueDate: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
    lastReminderSent: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: null },
    assignedBy: { type: String, default: null },
    // Recurrence fields
    recurrence: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    },
    recurrenceEndDate: { type: Date, default: null }
});

module.exports = mongoose.model('Card', CardSchema);
