(function () {
  const form = document.getElementById("frmEditLesson");
  const lessonList = document.getElementById("lessonList");
  const removedBin = document.getElementById("removedLessonsBin");
  const btnDeleteSection = document.getElementById("btnDeleteSection");
  const deleteSectionInput = document.getElementById("deleteSection");
  const sectionDeleteNote = document.getElementById("sectionDeleteNote");

  // Validate
  form.addEventListener("submit", function (e) {
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }
    form.classList.add("was-validated");
  });

  // Remove single lesson (no add)
  lessonList.addEventListener("click", function (e) {
    const btn = e.target.closest(".btnRemoveLesson");
    if (!btn) return;

    const card = btn.closest(".lesson-item");
    const lessonId = card?.getAttribute("data-lesson-id") || "";
    const title =
      card?.querySelector('input[type="text"]')?.value || "this lesson";

    if (!confirm(`Remove "${title}"?`)) return;

    // mark for deletion -> append hidden input; then remove from UI
    if (lessonId) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "removedLessonIds[]";
      hidden.value = lessonId;
      removedBin.appendChild(hidden);
    }
    card.remove();
  });

  // Delete ENTIRE section
  btnDeleteSection.addEventListener("click", function () {
    const ok = confirm(
      "This will DELETE the entire section and ALL its lessons. Continue?"
    );
    if (!ok) return;

    // Đánh dấu xoá section
    deleteSectionInput.value = "1";

    // Hiển thị cảnh báo & khóa UI nhập liệu (nhưng vẫn cho Back/Reset/Save)
    sectionDeleteNote.classList.remove("d-none");
    document.body.classList.add("section-deleting");
  });
})();
