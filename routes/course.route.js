import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

//list
router.get('/', async function (req, res) {
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  const courses = await courseModel.findAll();
  res.render('vwCourse/byCat', {
    parents : parents,
    childrenMap : childrenMap,
    courses: courses,
  });
});

//list
router.get('/byCat', async function (req, res) {
  let catid = req.query.catid || 0;
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }

  let category = null;
  if (catid) category = await categoryModel.findById(catid);
  let courses = category
    ? await courseModel.findByCat(catid)
    : await courseModel.findAll();

  res.render('vwCourse/byCat', {
    parents : parents,
    childrenMap : childrenMap,
    category : category,
    courses: courses,
  });
});

//add
router.get('/add', async (req, res) => {
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  res.render('vwAdminCategory/add', {
    parents: parents,
    childrenMap : childrenMap,
    presetMode: 'course' 
  });
});

router.post('/add', async (req, res) => {
  if (req.body.mode !== 'course') 
    return res.redirect('/admin/categories/add');
  let catid = Number(req.body.catid) || null;

  if (!catid && req.body.catname?.trim()) {
    const newCat = {
      catname: req.body.catname.trim(),
      parentid: Number(req.body.parentid) || null
    };
    const [newId] = await categoryModel.add(newCat);
    catid = newId;
  }

  const title = (req.body.title || '').trim();
  if (!title || !catid)
    return res.redirect('/course/add?err=missing_title_or_cat&mode=course');

  const course = {
    title,
    price: Number(req.body.price) || 0,
    discount: Number(req.body.discount) || 0,
    thumbnail: req.body.thumbnail?.trim() || null,
    status: req.body.status?.trim() || 'draft',
    catid,
    instructorid: Number(req.body.instructorid) || null,
    lastupdate: new Date(),
    tinydes: req.body.tinydes?.trim() || null,
    fulldes: req.body.fulldes?.trim() || null,
  };
  await courseModel.add(course);
  res.redirect(`/course/byCat?catid=${catid}`);
});
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.redirect('/course/byCat');

  const course = await courseModel.findById(id);
  if (!course) return res.status(404).send('Course not found');

  // 🔹 Lấy dữ liệu category cho sidebar (y như byCat)
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }

  res.render('vwCourse/details', {
    course,
    parents,
    childrenMap,
  });
});


export default router;
