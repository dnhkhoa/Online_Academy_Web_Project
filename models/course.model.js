import db from '../utils/db.js';

export function findAll2() {
  return db('courses') ;
}

export function findAll(limit, offset) {
    return db('courses')
    .limit(limit)
    .offset(offset);
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

export function countByCat(catid) {
  return db('courses').where('catid', catid).count('* as total').first();
}

export function watchlistCoursesByUID(userid, limit, offset) {
    return db('watchlist')
      .join('courses', 'watchlist.courseid', 'courses.courseid')
      .where('watchlist.userid', userid)
      .select('courses.*')
      .limit(limit)
      .offset(offset);
  }
  
  export function removeWatchlistItem(userid, courseid) {
    return db('watchlist')
    .where({
      userid: userid,
      courseid: courseid
    })
    .del();
  }
  
  export async function addWatchlistItem(userid, courseid) {
    return db('watchlist')
    .insert({
      userid: userid,
      courseid: courseid,
      addedat: new Date()
    });
  }
export async function countWatchlistByUID(userid) {
    return db('watchlist')
    .where('userid', userid)
    .count('courseid', { as: 'count' })
    .first()
    .then((row) => row.count);
}

  export function enrolledCoursesByUID(userid, limit, offset) {
    return db('enrollments')
      .join('courses', 'enrollments.courseid', 'courses.courseid')
      .where('enrollments.userid', userid)
      .select('courses.*')
      .limit(limit)
      .offset(offset);
  }

  export async function countEnrolledByUID(userid) {
    return db('enrollments')
    .where('userid', userid)
    .count('courseid', { as: 'count' })
    .first()
    .then((row) => row.count);
  }

  export function search (keyword, limit, offset){
    return db('courses')
    .whereRaw ('fts @@ to_tsquery(remove_accent(?))', [keyword])
    .limit(limit)
    .offset(offset);
}

export function countSearch(keyword){
    return db('courses')
    .whereRaw ('fts @@ to_tsquery(remove_accent(?))', [keyword])
    .count('courseid', { as: 'count' })
    .first()
    .then((row) => row.count);
}

export function countAllCourses(){
    return db('courses')
    .count('courseid', { as: 'count' })
    .first()
    .then((row) => row.count);
}

export function applySort(qb, sort) {
  const s = String(sort || '').toLowerCase();
  if (s === 'newest') {
    qb.orderBy('createdat', 'desc');
  } else if (s === 'rating'){
    qb.orderBy('rating', 'desc');
  }
  else {
    qb.orderBy('courseid');
  }
}

export function searchSorted(keyword, sort, limit, offset) {
  const qb = db('courses').whereRaw('fts @@ to_tsquery(remove_accent(?))', [keyword]);
  applySort(qb, sort);
  return qb.limit(limit).offset(offset);
}

export function addEnrolledItem(userid, courseid) {
    return db('enrollments')
    .insert({
      userid: userid,
      courseid: courseid,
      enrolledat: new Date()
    });
}

export async function isEnrolledItem(userid, courseid) {
    const row = await db('enrollments')
    .where({
      userid: userid,
      courseid: courseid
    })
    .first();
    return !!row;
}

export function removeEnrolledItem(userid, courseid) {
    return db('enrollments')
    .where({
      userid: userid,
      courseid: courseid
    })
    .del();
}

// Lấy tên giảng viên theo courseid với join bảng users điều kiện: courses.instructorid = users.userid
export async function InstructorName(courseid) {
  const row = await db('courses')
    .join('users', 'courses.instructorid', 'users.userid')
    .where('courses.courseid', courseid)
    .select('users.full_name')
    .first();
  return row ? row.full_name : null;
}

export async function addCartItem(userid, courseid, status, subtotal, discount, tax, total) {
  return db('orders')
  .insert({
    userid: userid,
    courseid: courseid,
    status: status,
    subtotal: subtotal,
    discount: discount,
    tax: tax,
    total: total,
    currency: "VND",
    createdat: new Date(),
    updatedat: new Date()
  });
}

export function cartItemsByUID(userid) {
  return db('orders')
    .join('courses', 'orders.courseid', 'courses.courseid')
    .where('orders.userid', userid)
    .select('courses.*', 'orders.status', 'orders.subtotal', 'orders.discount', 'orders.tax', 'orders.total');
}

export async function getCartIDByCourseIDAndUserID(courseid,userid) {
  return db('orders')
    .where({
      userid: userid,
      courseid: courseid
    })
    .select('orderid')
    .first();
}

export function removeCartItem(userid, courseid) {
  return db('orders')
  .where({
    userid: userid,
    courseid: courseid
  })
  .del();
}

export async function removeCartByUserID(userid) {
  return db('orders')
  .where({
    userid: userid
  })
  .del();
}


export async function getTop10ByViews() {
  return db('courses')
    .select('*')
    .orderBy('view', 'desc')
    .limit(10);
}

export async function increaseView(courseId) {
  await db('courses')
    .where('courseid', courseId)
    .increment('view', 1);
}

export async function updateNumEnrolled() {
  await db('courses').update('numenrolled', 0);

  await db.raw(`
    UPDATE courses
    SET numenrolled = sub.count
    FROM (
      SELECT courseid, COUNT(*) AS count
      FROM enrollments
      GROUP BY courseid
    ) AS sub
    WHERE courses.courseid = sub.courseid
  `);
}

export async function getTop10ByEnrolled() {
  return db('courses')
    .select('*')
    .orderBy('numenrolled', 'desc')
    .limit(10);
}

export async function get10NewestCourses() {
  return db('courses')
    .select('*')
    .orderBy('createdat', 'desc')
    .limit(10);
}

export async function get3TopCourses() {
  return db('courses')
    .select('*')
    .orderBy('view', 'desc')
    .limit(3);
}

// ✅ lấy list giảng viên
export async function getInstructors() {
  return db('courses')
    .join('users', 'courses.instructorid', 'users.userid')
    .whereNotNull('courses.instructorid')
    .distinct('users.userid', 'users.full_name')
    .orderBy('users.full_name', 'asc');
}

// ✅ lấy course theo giảng viên (có phân trang)
export async function findByInstructor(instructorid, limit, offset) {
  return db('courses')
    .where('instructorid', instructorid)
    .limit(limit)
    .offset(offset)
    .orderBy('courseid', 'asc');
}

// --- Admin helpers ---
export async function setCourseStatus(courseid, status) {
  return db('courses').where('courseid', courseid).update({ status });
}

export async function adminListCourses() {
  return db('courses as c')
    .leftJoin('users as u', 'c.instructorid', 'u.userid')
    .leftJoin('categories as k', 'c.catid', 'k.catid')
    .select(
      'c.courseid','c.title','c.status','c.view','c.createdat','c.lastupdate',
      'u.full_name as instructor_name',
      'k.catname as category_name'
    )
    .orderBy('c.createdat','desc');
}
