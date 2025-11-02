import express from 'express';
import * as userModel from '../models/user.model.js';

const router = express.Router();

// Main admin users page: show both tables
router.get('/', async (req, res) => {
  const [students, instructors] = await Promise.all([
    userModel.findUsersByRole('student'),
    userModel.findUsersByRole('instructor')
  ]);

  res.render('vwAdminUser/index', {
    students,
    instructors,
  });
});

// GET /admin/users/students (kept for convenience)
router.get('/students', async (req, res) => {
  const users = await userModel.findUsersByRole('student');
  res.render('vwAdminUser/list', {
    heading: 'Students',
    users,
  });
});

// GET /admin/users/instructors (kept for convenience)
router.get('/instructors', async (req, res) => {
  const users = await userModel.findUsersByRole('instructor');
  res.render('vwAdminUser/list', {
    heading: 'Instructors',
    users,
  });
});

// POST /admin/users/lock - lock account
router.post('/lock', async (req, res) => {
  const userid = Number(req.body.userid || 0);
  if (!userid) return res.redirect('/admin/users');
  await userModel.setUserLock(userid, 1);
  res.redirect('/admin/users');
});

export default router;
