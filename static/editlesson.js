// /static/editLesson.js
(function () {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById("frmEditLesson");
    if (!form) return;

    const sectionIdInput = form.querySelector("#sectionId");
    const courseIdInput = form.querySelector("#courseId");
    const targetInput = form.querySelector("#targetLessonId");

    // ====== EDIT SECTION ======
    document.getElementById("btnEditSection")?.addEventListener("click", function (e) {
      e.preventDefault();
      form.setAttribute("action", "/course/section/edit");
      targetInput.value = "";
      form.submit();
    });

    // ====== DELETE SECTION ======
    document.getElementById("btnDeleteSection")?.addEventListener("click", function (e) {
      e.preventDefault();
      if (!sectionIdInput?.value) return;
      if (!window.confirm("Delete this section and all its lessons?")) return;

      form.setAttribute("action", "/course/section/delete");
      targetInput.value = "";
      form.submit();
    });

    // ====== DELEGATION TRONG LIST LESSONS ======
    const lessonList = document.getElementById("lessonList");

    // 1) EDIT 1 LESSON
    lessonList?.addEventListener("click", function (e) {
      const btn = e.target.closest(".btnSaveLesson");
      if (!btn) return;

      e.preventDefault();

      const lid = btn.getAttribute("data-lesson-id");
      if (!lid) return;

      // Đảm bảo khi checkbox không tick, vẫn gửi previews[lid] = 0
      const cb = form.querySelector(
        `.lesson-item[data-lesson-id="${lid}"] input[type="checkbox"][name="previews[${lid}]"]`
      );
      if (!cb || !cb.checked) {
        form.querySelectorAll(
          `input[name="previews[${lid}]"][type="hidden"]`
        ).forEach((n) => n.remove());
        const h = document.createElement("input");
        h.type = "hidden";
        h.name = `previews[${lid}]`;
        h.value = "0";
        form.appendChild(h);
      }

      form.setAttribute("action", "/course/lesson/editLesson");
      targetInput.value = String(lid);
      form.submit();
    });

    // 2) DELETE 1 LESSON
    lessonList?.addEventListener("click", function (e) {
      const btn = e.target.closest(".btnRemoveLesson");
      if (!btn) return;

      e.preventDefault();

      const card = btn.closest(".lesson-item");
      if (!card) return;

      const lid = card.getAttribute("data-lesson-id");
      if (!lid) return;

      if (!window.confirm("Delete this lesson?")) return;

      form.setAttribute("action", "/course/lesson/deleteOne");
      targetInput.value = String(lid);
      form.submit();
    });
  });
})();
