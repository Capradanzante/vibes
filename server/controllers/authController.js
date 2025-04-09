const authService = require('../services/authService');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password, username } = req.body;
            if (!email || !password || !username) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await authService.registerUser({ email, password, username });
            res.status(201).json(result);
        } catch (error) {
            console.error('Registration error:', error);
            res.status(error.status || 500).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password' });
            }

            const result = await authService.loginUser(email, password);
            res.json(result);
        } catch (error) {
            console.error('Login error:', error);
            res.status(error.status || 500).json({ error: error.message });
        }
    },

    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Missing refresh token' });
            }

            const result = await authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
};

module.exports = authController; 