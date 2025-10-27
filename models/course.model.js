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

export function countByCat(catid) {
  return db('courses').where('catid', catid).count('* as total').first();
}

export function watchlistCoursesByUID(userid) {
    return db('watchlist')
      .join('courses', 'watchlist.courseid', 'courses.courseid')
      .where('watchlist.userid', userid)
      .select('courses.*');
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

  export function enrolledCoursesByUID(userid) {
    return db('enrollments')
      .join('courses', 'enrollments.courseid', 'courses.courseid')
      .where('enrollments.userid', userid)
      .select('courses.*');
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

export function addEnrolledItem(userid, courseid) {
    return db('enrollments')
    .insert({
      userid: userid,
      courseid: courseid,
      enrolledat: new Date()
    });
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
  return row ? row.fullname : null;
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