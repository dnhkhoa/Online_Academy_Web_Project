import express from 'express';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

//Trang danh danh sách tất cả cate
router.get('/', async function(req, res){
    const list = await categoryModel.findAll();
    res.render('vwCategory/list', {
        categories: list
    });
});

//Thêm mới
router.get('/add', function(req, res){
    res.render('vwCategory/add');
});
router.post('/add', async function(req, res){
    const category = {
       catname: req.body.catname
    }
    await categoryModel.add(category);
    res.redirect('/admin/categories');
}); 

//cập nhật
router.get('/edit', async function(req, res){
    const id = req.query.id || 0;
    const category = await categoryModel.findById(id);
    if(!category){
        return res.redirect('/admin/categories');
    }
    res.render('vwCategory/edit', {
        category:category
    });
});
router.post('/patch', async function(req, res){
    const id = req.body.catid;
    const category = {
       catname: req.body.catname
    }
    await categoryModel.patch(id, category);
    res.redirect('/admin/categories');
});

//xóa
router.post('/del', async function (req, res){
    const id = req.body.catid;
    await categoryModel.del(id);
    res.redirect('/admin/categories')
});

export default router;

