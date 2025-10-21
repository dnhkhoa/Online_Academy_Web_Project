// JS tối thiểu cho UI (Bootstrap 5 required)
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const form = $("#frmAddLesson");

  // Validate cơ bản & rule: phải chọn section có sẵn hoặc nhập tên mới
  form.addEventListener("submit", function (e) {
    // Bootstrap style validation
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }

    const sel = $("#selCourseSection");
    const txt = $("#txtNewSectionName");

    const selectedExisting = sel && sel.value.trim() !== "";
    const newNameProvided = txt && txt.value.trim() !== "";

    if (!selectedExisting && !newNameProvided) {
      e.preventDefault();
      e.stopPropagation();
      // highlight nhẹ
      sel.classList.add("is-invalid");
      txt.classList.add("is-invalid");
      if (!$("#sectionHelp")) {
        const help = document.createElement("div");
        help.id = "sectionHelp";
        help.className = "text-danger small mb-2";
        help.textContent =
          "Vui lòng chọn một section có sẵn hoặc nhập tên section mới.";
        sel.closest(".form-section").appendChild(help);
      }
    } else {
      // ghi sectionId nếu chọn existing
      const hiddenId = $("#resolvedSectionId");
      if (hiddenId) hiddenId.value = selectedExisting ? sel.value : "";
      sel.classList.remove("is-invalid");
      txt.classList.remove("is-invalid");
    }

    form.classList.add("was-validated");
  });

  // Xóa thông báo khi người dùng sửa
  ["change", "input"].forEach((evt) => {
    ["#selCourseSection", "#txtNewSectionName"].forEach((id) => {
      const el = $(id);
      el &&
        el.addEventListener(evt, () => {
          el.classList.remove("is-invalid");
          const help = $("#sectionHelp");
          if (help) help.remove();
        });
    });
  });

  // --- Add/Remove lessons (card-based) ---
  (function () {
    const list = document.getElementById("lessonList");
    const btnAdd = document.getElementById("btnAddLesson");
    if (!list || !btnAdd) return;

    function makeLessonCard() {
      const div = document.createElement("div");
      div.className = "lesson-item card shadow-sm border-0";
      div.innerHTML = `
      <div class="card-body">
        <div class="form-section">
          <label class="form-label">Lesson Name</label>
          <input type="text" class="form-control" placeholder="e.g., New Lesson" required />
        </div>
        <div class="row g-3">
          <div class="col-sm-4">
            <div class="form-section">
              <label class="form-label">Duration</label>
              <input type="text" class="form-control" placeholder="e.g., 09:00" />
            </div>
          </div>
          <div class="col-sm-8">
            <div class="form-section">
              <label class="form-label">YouTube URL (optional)</label>
              <input type="url" class="form-control" placeholder="https://youtu.be/..." />
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer bg-white d-flex justify-content-end">
        <button type="button" class="btn btn-sm btn-outline-danger btnRemoveLesson">
          <i class="bi bi-trash"></i> Remove
        </button>
      </div>
    `;
      return div;
    }

    btnAdd.addEventListener("click", () => {
      list.appendChild(makeLessonCard());
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".btnRemoveLesson");
      if (!btn) return;
      const item = btn.closest(".lesson-item");
      if (item && list.children.length > 1) {
        item.remove();
      }
    });
  })();
})();
