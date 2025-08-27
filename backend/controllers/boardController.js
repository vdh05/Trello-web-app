const Board = require('../models/Board');
const Card = require('../models/Card');
const User = require('../models/User');
const { sendAssignmentEmail } = require('./userController');

exports.getBoards = async (req, res) => {
    try {
        // Get boards owned by user and boards shared with user
        const ownedBoards = await Board.find({ owner: req.user.userId });
        const sharedBoards = await Board.find({ 
            sharedWith: req.user.userId,
            owner: { $ne: req.user.userId } // Exclude boards owned by the user
        });
        
        // Add isOwner flag to each board
        const allBoards = [
            ...ownedBoards.map(board => ({ ...board.toObject(), isOwner: true })),
            ...sharedBoards.map(board => ({ ...board.toObject(), isOwner: false }))
        ];
        
        res.json(allBoards);
    } catch {
        res.status(500).json({ error: 'Get boards error' });
    }
};

exports.createBoard = async (req, res) => {
    try {
        const board = await Board.create({ title: req.body.title, owner: req.user.userId });
        res.json(board);
    } catch {
        res.status(500).json({ error: 'Create board error' });
    }
};

exports.deleteBoard = async (req, res) => {
    try {
        // Check if board exists and user is the owner
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can delete board' });
        }
        
        // Delete all cards associated with the board
        await Card.deleteMany({ boardId: req.params.boardId });
        
        // Delete the board
        await Board.findByIdAndDelete(req.params.boardId);
        
        res.json({ success: true, message: 'Board deleted successfully' });
    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({ error: 'Delete board error' });
    }
};

exports.getCards = async (req, res) => {
    try {
        // Check if user has access to this board
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const cards = await Card.find({ boardId: req.params.boardId }).sort({ listId: 1, position: 1 });
        res.json(cards);
    } catch {
        res.status(500).json({ error: 'Get cards error' });
    }
};

exports.renameBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        // Only owner can rename the board
        if (board.owner.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can rename board' });
        }
        
        const updatedBoard = await Board.findByIdAndUpdate(req.params.boardId, { title: req.body.title }, { new: true });
        res.json(updatedBoard);
    } catch {
        res.status(500).json({ error: 'Rename board error' });
    }
};

exports.renameCard = async (req, res) => {
    try {
        const card = await Card.findByIdAndUpdate(req.params.cardId, { text: req.body.text }, { new: true });
        res.json(card);
    } catch {
        res.status(500).json({ error: 'Rename card error' });
    }
};

exports.updateCard = async (req, res) => {
    try {
        // Check if user has access to the board
        const card = await Card.findById(req.params.cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const board = await Board.findById(card.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { text, description, assignedTo, dueDate, recurrence, recurrenceEndDate } = req.body;
        const updatedCard = await Card.findByIdAndUpdate(req.params.cardId, {
            text: text || card.text,
            description: description !== undefined ? description : card.description,
            assignedTo: assignedTo !== undefined ? assignedTo : card.assignedTo,
            dueDate: dueDate !== undefined ? dueDate : card.dueDate,
            recurrence: recurrence !== undefined ? recurrence : card.recurrence,
            recurrenceEndDate: recurrenceEndDate !== undefined ? recurrenceEndDate : card.recurrenceEndDate,
            reminderSent: false, // Reset reminder when due date is updated
            lastReminderSent: null // Reset reminder history when due date is updated
        }, { new: true });
        
        res.json(updatedCard);
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ error: 'Update card error' });
    }
};

