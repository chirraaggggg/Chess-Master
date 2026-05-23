const jwt = require('jsonwebtoken');

const authenticateToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; // Return decoded user info if token is valid
    } catch (err) {
        console.error('Token verification failed:', err);
        return null; // Return null if token is invalid
    }
}
module.exports = authenticateToken