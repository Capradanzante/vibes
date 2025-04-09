const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const SALT_ROUNDS = 10;

class AuthService {
  constructor() {
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  async registerUser(email, password, name) {
    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, email, name, role`,
        [email, hashedPassword, name]
      );

      const user = result.rows[0];
      const tokens = this._generateTokens(user);

      return {
        ...user,
        ...tokens
      };
    } finally {
      client.release();
    }
  }

  async loginUser(email, password) {
    const client = await pool.connect();
    try {
      // Get user
      const result = await client.query(
        'SELECT id, email, password, name, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Remove password from user object
      delete user.password;

      const tokens = this._generateTokens(user);

      return {
        ...user,
        ...tokens
      };
    } finally {
      client.release();
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, email, name, role FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = result.rows[0];
        return this._generateTokens(user);
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  _generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token non valido');
    }
  }
}

module.exports = new AuthService(); 