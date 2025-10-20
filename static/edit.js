(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    const form = document.getElementById("frmEditCategory");
    if (!form) return;

    // ====== ELEMENTS ======
    // Parent
    const txtParentName = form.querySelector("#txtParentName");
    const parentId = form.querySelector("#parentId");
    const txtParentId = document.getElementById("txtParentId");

    // Toggle child
    const toggleChild = form.querySelector("#toggleChild");
    const childPicker = form.querySelector("#childPicker");
    const filterChild = form.querySelector("#filterChild");
    const selChild = form.querySelector("#selChild");
    const txtChildName = form.querySelector("#txtChildName");
    const isEditingChildHidden = form.querySelector("#isEditingChildHidden");
    const btnDeleteChild = form.querySelector("#btnDeleteChild");
    const boundChildId = form.querySelector("#boundChildId");

    // Toggle course
    const courseToggleRow = form.querySelector("#courseToggleRow");
    const toggleCourse = form.querySelector("#toggleCourse");
    const coursePicker = form.querySelector("#coursePicker");
    const filterCourse = form.querySelector("#filterCourse");
    const selCourse = form.querySelector("#selCourse");
    const isEditingCourseHidden = form.querySelector("#isEditingCourseHidden");
    const btnDeleteCourse = form.querySelector("#btnDeleteCourse");
    const boundCourseId = form.querySelector("#boundCourseId");

    // Course fields
    const panelMedia = document.getElementById("panelMedia");
    const panelCourseMain = document.getElementById("panelCourseMain");
    const panelRich = document.getElementById("panelRich");
    const txtCourseTitle = document.getElementById("txtCourseTitle");
    const txtThumbnailUrl = document.getElementById("txtThumbnailUrl");
    const previewImg = document.getElementById("previewImg");
    const txtTinyDes = document.getElementById("txtTinyDes");
    const txtFullDes = document.getElementById("txtFullDes");
    const numPrice = document.getElementById("numPrice");
    const numDiscount = document.getElementById("numDiscount");
    const txtStatus = document.getElementById("txtStatus");

    // Action buttons & hidden bindings (KHAI BÁO TRƯỚC KHI GẮN LISTENER)
    const btnSave = form.querySelector("#btnSave");
    const btnDeleteParent = form.querySelector("#btnDeleteParent");
    const hidCatId = form.querySelector("#hidCatId");
    const hidParentId = form.querySelector("#hidParentId");
    const hidCatName = form.querySelector("#hidCatName");

    // ===== MOCK DATA (demo; có thể bỏ khi tích hợp API thật) =====
    const COURSES = {
      11: [
        { courseid: "201", title: "Web cơ bản", tinydes: "Tiny MCE", fulldes: "TinyMCE", price: 1200000, discount: 200000, thumbnail: "", status: "published" },
        { courseid: "202", title: "Web nâng cao", tinydes: "Tiny MCE", fulldes: "TinyMCE", price: 2200000, discount: 0, thumbnail: "", status: "draft" },
      ],
      12: [
        { courseid: "301", title: "Android Kotlin", tinydes: "Tiny MCE", fulldes: "TinyMCE", price: 2400000, discount: 300000, thumbnail: "", status: "published" },
      ],
      13: [],
    };
    // ============================================================

    // ====== UTILS ======
    function show(el, on) {
      if (!el) return;
      el.classList.toggle("d-none", !on);
    }

    // ====== CHILD (L2) ======
    function filterChildOptions(keyword = "") {
      const kw = (keyword || "").toLowerCase().trim();
      Array.from(selChild.options).forEach((opt) => {
        const text = (opt.textContent || "").toLowerCase();
        opt.hidden = !!kw && !text.includes(kw);
      });
      const cur = selChild.options[selChild.selectedIndex];
      if (cur && cur.hidden) {
        const first = Array.from(selChild.options).find((o) => !o.hidden);
        selChild.value = first ? first.value : "";
      }
    }

    function onToggleChild() {
      const on = !!(toggleChild && toggleChild.checked);
      if (isEditingChildHidden) isEditingChildHidden.value = on ? "1" : "0";

      show(childPicker, on);
      show(courseToggleRow, on);

      if (!on) {
        if (selChild) selChild.value = "";
        if (filterChild) filterChild.value = "";
        if (txtChildName) txtChildName.value = "";
        if (boundChildId) boundChildId.value = "";

        if (toggleCourse) toggleCourse.checked = false;
        onToggleCourse();

        show(btnDeleteChild, false);
        show(courseToggleRow, false);
        return;
      }

      if (selChild && !selChild.value) {
        const first = Array.from(selChild.options || []).find((o) => !o.hidden);
        if (first) selChild.value = first.value;
      }
      onSelectChild();
    }

    function onFilterChild() {
      if (!toggleChild || !toggleChild.checked) return;
      filterChildOptions(filterChild.value);
      onSelectChild();
    }

    function onSelectChild() {
      if (!selChild) return;
      const id = selChild.value;
      const opt = selChild.options[selChild.selectedIndex];
      const hasChild = !!(opt && opt.value);

      if (txtChildName) txtChildName.value = hasChild ? (opt.textContent || "") : "";
      if (boundChildId) boundChildId.value = hasChild ? id : "";

      show(courseToggleRow, hasChild);
      show(btnDeleteChild, !!(toggleChild && toggleChild.checked && hasChild));

      if (toggleCourse && toggleCourse.checked) populateCourses();
    }

    // ====== COURSE ======
    function populateCourses(keyword = "") {
      const childId = boundChildId ? boundChildId.value : "";
      const list = COURSES[childId] || [];
      const kw = (keyword || "").toLowerCase();

      if (!selCourse) return;
      selCourse.innerHTML = "";
      list
        .filter((c) => !kw || (c.title || "").toLowerCase().includes(kw))
        .forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.courseid;
          opt.textContent = `${c.courseid} — ${c.title}`;
          selCourse.appendChild(opt);
        });

      if (selCourse.options.length) {
        selCourse.disabled = false;
        selCourse.selectedIndex = 0;
        onSelectCourse();
      } else {
        selCourse.disabled = true;
        fillCourseFields(null);
      }
    }

    function onToggleCourse() {
      const on = !!(toggleCourse && toggleCourse.checked && boundChildId && boundChildId.value);
      if (isEditingCourseHidden) isEditingCourseHidden.value = on ? "1" : "0";

      show(coursePicker, on);
      show(panelMedia, on);
      show(panelCourseMain, on);
      show(panelRich, on);
      show(btnDeleteCourse, on);

      if (on) populateCourses();
      else fillCourseFields(null);
    }

    function onFilterCourse() {
      if (!toggleCourse || !toggleCourse.checked) return;
      populateCourses(filterCourse.value);
    }

    function onSelectCourse() {
      if (!selCourse || !boundChildId) return;
      const id = selCourse.value;
      const childId = boundChildId.value;
      const list = COURSES[childId] || [];
      const course = list.find((x) => x.courseid === id) || null;
      fillCourseFields(course);
    }

    function fillCourseFields(course) {
      if (!course) {
        if (boundCourseId) boundCourseId.value = "";
        if (txtCourseTitle) txtCourseTitle.value = "";
        if (txtThumbnailUrl) txtThumbnailUrl.value = "";
        if (previewImg)
          previewImg.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=80";
        if (txtTinyDes) txtTinyDes.value = "Tiny MCE";
        if (txtFullDes) txtFullDes.value = "TinyMCE";
        if (numPrice) numPrice.value = "";
        if (numDiscount) numDiscount.value = "";
        if (txtStatus) txtStatus.value = "";
        return;
      }
      if (boundCourseId) boundCourseId.value = course.courseid;
      if (txtCourseTitle) txtCourseTitle.value = course.title || "";
      if (txtThumbnailUrl) txtThumbnailUrl.value = course.thumbnail || "";
      if (previewImg && course.thumbnail) previewImg.src = course.thumbnail;
      if (txtTinyDes) txtTinyDes.value = course.tinydes || "Tiny MCE";
      if (txtFullDes) txtFullDes.value = course.fulldes || "TinyMCE";
      if (numPrice) numPrice.value = course.price ?? "";
      if (numDiscount) numDiscount.value = course.discount ?? "";
      if (txtStatus) txtStatus.value = course.status || "";
    }

    // Preview khi nhập URL thumbnail
    if (txtThumbnailUrl && previewImg) {
      txtThumbnailUrl.addEventListener("input", () => {
        const url = (txtThumbnailUrl.value || "").trim();
        if (url) previewImg.src = url;
      });
    }

    // ====== CLICK HANDLERS (gán payload ngay khi bấm nút) ======
    btnDeleteParent?.addEventListener("click", () => {
      if (!parentId || !parentId.value) return;
      if (!hidCatId || !hidParentId || !hidCatName) return;
      hidCatId.value = parentId.value; // catid = parent
      hidParentId.value = "";          // null tại BE
      hidCatName.value = "";
    });

    btnDeleteChild?.addEventListener("click", (e) => {
      if (!hidCatId || !hidParentId || !hidCatName) return;
      const childId = selChild?.value;
      const pId = parentId?.value;
      if (!childId) {
        e.preventDefault();
        alert("Hãy chọn child (L2) để xóa.");
        return;
      }
      hidCatId.value = childId;        // catid = child
      hidParentId.value = pId || "";
      hidCatName.value = "";
    });

    form.addEventListener("submit", (e) => {
      const isChildEditing = isEditingChildHidden && isEditingChildHidden.value === "1";
      const isSaving =
        e.submitter === btnSave ||
        (e.submitter && e.submitter.formAction && e.submitter.formAction.endsWith("/admin/categories/patch"));

      if (isSaving) {
        if (!parentId || !hidCatId || !hidParentId || !hidCatName) return;

        if (isChildEditing) {
          // === SAVE CHILD ===
          const childId = selChild ? selChild.value : "";
          if (!childId) {
            e.preventDefault();
            alert("Hãy chọn child (L2) để lưu.");
            return;
          }
          const childText =
            (txtChildName && txtChildName.value.trim()) ||
            (selChild && selChild.options[selChild.selectedIndex]
              ? selChild.options[selChild.selectedIndex].textContent.trim()
              : "");

          hidCatId.value = childId;             // catid = child
          hidParentId.value = parentId.value;   // parentid = parent
          hidCatName.value = childText;         // catname
        } else {
          // === SAVE PARENT ===
          hidCatId.value = parentId.value;              // catid = parent
          hidParentId.value = "";                       // parentid = NULL
          hidCatName.value = (txtParentName?.value || "").trim(); // catname
        }
      }


      // Delete child
      if (
        e.submitter === btnDeleteChild ||
        (e.submitter && e.submitter.formAction && e.submitter.formAction.endsWith("/admin/categories/del") && editingChild && e.submitter.id === "btnDeleteChild")
      ) {
        const childId = selChild ? selChild.value : "";
        if (!childId) {
          e.preventDefault();
          alert("Hãy chọn child (L2) để xóa.");
          return;
        }
        hidCatId.value = childId;
        hidParentId.value = pId;
        hidCatName.value = "";
      }
    });

    // ====== INIT ======
    if (txtParentId && parentId) txtParentId.textContent = parentId.value;

    toggleChild && toggleChild.addEventListener("change", onToggleChild);
    filterChild && filterChild.addEventListener("input", onFilterChild);
    selChild && selChild.addEventListener("change", onSelectChild);

    toggleCourse && toggleCourse.addEventListener("change", onToggleCourse);
    filterCourse && filterCourse.addEventListener("input", onFilterCourse);
    selCourse && selCourse.addEventListener("change", onSelectCourse);

    onToggleChild();  // mặc định: chỉnh parent
    onToggleCourse(); // đảm bảo panel course tắt khi chưa có child
  });
})();