exports.moveCard = async (req, res) => {
    try {
        const { sourceListId, destinationListId, sourceIndex, destinationIndex } = req.body;
        
        // Check if user has access to the board
        const card = await Card.findById(req.params.cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const board = await Board.findById(card.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Update the card's list and position
        await Card.findByIdAndUpdate(req.params.cardId, {
            listId: destinationListId,
            position: destinationIndex
        });
        
        // Reorder positions in source list if needed
        if (sourceListId === destinationListId) {
            // Moving within the same list
            const cardsInList = await Card.find({ 
                boardId: card.boardId, 
                listId: sourceListId,
                _id: { $ne: req.params.cardId }
            }).sort({ position: 1 });
            
            // Update positions
            for (let i = 0; i < cardsInList.length; i++) {
                let newPosition = i;
                if (i >= destinationIndex) newPosition = i + 1;
                await Card.findByIdAndUpdate(cardsInList[i]._id, { position: newPosition });
            }
        } else {
            // Moving between different lists
            // Update positions in source list
            const sourceCards = await Card.find({ 
                boardId: card.boardId, 
                listId: sourceListId,
                _id: { $ne: req.params.cardId }
            }).sort({ position: 1 });
            
            for (let i = sourceIndex; i < sourceCards.length; i++) {
                await Card.findByIdAndUpdate(sourceCards[i]._id, { position: i });
            }
            
            // Update positions in destination list
            const destCards = await Card.find({ 
                boardId: card.boardId, 
                listId: destinationListId,
                _id: { $ne: req.params.cardId }
            }).sort({ position: 1 });
            
            for (let i = destinationIndex; i < destCards.length; i++) {
                await Card.findByIdAndUpdate(destCards[i]._id, { position: i + 1 });
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Move card error:', error);
        res.status(500).json({ error: 'Move card error' });
    }
};

exports.deleteCard = async (req, res) => {
    try {
        // Check if user has access to the board
        const card = await Card.findById(req.params.cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const board = await Board.findById(card.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Delete the card
        await Card.findByIdAndDelete(req.params.cardId);
        
        // Reorder positions in the list
        const remainingCards = await Card.find({ 
            boardId: card.boardId, 
            listId: card.listId 
        }).sort({ position: 1 });
        
        for (let i = 0; i < remainingCards.length; i++) {
            await Card.findByIdAndUpdate(remainingCards[i]._id, { position: i });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ error: 'Delete card error' });
    }
};

exports.addCard = async (req, res) => {
    try {
        // Check if user has access to this board
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { text, assignedTo, description, listId, dueDate, recurrence, recurrenceEndDate } = req.body;
        
        // Get the next position for the list
        const lastCard = await Card.findOne({ boardId: req.params.boardId, listId: listId || 'todo' })
            .sort({ position: -1 });
        const nextPosition = lastCard ? lastCard.position + 1 : 0;
        
        const card = await Card.create({ 
            text, 
            boardId: req.params.boardId, 
            assignedTo, 
            description,
            listId: listId || 'todo',
            position: nextPosition,
            dueDate: dueDate || null,
            recurrence: recurrence || 'none',
            recurrenceEndDate: recurrenceEndDate || null,
            assignedBy: req.user ? `@${req.user.username}` : null
        });
        
        // If assignedTo starts with @, try to find user and send mail
        if (assignedTo && assignedTo.startsWith('@')) {
            const username = assignedTo.slice(1);
            const user = await User.findOne({ username });
            if (user && user.email) {
                // req.user.username is the assigner (from JWT)
                try {
                    await sendAssignmentEmail(
                        user.email,
                        req.user.username,
                        text,         // mail subject (card title)
                        description   // mail body (card description)
                    );
                } catch (mailErr) {
                    console.error('Assignment mail error:', mailErr);
                }
            }
        }
        res.json(card);
    } catch {
        res.status(500).json({ error: 'Add card error' });
    }
};

exports.shareBoard = async (req, res) => {
    try {
        const { username } = req.body;
        
        // Check if board exists and user is the owner
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can share board' });
        }
        
        // Find the user to share with
        const userToShare = await User.findOne({ username });
        if (!userToShare) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if already shared
        if (board.sharedWith.includes(userToShare._id)) {
            return res.status(400).json({ error: 'Board already shared with this user' });
        }
        
        // Add user to sharedWith array
        board.sharedWith.push(userToShare._id);
        await board.save();
        
        res.json({ success: true, message: `Board shared with ${username}` });
    } catch (error) {
        console.error('Share board error:', error);
        res.status(500).json({ error: 'Share board error' });
    }
};

exports.getSharedUsers = async (req, res) => {
    try {
        // Check if board exists and user is the owner
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can view shared users' });
        }
        
        // Get shared users with their usernames
        const sharedUsers = await User.find({ _id: { $in: board.sharedWith } }).select('username');
        
        res.json(sharedUsers);
    } catch (error) {
        console.error('Get shared users error:', error);
        res.status(500).json({ error: 'Get shared users error' });
    }
};

exports.removeSharedUser = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Check if board exists and user is the owner
        const board = await Board.findById(req.params.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can remove shared users' });
        }
        
        // Find the user to remove
        const userToRemove = await User.findOne({ username });
        if (!userToRemove) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user is actually shared
        if (!board.sharedWith.includes(userToRemove._id)) {
            return res.status(400).json({ error: 'Board is not shared with this user' });
        }
        
        // Remove user from sharedWith array
        board.sharedWith = board.sharedWith.filter(id => id.toString() !== userToRemove._id.toString());
        await board.save();
        
        res.json({ success: true, message: `Access removed for ${username}` });
    } catch (error) {
        console.error('Remove shared user error:', error);
        res.status(500).json({ error: 'Remove shared user error' });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json([]);
        }
        
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.userId } // Exclude current user
        }).select('username').limit(10);
        
        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Search users error' });
    }
};

