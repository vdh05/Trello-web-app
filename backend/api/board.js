const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const auth = require('../middleware/auth');

router.get('/boards', auth, boardController.getBoards);
router.post('/boards', auth, boardController.createBoard);
router.get('/boards/:boardId/cards', auth, boardController.getCards);
router.post('/boards/:boardId/cards', auth, boardController.addCard);
router.patch('/boards/:boardId/rename', auth, boardController.renameBoard);
router.delete('/boards/:boardId', auth, boardController.deleteBoard);
router.patch('/cards/:cardId/rename', auth, boardController.renameCard);
router.patch('/cards/:cardId/update', auth, boardController.updateCard);
router.patch('/cards/:cardId/move', auth, boardController.moveCard);
router.delete('/cards/:cardId', auth, boardController.deleteCard);
router.post('/boards/:boardId/share', auth, boardController.shareBoard);
router.get('/boards/:boardId/shared-users', auth, boardController.getSharedUsers);
router.delete('/boards/:boardId/share/:username', auth, boardController.removeSharedUser);
router.get('/users/search', auth, boardController.searchUsers);
router.post('/cards/:cardId/send-reminder', auth, boardController.sendDueDateReminder);
router.post('/cards/:cardId/complete', auth, boardController.completeCard);

module.exports = router;
