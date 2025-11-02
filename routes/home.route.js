import supabase from "../config/supabase.js";

router.get("/", async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select("courseid, catid, numenrolled, thumbnail");
    if (error) throw error;

    // aggregate client-side
    const map = new Map();
    for (const c of courses || []) {
      const id = c.catid;
      const item = map.get(id) || { catid: id, total_enrolled: 0, course_count: 0, thumbnail: c.thumbnail };
      item.total_enrolled += Number(c.numenrolled || 0);
      item.course_count += 1;
      if (!item.thumbnail && c.thumbnail) item.thumbnail = c.thumbnail;
      map.set(id, item);
    }
    let topCategories = Array.from(map.values());
    topCategories.sort((a,b)=> b.total_enrolled - a.total_enrolled);
    topCategories = topCategories.slice(0,6);

    // fetch category names in bulk
    const catIds = topCategories.map(t=>t.catid).filter(Boolean);
    const { data: cats } = await supabase.from("categories").select("catid,catname").in("catid", catIds);
    const catMap = (cats||[]).reduce((acc, c)=> (acc[c.catid]=c.catname, acc), {});
    topCategories = topCategories.map(t => ({ ...t, catname: catMap[t.catid] || "Unknown" }));

    res.render("home", { topCategories, /* ...other vars... */ });
  } catch (err) {
    console.error(err);
    res.render("home", { topCategories: [], /* ...other vars... */ });
  }
});