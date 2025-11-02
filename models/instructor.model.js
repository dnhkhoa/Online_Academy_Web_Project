import db from '../utils/db.js';

export async function findById(userid) {
    return await db('instructors')
      .leftJoin('users', 'instructors.userid', 'users.userid')
      .select(
        'instructors.*',
        'users.full_name as full_name',
        'users.email as email'
      )
      .where('instructors.userid', userid)
      .first();
  }

export function getInstructorID(courseId) {
    return db('courses')
      .join('instructors', 'courses.instructorid', 'instructors.id')
      .select('instructors.id as instructorId')
      .where('courses.id', courseId)
      .first();
}

export function getInstructorName(id) {
    return db('instructors')
      .join('users', 'instructors.userid', 'users.userid')
      .select('users.full_name as instructorName')
      .where('instructors.userid', id)
      .first();
}

export function getInstructorEmail(id) {
    return db('instructors')
      .join('users', 'instructors.userid', 'users.userid')
      .select('users.email as instructorEmail')
      .where('instructors.userid', id)
      .first();
}

// Update helper: update instructor profile by userid
export function updateByUserId(userid, changes) {
  return db('instructors').where('userid', userid).update(changes);
}

// Upsert helper: insert if not exists, else update
export async function upsertByUserId(userid, entity) {
  const existing = await db('instructors').where('userid', userid).first();
  if (existing) {
    await db('instructors').where('userid', userid).update(entity);
    return { updated: true };
  }
  await db('instructors').insert({ userid, ...entity });
  return { inserted: true };
}
