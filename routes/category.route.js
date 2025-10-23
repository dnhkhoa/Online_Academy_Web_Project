import express from 'express';
import * as categoryModel from '../models/category.model.js';
import * as courseModel from '../models/course.model.js';
const router = express.Router();

// list
router.get('/list', async function (req, res) {
  const parents = await categoryModel.findAllParents();
  const children = {};
  for (const p of parents) {
    children[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  res.render('vwAdminCategory/list', {
    parents: parents,
    childrenMap: children
  });
});

// add
router.get('/add', async function (req, res) {
  const parents = await categoryModel.findAllParents();
  const childrenMap = {};
  for (const p of parents) {
    childrenMap[p.catid] = await categoryModel.findChildrenByParent(p.catid);
  }
  res.render('vwAdminCategory/add', {
    parents: parents,
    childrenMap: childrenMap,
    presetMode: 'category'
  });
});

router.post('/add', async function (req, res) {
  const parentid = req.body.parentid ? Number(req.body.parentid) : null;
  const category = { catname: req.body.catname, parentid };
  await categoryModel.add(category);
  return res.redirect('/admin/categories/list');
});
//Lấy child theo parentid
router.get('/children.json', async function (req, res) {
  try {
    const parentid = Number(req.query.parentid || 0);
    if (!parentid) return res.json([]);
    const children = await categoryModel.findChildrenByParent(parentid);
    res.json(children || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//Chỉnh sửa cat
router.get('/edit', async function (req, res) {
  const parentid = Number((req.query.parentid || req.query.id || 0).toString());
  if (!parentid) return res.redirect('/admin/categories/list');

  const parent = await categoryModel.findById(parentid);
  if (!parent) return res.redirect('/admin/categories/list');

  const children = await categoryModel.findChildrenByParent(parentid);
  res.render('vwAdminCategory/edit', {
    parent: parent,
    children: children
  });
});

router.post('/patch', async function (req, res) {
  const id = Number((req.body.catid || 0).toString());
  const catname = (req.body.catname || '').trim();
  const parentid = (req.body.parentid ?? '').toString().trim();
  const category = {
    catname: catname,
    parentid: parentid ? Number(parentid) : null
  };
  await categoryModel.patch(id, category);

  res.redirect('/admin/categories/list');
});

router.post('/del', async function (req, res) {
  const id = Number((req.body.catid || 0).toString());
  try {
    await categoryModel.del(id);
    res.redirect('/admin/categories/list');
  } catch (err) {
    if (err.message.includes('foreign key constraint')) {
      const parent = await categoryModel.findById(id);
      const children = await categoryModel.findChildrenByParent(id);
      return res.render('vwAdminCategory/edit', {
        parent: parent,
        children: children,
        errorMsg: 'This category cannot be deleted because it has courses belonging to it.'
      });
    }
  }
});
export default router;