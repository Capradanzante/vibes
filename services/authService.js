const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_TIMEOUT_MINUTES = 15;

class AuthService {
  async registerUser(userData) {
    const { email, password, username, role = 'user' } = userData;

    try {
      // Verifica se l'utente esiste già
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email o username già registrati');
      }

      // Validazione password
      this._validatePassword(password);

      // Hash della password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Inizia una transazione
      await db.query('BEGIN');

      // Inserimento nuovo utente
      const result = await db.query(`
        INSERT INTO users (
          id, email, username, password_hash, role,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, username, role, created_at
      `, [uuidv4(), email, username, hashedPassword, role]);

      const user = result.rows[0];

      // Crea i token
      const tokens = await this._generateTokens(user);

      // Salva il refresh token nel database
      await this._saveRefreshToken(user.id, tokens.refresh_token);

      // Commit della transazione
      await db.query('COMMIT');

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          created_at: user.created_at
        },
        ...tokens
      };
    } catch (error) {
      await db.query('ROLLBACK');
      throw new Error(`Errore durante la registrazione: ${error.message}`);
    }
  }

  async loginUser(email, password) {
    try {
      // Verifica tentativi di login
      await this._checkLoginAttempts(email);

      // Recupera l'utente
      const result = await db.query(`
        SELECT u.*, 
               COUNT(DISTINCT sv.song_id) as songs_count,
               COUNT(DISTINCT cv.content_id) as content_count
        FROM users u
        LEFT JOIN song_vibes sv ON u.id = sv.created_by
        LEFT JOIN content_vibes cv ON u.id = cv.created_by
        WHERE u.email = $1
        GROUP BY u.id
      `, [email]);

      if (result.rows.length === 0) {
        await this._incrementLoginAttempts(email);
        throw new Error('Credenziali non valide');
      }

      const user = result.rows[0];

      // Verifica la password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this._incrementLoginAttempts(email);
        throw new Error('Credenziali non valide');
      }

      // Reset tentativi di login
      await this._resetLoginAttempts(email);

      // Aggiorna last_login
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Genera nuovi token
      const tokens = await this._generateTokens(user);

      // Salva il refresh token
      await this._saveRefreshToken(user.id, tokens.refresh_token);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          last_login: user.last_login,
          created_at: user.created_at,
          stats: {
            songs_count: user.songs_count,
            content_count: user.content_count
          }
        },
        ...tokens
      };
    } catch (error) {
      throw new Error(`Errore durante il login: ${error.message}`);
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verifica il token nel database
      const tokenResult = await db.query(
        'SELECT user_id, is_revoked FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      if (tokenResult.rows.length === 0 || tokenResult.rows[0].is_revoked) {
        throw new Error('Token di refresh non valido o revocato');
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Utente non trovato');
      }

      const user = result.rows[0];
      const tokens = await this._generateTokens(user);

      // Revoca il vecchio refresh token
      await db.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
        [refreshToken]
      );

      // Salva il nuovo refresh token
      await this._saveRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch (error) {
      throw new Error('Token di refresh non valido');
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Token non valido');
    }
  }

  async logoutUser(refreshToken) {
    try {
      await db.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
        [refreshToken]
      );
    } catch (error) {
      throw new Error('Errore durante il logout');
    }
  }

  async _generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_EXPIRY
    };
  }

  async _saveRefreshToken(userId, token) {
    await db.query(`
      INSERT INTO refresh_tokens (
        user_id, token, expires_at, created_at
      )
      VALUES (
        $1, $2, 
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        CURRENT_TIMESTAMP
      )
    `, [userId, token]);
  }

  async _checkLoginAttempts(email) {
    const result = await db.query(`
      SELECT COUNT(*) as attempts,
             MAX(created_at) as last_attempt
      FROM login_attempts
      WHERE email = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${LOGIN_TIMEOUT_MINUTES} minutes'
    `, [email]);

    const { attempts, last_attempt } = result.rows[0];

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const timeoutEnd = new Date(last_attempt.getTime() + LOGIN_TIMEOUT_MINUTES * 60000);
      const minutesLeft = Math.ceil((timeoutEnd - new Date()) / 60000);
      throw new Error(`Troppi tentativi di login. Riprova tra ${minutesLeft} minuti`);
    }
  }

  async _incrementLoginAttempts(email) {
    await db.query(`
      INSERT INTO login_attempts (email, created_at)
      VALUES ($1, CURRENT_TIMESTAMP)
    `, [email]);
  }

  async _resetLoginAttempts(email) {
    await db.query(
      'DELETE FROM login_attempts WHERE email = $1',
      [email]
    );
  }

  _validatePassword(password) {
    if (password.length < 8) {
      throw new Error('La password deve essere di almeno 8 caratteri');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('La password deve contenere almeno una lettera maiuscola');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('La password deve contenere almeno una lettera minuscola');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('La password deve contenere almeno un numero');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      throw new Error('La password deve contenere almeno un carattere speciale (!@#$%^&*)');
    }
  }
}

module.exports = new AuthService(); 