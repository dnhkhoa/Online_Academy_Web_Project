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
  return db('users').where('username', username).first();
}

export async function findUserByEmail(email) {
  const emailNorm = (email || "").trim().toLowerCase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", emailNorm) 
    .single();
  return { data, error };
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("userid", id)   // vì PK là userid
    .single();

  return { data, error };
}

export async function userbyID(uid) {
  return db('users').where('userid', uid).first();
}

export function updateUserProfile(id, user) {
  return db('users').where('userid', id).update(user);
}

export async function findUsersByRole(role) {
  return db('users').where('role', role).orderBy('createdat', 'desc');
}

export async function setUserLock(id, locked) {
  return db('users')
    .where('userid', id)
    .update({ islocked: locked ? 1 : 0 });
}