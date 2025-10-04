import db from '../utils/db.js';

// Lấy về tất cả các danh mục
export function findAll() {
    return db('categories');
}

// Lấy về danh mục theo id
export function findById(id) {
    return db('categories').where('catid', id).first();
}

//Thêm mới danh mục
export function add(category) {
    return db('categories').insert(category);
}

//cập nhật danh mục
export function patch(id, category) {
    return db('categories').where('catid', id).update(category);
}
//xóa danh mục
export function del(id) {
    return db('categories').where('catid', id).del();
}

//2 tầng

export function findAllParents() {
    return db('categories').whereNull('parentid');
}
export function findChildrenByParent(parentid) {
    return db('categories')
        .where('parentid', parentid);
}