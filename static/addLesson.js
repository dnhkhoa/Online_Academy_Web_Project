// static/addLesson.js
// JS tối thiểu cho UI (Bootstrap 5 required)
(function () {
  const $ = (s, c = document) => c.querySelector(s);

  const form = $("#frmAddLesson");
  if (!form) return;

  // [CHANGED] - các selector khớp với template mới
  const sel = $("#selCourseSection");      // existing section
  const txt = $("#txtNewSectionName");     // new section name
  const hiddenResolved = $("#resolvedSectionId"); // hidden sectionId cho BE
  const inputTitle = $("#txtLessonTitle"); // [ADDED] lesson title

  form.addEventListener("submit", function (e) {
    // Bootstrap style validation
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }

    const selectedExisting = sel && sel.value.trim() !== "";
    const newNameProvided = txt && txt.value.trim() !== "";

    // [ADDED] - validate lesson title
    if (!inputTitle || !inputTitle.value.trim()) {
      e.preventDefault();
      e.stopPropagation();
      inputTitle?.classList.add("is-invalid");
      return;
    } else {
      inputTitle.classList.remove("is-invalid");
    }

    if (!selectedExisting && !newNameProvided) {
      e.preventDefault();
      e.stopPropagation();
      sel?.classList.add("is-invalid");
      txt?.classList.add("is-invalid");
      return;
    } else {
      if (hiddenResolved) hiddenResolved.value = selectedExisting ? sel.value : "";
      sel?.classList.remove("is-invalid");
      txt?.classList.remove("is-invalid");
    }

    form.classList.add("was-validated");
  });

  // Xóa thông báo khi người dùng sửa
  ["change", "input"].forEach((evt) => {
    [sel, txt, inputTitle].forEach((el) => {
      el &&
        el.addEventListener(evt, () => {
          el.classList.remove("is-invalid");
        });
    });
  });
})();
