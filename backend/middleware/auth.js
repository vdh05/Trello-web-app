const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'trello_secret';

module.exports = function (req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};
