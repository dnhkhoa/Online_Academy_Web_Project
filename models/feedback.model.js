import supabase from "../config/supabase.js";
import { DateTime } from "luxon";
import db from "../utils/db.js";

export async function insert({ userid, courseid, rating, comment }) {
  const created_at = DateTime.now()
    .setZone("Asia/Ho_Chi_Minh")
    .toISO();

  const { data, error } = await supabase
    .from("feedbacks")      // phải đúng tên bảng ở Supabase
    .insert([
      {
        userid,
        courseid,
        rating,
        comment,
        created_at
      }
    ]);

  if (error) console.log("FB INSERT ERR:", error);
  return { data, error };
}

export async function findAllByCourse(courseid) {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("courseid", courseid);

  if (error) console.log("FB SELECT ERR:", error);
  return data;
}

//new
export function findByCourse(courseid) {
  return db('feedbacks')
    .leftJoin('users', 'feedbacks.userid', 'users.userid')
    .where('feedbacks.courseid', courseid)
    .select(
      'feedbacks.*',
      'users.full_name as user_name'
    )
    .orderBy('feedbacks.created_at', 'desc');
}