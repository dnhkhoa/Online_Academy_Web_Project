import db from '../utils/db.js';
import supabase from '../config/supabase.js';

export async function addNewUser(user) {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        password: user.password
      }
    ]);
  return { data, error };
}