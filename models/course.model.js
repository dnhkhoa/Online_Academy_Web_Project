import db from '../utils/db.js';

export function findAll() {
    return db('courses');
}

export function findById(id) {
    return db('courses').where('courseid', id).first();
}

export function add(course) {
    return db('courses').insert(course).returning(['courseid'])
}

export function patch(id, course) {
    return db('courses').where('courseid', id).update(course);
}

export function del(id) {
  return db('courses').where('courseid', id).del();
}

// Lấy danh sách khóa học theo category con
export function findByCat(catid) {
  return db('courses').where('catid', catid).orderBy('courseid');
}

export async function findByCats(catids = []) {
  if (!catids.length) return [];
  return db('courses').whereIn('catid', catids).orderBy('courseid');
}