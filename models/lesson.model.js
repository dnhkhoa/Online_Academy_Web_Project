import db from '../utils/db.js';

export function findBySections(sectionIds = []) {
  if (!sectionIds.length) return Promise.resolve([]);
  return db('lessons').whereIn('sectionid', sectionIds).orderBy('lessonid', 'asc');
}

export function findOne(lessonid) {
  return db('lessons').where({ lessonid }).first();
}
export function findBySection(sectionid) {
  return db('lessons').where({ sectionid }).orderBy('lessonid', 'asc');
}


export function add(lesson) {
  return db('lessons').insert(lesson)
}
export function patch(lessonid, lesson) {
  return db('lessons').where({ lessonid }).update(lesson).returning('*');
}

export function del(lessonid) {
  return db('lessons').where({ lessonid }).del();
}
export function delBySection(sectionid) {
  return db('lessons').where({ sectionid }).del();
}