import express from "express";
import * as instructorModel from "../models/instructor.model.js";
import * as authMiddleware from "../middlewares/auth.mdw.js";

const router = express.Router();

// View current instructor info (must be logged in with role=instructor)
router.get('/infor', authMiddleware.requireAuth, authMiddleware.restrictInstructor, async function (req, res) {
  const userId = req.session?.authUser?.userid;
  if (!userId) {
    return res.redirect('/account/signin');
  }
  const instructor = await instructorModel.findById(userId);
  const email = await instructorModel.getInstructorEmail(userId);
  const fullname = await instructorModel.getInstructorName(userId);

  let birthdayValue = '';
  if (instructor?.birthday) {
    if (typeof instructor.birthday === 'string') birthdayValue = instructor.birthday.substring(0, 10);
    else if (instructor.birthday instanceof Date) birthdayValue = instructor.birthday.toISOString().substring(0, 10);
  }

  res.render('vwInstructor/infor', {
    instructor,
    email,
    fullname,
    birthdayValue,
    updated: req.query.updated === '1'
  });
});

// Update current instructor info
router.post('/infor', authMiddleware.requireAuth, authMiddleware.restrictInstructor, express.urlencoded({ extended: true }), async function (req, res) {
  const userId = req.session?.authUser?.userid;
  if (!userId) {
    return res.redirect('/account/signin');
  }

  const payload = {
    description: req.body.description?.trim() || null,
    birthday: req.body.birthday || null,
    country: req.body.country?.trim() || null,
    phone: req.body.phone?.trim() || null,
    address: req.body.address?.trim() || null,
    city: req.body.city?.trim() || null,
  };

  await instructorModel.upsertByUserId(userId, payload);
  return res.redirect('/instructor/infor?updated=1');
});

// Keep existing detail route by id for compatibility
router.get('/infor/:instructorid', async function (req, res) {
  const instructorid = req.params.instructorid;
  if (!instructorid) {
    return res.status(400).send('Instructor ID is required');
  }
  const instructor = await instructorModel.findById(instructorid);
  if (!instructor) {
    return res.status(404).send('Instructor not found');
  }
  const email = await instructorModel.getInstructorEmail(instructorid);
  const fullname = await instructorModel.getInstructorName(instructorid);

  let birthdayValue = '';
  if (instructor?.birthday) {
    if (typeof instructor.birthday === 'string') birthdayValue = instructor.birthday.substring(0, 10);
    else if (instructor.birthday instanceof Date) birthdayValue = instructor.birthday.toISOString().substring(0, 10);
  }

  res.render('vwInstructor/infor', {
    instructor,
    email,
    fullname,
    birthdayValue
  });
});

export default router;