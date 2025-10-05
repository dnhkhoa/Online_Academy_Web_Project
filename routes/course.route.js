import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();


//
router.get('/', async function (req, res) {
  const courses = await courseModel.findAll();
  res.render('vwAdminCourse/list', {
    courses: courses
  });
});

//
router.get('/byCat', async function (req, res) {
  let catid = 0;
  if (req.query.catid) {
    catid = req.query.catid;
  }
  let category = null;
  if (catid) {
    category = await categoryModel.findById(catid)
  }
  let courses = [];
  if (category) {
    courses = await courseModel.findByCat(catid);
  }
  res.render('vwAdminCourse/byCat', {
    category: category,
    courses: courses
  })
});

//
router.get('/add', async function (req, res) {
  let category = null;
  if (req.query.catid) {
    const catid = req.query.catid;
    category = await categoryModel.findById(catid);
  }
  res.render('vwAdminCourse/add', {
    category: category
  });
});
router.post('/add', async function (req, res) {
  let catid = null;
  if (req.body.catid) catid = +req.body.catid;

  const course = {
    title: req.body.title,
    tinydes: req.body.tinydes || null,
    fulldes: req.body.fulldes || null, // TinyMCE
    price: req.body.price || 0,
    discount: req.body.discount || 0,
    thumbnail: req.body.thumbnail || null,
    status: req.body.status,
    catid: catid,
    instructorid: req.body.instructorid || null,
    lastupdate: new Date()
    //Thêm Rating để hoàn thiện database
  };

  await courseModel.add(course);

  if (catid) {
    return res.redirect(`/admin/courses/byCat?catid=${catid}`);
  }
  return res.redirect('/admin/courses');
});

//
router.get('/edit', async function (req, res) {
  let id = 0;
  if (req.query.id) {
    id = req.query.id;
  }
  const course = await courseModel.findById(id);
  if (!course) {
    res.redirect('/admin/courses');
  }
  let category = null;
  if (course.catid) {
    category = await categoryModel.findById(course.catid);
  }

  res.render('vwAdminCourse/edit', {
    course: course,
    category: category,
  })
});


router.post('/patch', async function (req, res) {
  let id = 0;
  if (req.body.courseid) {
    id = req.body.courseid;
  }
  // if (!id) {
  //   console.error('PATCH course: missing courseid', req.body);
  //   return res.redirect('/admin/courses');
  // }
  let catid = null;
  if (req.body.catid) {
    catid = req.body.catid;
  }
  const changes = {
    title: req.body.title || null,
    tinydes: req.body.tinydes || null,
    fulldes: req.body.fulldes || null,
    price: req.body.price || 0,
    discount: req.body.discount || 0,
    thumbnail: req.body.thumbnail || null,
    status: req.body.status || 'draft',
    lastupdate: new Date()
  };
  if (catid) {
    changes.catid = catid;
  }
  await courseModel.patch(id, changes);
  if (catid) {
    return res.redirect(`/admin/courses/byCat?catid=${catid}`);
  }
  return res.redirect('/admin/courses');
});


//
router.post('/del', async function (req, res) {
  let id = 0;
  let catid = null;

  if (req.body.courseid) {
    id = req.body.courseid;
  }
  if (req.body.catid) {
    catid = req.body.catid;
  }

  await courseModel.del(id);

  if (catid) {
    return res.redirect(`/admin/courses/byCat?catid=${catid}`);
  }
  return res.redirect('/admin/courses');
});

export default router;
