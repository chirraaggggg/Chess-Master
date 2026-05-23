// POST /register
// 1. get username, email, password from req.body
const {username, email, password} = req.body 
// 2. validate - are fields empty? is email valid?
const { body, validationResult } = require('express-validator');
// rules for validation
const validationRules = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
]
const errors = validationResult(req);
if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
}
// 3. check if email already exists in DB

// 4. hash the password with bcrypt
// 5. save user to DB
// 6. return success

// POST /login
// 1. get email, password from req.body
// 2. validate - are fields empty?
// 3. find user by email in DB
// 4. if no user found → return 401
// 5. compare password with stored hash using bcrypt
// 6. if wrong password → return 401
// 7. sign a JWT with the user's id and username
// 8. return the token as JSON