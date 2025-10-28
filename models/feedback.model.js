import supabase from "../config/supabase.js";
import { DateTime } from "luxon";

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

// add this alias so existing routes using findByCourse keep chạy
export async function findByCourse(courseid) {
  return await findAllByCourse(courseid);
}
