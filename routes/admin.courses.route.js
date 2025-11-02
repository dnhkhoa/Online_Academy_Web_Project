import express from 'express';
import * as courseModel from '../models/course.model.js';

const router = express.Router();

// GET /admin/courses - list all courses for admin management
router.get('/', async (req, res) => {
  const courses = await courseModel.adminListCourses();
  res.render('vwAdminCourse/admin-list', { courses });
});

// POST /admin/courses/suspend - set status to 'hide'
router.post('/suspend', async (req, res) => {
  const courseid = Number(req.body.courseid || 0);
  if (!courseid) return res.redirect('/admin/courses');
  await courseModel.setCourseStatus(courseid, 'hide');
  res.redirect('/admin/courses');
});

// POST /admin/courses/unsuspend - set status to 'published'
router.post('/unsuspend', async (req, res) => {
  const courseid = Number(req.body.courseid || 0);
  if (!courseid) return res.redirect('/admin/courses');
  await courseModel.setCourseStatus(courseid, 'published');
  res.redirect('/admin/courses');
});

export default router;

