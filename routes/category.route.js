import express from 'express';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

//Danh sách cat tầng 1
router.get('/', async function (req, res) {
    const parents = await categoryModel.findAllParents();
    res.render('vwAdminCategory/parents', {
        parents: parents
    });
});

//Danh sách cat tầng 2
router.get('/children', async function (req, res) {
    const parentid = req.query.parentid || 0;
    const parent = await categoryModel.findById(parentid);
    let children = [];
    if (parent) {
        children = await categoryModel.findChildrenByParent(parentid)
    }
    res.render('vwAdminCategory/children', {
        parent: parent,
        children: children
    });
});

// Thêm cat
router.get('/add', async function (req, res) {
    let parentid = null;
    let parent = null;
    if (req.query.parentid) {
        parentid = req.query.parentid;
        parent = await categoryModel.findById(parentid)
    }
    res.render('vwAdminCategory/add', {
        parent: parent
    });
});
router.post('/add', async function (req, res) {
    let parentid = null;
    if(req.body.parentid){
        parentid = req.body.parentid
    }
    const category = {
        catname: req.body.catname,
        parentid: parentid? parentid : null
    };
    await categoryModel.add(category);
    if (parentid){
        res.redirect(`/admin/categories/children?parentid=${parentid} `);
    } 
    else {
        res.redirect('/admin/categories');
    }
});

//Chỉnh sửa cat
router.get('/edit', async function (req, res) {
    let id = 0;
    if(req.query.id){
        id = req.query.id;
    }
    const category = await categoryModel.findById(id);
    if(!category){
        res.redirect('/admin/categories');
        return;
    }
    let parent = null;
    if(category.parentid){
        parent = await categoryModel.findById(category.parentid);
    }

    res.render('vwAdminCategory/edit',{
        category:category,
        parent: parent,
    });
});
router.post('/patch', async function (req, res) {
    let id = 0;
    let parentid = null;
    if(req.body.catid){
        id = req.body.catid;
    }
    if(req.body.parentid){
        parentid = req.body.parentid;
    }
    const changes = {
        catname: req.body.catname,
        parentid: parentid,
    }
    await categoryModel.patch(id,changes)
    if (parentid) {
        res.redirect(`/admin/categories/children?parentid=${parentid}`);
    } else {
        res.redirect('/admin/categories')
    }
});

//Xóa cat
router.post('/del', async function (req, res) {
    let id = 0;
    let parentid = null;
    if(req.body.catid){
        id = req.body.catid;
    }
    if (req.body.parent){
        parentid = req.body.parentid;
    }
    await categoryModel.del(id);

    if (parentid){
        res.redirect(`/admin/categories/children?parentid=${parentid}`);
    } 
    else {
        res.redirect('/admin/categories')
    }
});

export default router;
