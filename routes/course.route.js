import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as categoryModel from '../models/category.model.js';
import * as sectionModel from '../models/courseSections.model.js';
import * as lessonModel from '../models/lesson.model.js'; 
import * as authMiddleware from '../middlewares/auth.mdw.js';


const router = express.Router();

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
    parents: parents,
    childrenMap: childrenMap,
    category: category,
    courses: courses,
  });
});

//add
router.get('/add',authMiddleware.requireAuth,authMiddleware.restrictInstructorAndAdmin ,async function (req, res) {
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  res.render('vwAdminCategory/add', {
    parents: parents,
    childrenMap: childrenMap,
    presetMode: 'course'
  });
});

router.post('/add', async function (req, res) {
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
router.get('/byChild.json', async function (req, res) {
  const catid = Number(req.query.childid || req.query.catid || 0);
  if (!catid) return res.json([]);
  let list = await courseModel.findByCat(catid);
  if (!list?.length) {
    const children = await categoryModel.findChildrenByParent(catid);
    const ids = children.map(c => Number(c.catid)).filter(Boolean);
    if (ids.length) list = await courseModel.findByCats(ids);
  }
  res.json(list || []);
});
//lesson list
router.get("/lesson",async function (req, res) {
  const courseid = Number(req.query.courseid || 0);
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  const coursesMap = {};
  for (const p of parents) {
    const children = childrenMap[p.catid] || [];
    for (const c of children) {
      coursesMap[c.catid] = await courseModel.findByCat(c.catid);
    }
  }
  let course = null;
  let sections = [];
  let lessonMap = {};
  if (courseid) {
    course = await courseModel.findById(courseid);
    if (!course) return res.redirect('/course/byCat');
    sections = await sectionModel.findByCourse(courseid);
    const sectionIds = sections.map(s => s.sectionid);
    const lessons = await lessonModel.findBySections(sectionIds);
    lessonMap = {};
    for (const s of sections) lessonMap[s.sectionid] = [];
    for (const l of lessons) (lessonMap[l.sectionid] || (lessonMap[l.sectionid] = [])).push(l);
  }

  res.render("vwAdminCourse/listLesson", {
    parents: parents,
    childrenMap: childrenMap,
    coursesMap: coursesMap,
    course: course,
    sections: sections,
    lessonMap: lessonMap,
  });
});
//addlesson
router.get("/addlesson", async function (req, res) {
  const courseid = Number(req.query.courseid || 0);

  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }

  let course = null;
  let sections = [];
  if (courseid) {
    course = await courseModel.findById(courseid);
    if (!course) return res.redirect('/course/byCat');
    sections = await sectionModel.findByCourse(courseid);
  }

  res.render("vwAdminCourse/addLesson", {
    parents: parents,
    childrenMap: childrenMap,
    course: course,
    sections: sections,
  });
});
router.post("/addlesson", async function (req, res) {
  const courseid = Number(req.body.courseid);
  let sectionid = Number(req.body.sectionId);
  const newSectionName = (req.body.newSectionName || '').trim();
  const title = (req.body.title || '').trim();

  if (!sectionid && newSectionName) {
    const [sec] = await sectionModel.add({
      courseid,
      title: newSectionName,
      order: 1,
    });
    sectionid = sec.sectionid;
  }

  await lessonModel.add({
    sectionid,
    title,
    content: req.body.content || '',
    video_url: (req.body.video_url || '').trim(),
    preview: req.body.preview === 'on',
  });

  res.redirect(`/course/lesson?courseid=${courseid}`);
});
//watch
router.get('/watch', async function (req, res) {
  const lessonid = Number(req.query.lessonid || 0);
  const lesson = await lessonModel.findOne(lessonid);
  const src = (lesson.video_url || '').trim();
  res.render('vwAdminCourse/watchLesson', {
    lesson: lesson,
    player: {
      src: src,
      type: 'video/youtube'
    }
  });
});
//edit lesson
router.get('/lesson/edit', async function (req, res) {
  const sectionid = Number(req.query.sectionid || 0);
  if (!sectionid) return res.redirect('/course/lesson');

  const section = await sectionModel.findBySectionId(sectionid);
  if (!section) return res.redirect('/course/lesson');

  const lessons = await lessonModel.findBySection(sectionid);
  const course = await courseModel.findById(section.courseid);
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }

  res.render('vwAdminCourse/editLesson', {
    section,
    lessons,
    course,
    parents,
    childrenMap,
  });
});

