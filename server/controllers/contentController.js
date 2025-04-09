const contentService = require('../services/contentService');

const contentController = {
    getAllContent: async (req, res) => {
        try {
            const { type, limit = 10, offset = 0 } = req.query;
            const content = await contentService.getAllContent(type, limit, offset);
            res.json(content);
        } catch (error) {
            console.error('Error fetching content:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getContentById: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await contentService.getContentById(id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            res.json(content);
        } catch (error) {
            console.error('Error fetching content by ID:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createContent: async (req, res) => {
        try {
            const contentData = req.body;
            const newContent = await contentService.createContent(contentData);
            res.status(201).json(newContent);
        } catch (error) {
            console.error('Error creating content:', error);
            res.status(500).json({ error: error.message });
        }
    },

    updateContent: async (req, res) => {
        try {
            const { id } = req.params;
            const contentData = req.body;
            const updatedContent = await contentService.updateContent(id, contentData);
            if (!updatedContent) {
                return res.status(404).json({ error: 'Content not found' });
            }
            res.json(updatedContent);
        } catch (error) {
            console.error('Error updating content:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteContent: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedContent = await contentService.deleteContent(id);
            if (!deletedContent) {
                return res.status(404).json({ error: 'Content not found' });
            }
            res.json({ message: 'Content deleted successfully' });
        } catch (error) {
            console.error('Error deleting content:', error);
            res.status(500).json({ error: error.message });
        }
    },

    searchContent: async (req, res) => {
        try {
            const { query, type, limit = 10 } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }
            const results = await contentService.searchContent(query, type, limit);
            res.json(results);
        } catch (error) {
            console.error('Error searching content:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getContentByVibe: async (req, res) => {
        try {
            const { vibeId } = req.params;
            const { type, limit = 10 } = req.query;
            const content = await contentService.getContentByVibe(vibeId, type, limit);
            res.json(content);
        } catch (error) {
            console.error('Error fetching content by vibe:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = contentController; 