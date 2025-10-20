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
    return db('categories').insert(category).returning(['catid']) ;
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
//kiểm tra id tồn tại
export async function existsId(id) {
  if (!id) return false;
  const row = await db('categories').where('catid', id).first();
  return !!row;
}

// kiểm tra trung
export async function existsName(parentid, catname, excludeId = null) {
  const q = db('categories').whereRaw('LOWER(catname) = LOWER(?)', [catname.trim()]);
  if (parentid == null) q.whereNull('parentid'); else q.where('parentid', parentid);
  if (excludeId) q.whereNot('catid', excludeId);
  const row = await q.first();
  return !!row;
}