router.post('/section/edit', async function (req, res) {
  const sectionid = Number(req.body.sectionId || 0);
  const courseid = Number(req.body.courseId || 0);
  const name = (req.body.sectionName || '').trim();
  if (name) await sectionModel.patch(sectionid, { title: name });

  return res.redirect(`/course/lesson?courseid=${courseid}`);
});

router.post('/lesson/editLesson', async function (req, res) {
  const sectionid = Number(req.body.sectionId || 0);
  const courseid = Number(req.body.courseId || 0);
  const lessonId = Number(req.body.targetLessonId || 0);

  const title = (req.body.lessonTitles?.[lessonId] || '').trim();
  const videoUrl = (req.body.videoUrls?.[lessonId] || '').trim();
  const preview = String(req.body.previews?.[lessonId] || '0') === '1';

  await lessonModel.patch(lessonId, {
    title,
    video_url: videoUrl,
    preview
  });

  return res.redirect(`/course/lesson?courseid=${courseid}`);
});
//delete section
router.post('/section/delete', async function (req, res) {
  const sectionid = Number(req.body.sectionId || 0);
  const courseid  = Number(req.body.courseId  || 0);

  await lessonModel.delBySection(sectionid);
  await sectionModel.del(sectionid);

  return res.redirect(`/course/lesson?courseid=${courseid}`);
});
//delete lesson
router.post('/lesson/deleteOne', async function (req, res)  {
  const courseid = Number(req.body.courseId || 0);
  const lessonId = Number(req.body.targetLessonId || 0);

  await lessonModel.del(lessonId);

  return res.redirect(`/course/lesson?courseid=${courseid}`);
});
//patch
router.post('/patch', async function (req, res) {
  const courseid = Number(req.body.courseId || req.body.courseid || 0);
  if (!courseid) return res.redirect('back');
  const course = {
    title: (req.body.title || '').trim(),
    tinydes: (req.body.tinydes || '').trim() || null,
    fulldes: (req.body.fulldes || '').trim() || null,
    price: Number(req.body.price) || 0,
    discount: Number(req.body.discount) || 0,
    status: (req.body.status || 'draft').trim(),
    thumbnail: (req.body.thumbnail || '').trim() || null,
    catid: Number(req.body.catid) || null,
    lastupdate: new Date(),
  };

  await courseModel.patch(courseid, course);

  const parentid = Number(req.body.parentId || req.body.parentid || 0);
  res.redirect(`/admin/categories/edit?parentid=${parentid || ''}`);
});

//delete
router.post('/del', async function (req, res) {
  try {
    const courseid = Number(req.body.courseId || req.body.courseid || 0);
    if (courseid) await courseModel.del(courseid);
    const parentid = Number(req.body.parentId || req.body.parentid || 0);
    return res.redirect(`/admin/categories/edit?parentid=${parentid || ''}`);
  } catch (e) {
    console.error(e);
    return res.redirect('back');
  }
});

router.get('/search', async function (req, res) {
  const q = req.query.q || '';
  if (q.length === 0) {
    return res.render('vwCourse/search', {
      q: q,
      empty: true,
      courses: [],
      pages: [],
    });
  }

  const page = parseInt(req.query.page) || 1; 
  const limit = 3; 
  const offset = (page - 1) * limit; 

  const keyword = q.replace(/ /g, ' & ');
  const courses = await courseModel.search(keyword, limit, offset);
  const total = await courseModel.countSearch(keyword);
  const totalPages = Math.ceil(total / limit);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      value: i,
      isCurrent: i === page,
    });
  }

  res.render('vwCourse/search', {
    q: q,
    courses,
    empty: courses.length === 0,
    pages,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
    prevPage: page > 1 ? page - 1 : 1,
    nextPage: page < totalPages ? page + 1 : totalPages,
  });
});



//
router.get('/:id', async function (req, res) {
  const id = Number(req.params.id);
  if (!id) return res.redirect('/course/byCat');

  const course = await courseModel.findById(id);
  if (!course) return res.status(404).send('Course not found');
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }

  res.render('vwCourse/details', {
    course: course,
    parents: parents,
    childrenMap: childrenMap,
  });
});


export default router;
