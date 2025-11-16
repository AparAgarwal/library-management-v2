const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUserRegistration, validationError } = require('../../utils/validation');
const { transformUserData } = require('../../utils/helpers');
const { ERROR_MESSAGES, ROLES, BCRYPT_SALT_ROUNDS, JWT_DEFAULT_EXPIRES_IN } = require('../../config/constants');

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = ROLES.MEMBER } = req.body;

    // Validate input
    const validation = validateUserRegistration({ email, password, firstName, lastName });
    if (!validation.isValid) {
      return res.status(400).json(validationError(validation.errors));
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: ERROR_MESSAGES.EMAIL_EXISTS });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, email, first_name, last_name, role, created_at`,
      [email, passwordHash, firstName, lastName, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || JWT_DEFAULT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: transformUserData(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || JWT_DEFAULT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: transformUserData(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, email, first_name, last_name, role, phone, address, avatar_url, created_at
       FROM users WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    res.json(transformUserData(result.rows[0]));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
