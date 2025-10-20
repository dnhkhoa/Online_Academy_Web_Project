import db from '../utils/db.js';
  import supabase from '../config/supabase.js';
  import { DateTime } from "luxon";

  export async function addNewUser(user) {
    const createdAt = DateTime.now()
    .setZone("Asia/Ho_Chi_Minh")
    .toISO();

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name: user.fullname,
          username: user.username,
          email: user.email,
          password: user.password,
          role: 'student',
          createdat: createdAt
        }
      ]);
    return { data, error };
  }

export async function findUserByUsername(username) {
  // use case-insensitive match (ilike) and ensure trimmed lowercase
  const usernameNorm = (username || "").trim();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", usernameNorm) // ilike does case-insensitive match
    .single();
  return { data, error };
}