exports.sendDueDateReminder = async (req, res) => {
    try {
        // Check if user has access to the board
        const card = await Card.findById(req.params.cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const board = await Board.findById(card.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!card.dueDate) {
            return res.status(400).json({ error: 'Card has no due date' });
        }
        
        // Send reminder email if card is assigned to someone
        if (card.assignedTo && card.assignedTo.startsWith('@')) {
            const username = card.assignedTo.slice(1);
            const user = await User.findOne({ username });
            if (user && user.email) {
                try {
                    await sendAssignmentEmail(
                        user.email,
                        req.user.username,
                        `Manual Reminder: ${card.text} due date`,
                        `Your task "${card.text}" is due on ${new Date(card.dueDate).toLocaleDateString()}. This is a manual reminder sent by ${req.user.username}. Please check your board for details.`
                    );
                    
                    // Mark reminder as sent
                    await Card.findByIdAndUpdate(req.params.cardId, { 
                      reminderSent: true,
                      lastReminderSent: new Date()
                    });
                    
                    res.json({ success: true, message: 'Reminder sent successfully' });
                } catch (mailErr) {
                    console.error('Reminder mail error:', mailErr);
                    res.status(500).json({ error: 'Failed to send reminder email' });
                }
            } else {
                res.status(404).json({ error: 'Assigned user not found or has no email' });
            }
        } else {
            res.status(400).json({ error: 'Card is not assigned to anyone' });
        }
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({ error: 'Send reminder error' });
    }
};

exports.completeCard = async (req, res) => {
    try {
        // Check if user has access to the board
        const card = await Card.findById(req.params.cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const board = await Board.findById(card.boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        if (board.owner.toString() !== req.user.userId && 
            !board.sharedWith.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if the user is the assigned person or the board owner
        const isAssignedUser = card.assignedTo && card.assignedTo === `@${req.user.username}`;
        const isBoardOwner = board.owner.toString() === req.user.userId;
        
        if (!isAssignedUser && !isBoardOwner) {
            return res.status(403).json({ error: 'Only the assigned user or board owner can complete this task' });
        }
        
        // Move card to done list and mark as completed
        const updatedCard = await Card.findByIdAndUpdate(req.params.cardId, {
            listId: 'done',
            completedAt: new Date(),
            completedBy: req.user.username,
            position: 0 // Reset position for done list
        }, { new: true });
        
        // If recurring, create the next occurrence
        if (card.recurrence && card.recurrence !== 'none' && card.dueDate) {
            const currentDue = new Date(card.dueDate);
            let nextDue = null;
            if (card.recurrence === 'daily') {
                nextDue = new Date(currentDue.getTime());
                nextDue.setDate(nextDue.getDate() + 1);
            } else if (card.recurrence === 'weekly') {
                nextDue = new Date(currentDue.getTime());
                nextDue.setDate(nextDue.getDate() + 7);
            } else if (card.recurrence === 'monthly') {
                nextDue = new Date(currentDue.getTime());
                nextDue.setMonth(nextDue.getMonth() + 1);
            }

            // Respect recurrenceEndDate if set
            const isBeforeEnd = !card.recurrenceEndDate || (nextDue && nextDue <= new Date(card.recurrenceEndDate));
            if (nextDue && isBeforeEnd) {
                // Determine next position for original list (keep in same list as original)
                const lastCardForList = await Card.findOne({ boardId: card.boardId, listId: card.listId })
                    .sort({ position: -1 });
                const nextPositionForList = lastCardForList ? lastCardForList.position + 1 : 0;

                await Card.create({
                    text: card.text,
                    boardId: card.boardId,
                    assignedTo: card.assignedTo,
                    description: card.description,
                    listId: card.listId || 'todo',
                    position: nextPositionForList,
                    dueDate: nextDue,
                    recurrence: card.recurrence,
                    recurrenceEndDate: card.recurrenceEndDate
                });
            }
        }

        res.json({ success: true, card: updatedCard, message: 'Task completed successfully!' });
    } catch (error) {
        console.error('Complete card error:', error);
        res.status(500).json({ error: 'Complete card error' });
    }
};
