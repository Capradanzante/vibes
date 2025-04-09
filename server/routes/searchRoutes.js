const express = require('express');
const router = express.Router();
const { searchContent } = require('../controllers/searchController');

router.get('/search', searchContent);

module.exports = router; 