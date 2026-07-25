const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { submitLead, getLeads, updateStatus, deleteLead } = require('../controllers/leadsController');
const { BUDGET_RANGES } = require('../models/Lead');

// ─── Validation rules for public form submission ──────────────────────────────
const leadValidation = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
    .escape(),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('budgetRange')
    .trim().notEmpty().withMessage('Budget range is required')
    .isIn(BUDGET_RANGES).withMessage('Invalid budget range selected'),
  body('message')
    .trim().notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters')
    .escape(),
];

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/', leadValidation, submitLead);

// ─── Protected (admin only) ───────────────────────────────────────────────────
router.get('/admin',              protect, getLeads);
router.patch('/admin/:id/status', protect, updateStatus);
router.delete('/admin/:id',       protect, deleteLead);

module.exports = router;
