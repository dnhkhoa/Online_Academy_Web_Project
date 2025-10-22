import db from '../utils/db.js';

export function findByCourse(courseid) {
  return db('course_sections')
    .where({ courseid })
    .orderByRaw('"order" ASC NULLS LAST'); 
}

export function findBySectionId(sectionid) {
  return db('course_sections').where({ sectionid }).first();
}
export function add(section) {
  return db('course_sections').insert(section).returning('*');
}
export function patch(sectionid, section) {
  return db('course_sections').where({ sectionid }).update(section).returning('*');
}