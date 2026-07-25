const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { STATUSES } = require('../models/Lead');

// ─── POST /api/leads  (public) ────────────────────────────────────────────────
const submitLead = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { name, email, budgetRange, message } = req.body;
    const lead = await Lead.create({ name, email, budgetRange, message });

    return res.status(201).json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
      lead: { id: lead._id, name: lead.name, status: lead.status },
    });
  } catch (err) {
    console.error('submitLead error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── GET /api/leads/admin  (protected) ───────────────────────────────────────
const getLeads = async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && STATUSES.includes(status)) query.status = status;

    if (search.trim()) {
      query.$or = [
        { name:    { $regex: search.trim(), $options: 'i' } },
        { email:   { $regex: search.trim(), $options: 'i' } },
        { message: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip      = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query),
    ]);

    // Stats counts (always full collection, ignoring current filter)
    const counts = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const totalAll = await Lead.countDocuments({});
    const stats = { Total: totalAll, New: 0, Contacted: 0, Closed: 0 };
    counts.forEach(({ _id, count }) => { if (_id in stats) stats[_id] = count; });

    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats,
    });
  } catch (err) {
    console.error('getLeads error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/leads/admin/:id/status  (protected) ──────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUSES.join(', ')}`,
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    return res.status(200).json({ success: true, message: `Status updated to "${status}"`, lead });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/leads/admin/:id  (protected) ────────────────────────────────
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    console.error('deleteLead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { submitLead, getLeads, updateStatus, deleteLead };
