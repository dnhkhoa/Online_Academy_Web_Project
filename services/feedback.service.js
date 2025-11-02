import * as feedbackModel from "../models/feedback.model.js";
import { findAllByCourse } from "../models/feedback.model.js";

export async function getCourseFeedbackSummary(courseId) {
  const rows = await findAllByCourse(courseId);
  if (!rows?.length) return { avg: 0, count: 0, comments: [] };

  const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;

  return {
    avg: Number(avg.toFixed(1)),
    count: rows.length,
    comments: rows
  };
}