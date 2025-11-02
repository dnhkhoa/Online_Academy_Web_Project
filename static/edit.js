(function () {
  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  onReady(function () {
    const form = document.getElementById("frmEditCategory");
    if (!form) return;

    // ===== ELEMENTS =====
    const txtParentName = form.querySelector("#txtParentName");
    const parentId = form.querySelector("#parentId");

    const toggleChild = form.querySelector("#toggleChild");
    const childPicker = form.querySelector("#childPicker");
    const filterChild = form.querySelector("#filterChild");
    const selChild = form.querySelector("#selChild");
    const txtChildName = form.querySelector("#txtChildName");
    const isEditingChildHidden = form.querySelector("#isEditingChildHidden");
    const btnDeleteChild = form.querySelector("#btnDeleteChild");
    const boundChildId = form.querySelector("#boundChildId");

    const courseToggleRow = form.querySelector("#courseToggleRow");
    const toggleCourse = form.querySelector("#toggleCourse");
    const coursePicker = form.querySelector("#coursePicker");
    const filterCourse = form.querySelector("#filterCourse");
    const selCourse = form.querySelector("#selCourse"); // select KHÔNG có name
    const isEditingCourseHidden = form.querySelector("#isEditingCourseHidden");
    const btnDeleteCourse = form.querySelector("#btnDeleteCourse");
    const boundCourseId = form.querySelector("#boundCourseId"); // hidden có name="courseId"

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

    const btnSave = form.querySelector("#btnSave");
    const btnDeleteParent = form.querySelector("#btnDeleteParent");
    const hidCatId = form.querySelector("#hidCatId");
    const hidParentId = form.querySelector("#hidParentId");
    const hidCatName = form.querySelector("#hidCatName");

    // ===== UTILS =====
    function show(el, on) { if (el) el.classList.toggle("d-none", !on); }
    function syncTinyMCE() { try { if (window.tinymce?.triggerSave) tinymce.triggerSave(); } catch (_) { } }
    function ensureHidden(name, value) {
      let ip = form.querySelector(`input[name="${CSS.escape(name)}"]`);
      if (!ip) { ip = document.createElement("input"); ip.type = "hidden"; ip.name = name; form.appendChild(ip); }
      ip.value = value;
    }

    // ===== DATA =====
    const COURSE_CACHE = new Map(); // key = childId

    async function loadCourses(childId) {
      const key = String(childId || "");
      if (!key) return [];
      if (COURSE_CACHE.has(key)) return COURSE_CACHE.get(key);
      try {
        const url = `/course/byChild.json?childid=${encodeURIComponent(key)}`; // dùng prefix /course
        console.log('[Edit] fetch', url);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          console.error('[Edit] API error status =', res.status);
          return [];
        }
        const list = (await res.json()) || [];
        console.log('[Edit] API result length =', list.length, 'sample:', list[0]);
        COURSE_CACHE.set(key, list);
        return list;
      } catch (e) {
        console.error('loadCourses error:', e);
        return [];
      }
    }

    // ===== CHILD =====
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
      const on = !!toggleChild?.checked;
      if (isEditingChildHidden) isEditingChildHidden.value = on ? "1" : "0";

      show(childPicker, on);
      show(courseToggleRow, on);

      if (!on) {
        selChild && (selChild.value = "");
        filterChild && (filterChild.value = "");
        txtChildName && (txtChildName.value = "");
        boundChildId && (boundChildId.value = "");
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
      if (!toggleChild?.checked) return;
      filterChildOptions(filterChild.value);
      onSelectChild();
    }

    function onSelectChild() {
      if (!selChild) return;
      const id = selChild.value;
      const opt = selChild.options[selChild.selectedIndex];
      const hasChild = !!(opt && opt.value);

      txtChildName && (txtChildName.value = hasChild ? (opt.textContent || "") : "");
      boundChildId && (boundChildId.value = hasChild ? id : "");
      console.log('[Edit] boundChildId =', boundChildId?.value);

      show(courseToggleRow, hasChild);
      show(btnDeleteChild, !!(toggleChild?.checked && hasChild));

      if (toggleCourse?.checked) populateCourses();
    }

    // ===== COURSE =====
    async function populateCourses(keyword = "") {
      const childId = boundChildId ? boundChildId.value : "";
      const list = await loadCourses(childId);
      const kw = (keyword || "").toLowerCase();

      if (!selCourse) return;
      selCourse.innerHTML = "";

      const filtered = list.filter(c => !kw || (c.title || "").toLowerCase().includes(kw));

      if (!filtered.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = list.length === 0
          ? "(No course returned by API for this child)"
          : "(No course matched by filter)";
        selCourse.appendChild(opt);
        selCourse.disabled = true;
        fillCourseFields(null);
        return;
      }

      filtered.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = String(c.courseid);
        opt.textContent = `${c.courseid} — ${c.title}`;
        selCourse.appendChild(opt);
      });

      selCourse.disabled = false;
      selCourse.selectedIndex = 0;
      onSelectCourse();
    }

    function onToggleCourse() {
      const on = !!(toggleCourse?.checked && boundChildId && boundChildId.value);
      if (isEditingCourseHidden) isEditingCourseHidden.value = on ? "1" : "0";

      show(coursePicker, on);
      show(panelMedia, on);
      show(panelCourseMain, on);
      show(panelRich, on);
      show(btnDeleteCourse, on);

      if (on) populateCourses();
      else fillCourseFields(null);
    }

    async function onFilterCourse() {
      if (!toggleCourse?.checked) return;
      await populateCourses(filterCourse.value);
    }

    async function onSelectCourse() {
      if (!selCourse || !boundChildId) return;
      const id = String(selCourse.value || "");
      const childId = String(boundChildId.value || "");
      const list = await loadCourses(childId);
      const course = list.find((x) => String(x.courseid) === id) || null;
      console.log('[Edit] selected course =', course);
      fillCourseFields(course);
    }

    function fillCourseFields(course) {
      if (!course) {
        boundCourseId && (boundCourseId.value = "");
        txtCourseTitle && (txtCourseTitle.value = "");
        txtThumbnailUrl && (txtThumbnailUrl.value = "");
        if (previewImg)
          previewImg.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=80";
        txtTinyDes && (txtTinyDes.value = "Tiny MCE");
        txtFullDes && (txtFullDes.value = "TinyMCE");
        numPrice && (numPrice.value = "");
        numDiscount && (numDiscount.value = "");
        txtStatus && (txtStatus.value = "");
        return;
      }
      boundCourseId && (boundCourseId.value = course.courseid);
      txtCourseTitle && (txtCourseTitle.value = course.title || "");
      txtThumbnailUrl && (txtThumbnailUrl.value = course.thumbnail || "");
      if (previewImg) {
        previewImg.src = (course.thumbnail && String(course.thumbnail).trim())
          ? course.thumbnail
          : "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=80";
      }
      txtTinyDes && (txtTinyDes.value = course.tinydes || "Tiny MCE");
      txtFullDes && (txtFullDes.value = course.fulldes || "TinyMCE");
      numPrice && (numPrice.value = course.price ?? "");
      numDiscount && (numDiscount.value = course.discount ?? "");
      txtStatus && (txtStatus.value = course.status || "");
    }

    // Preview thumbnail
    if (txtThumbnailUrl && previewImg) {
      txtThumbnailUrl.addEventListener("input", () => {
        const url = (txtThumbnailUrl.value || "").trim();
        if (url) previewImg.src = url;
      });
    }

    // ===== SUBMIT =====
    btnDeleteParent?.addEventListener("click", () => {
      if (!parentId?.value) return;
      if (!hidCatId || !hidParentId || !hidCatName) return;

      if (isEditingChildHidden) isEditingChildHidden.value = "0";
      if (boundChildId) boundChildId.value = "";

      hidCatId.value = parentId.value;
      hidParentId.value = "";
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
      hidCatId.value = childId;
      hidParentId.value = pId || "";
      hidCatName.value = "";
    });

    form.addEventListener("submit", (e) => {
      const submitter = e.submitter;
      const isChildEditing = isEditingChildHidden?.value === "1";
      const isCourseEditing = isEditingCourseHidden?.value === "1";

      syncTinyMCE();

      const isSaving =
        submitter === btnSave ||
        (submitter && submitter.formAction && submitter.formAction.endsWith("/admin/categories/patch"));

      if (isSaving) {
        if (!parentId) return;

        if (isCourseEditing) {
          const childId = boundChildId?.value || "";
          const courseId = boundCourseId?.value || "";
          if (!childId || !courseId) {
            e.preventDefault();
            alert("Hãy chọn child (L2) và course để lưu.");
            return;
          }
          if (submitter) submitter.formAction = "/course/patch";
          form.action = "/course/patch";

          ensureHidden("parentId", parentId.value || "");
          ensureHidden("childId", childId);
          ensureHidden("catid", childId);
          ensureHidden("courseId", courseId);
          return;
        }

        if (isChildEditing) {
          const childId = selChild ? selChild.value : "";
          if (!childId) {
            e.preventDefault();
            alert("Hãy chọn child (L2) để lưu.");
            return;
          }
          const childText =
            (txtChildName?.value || "").trim() ||
            (selChild?.options[selChild.selectedIndex]?.textContent || "").trim();

          hidCatId.value = childId;
          hidParentId.value = parentId.value;
          hidCatName.value = childText;

          if (submitter) submitter.formAction = "/admin/categories/patch";
          form.action = "/admin/categories/patch";
          return;
        }

        // save parent
        hidCatId.value = parentId.value;
        hidParentId.value = "";
        hidCatName.value = (txtParentName?.value || "").trim();

        if (submitter) submitter.formAction = "/admin/categories/patch";
        form.action = "/admin/categories/patch";
        return;
      }

      // Delete course
      if (submitter === btnDeleteCourse ||
        (submitter && submitter.formAction && submitter.formAction.endsWith("/course/del"))) {
        const courseId = boundCourseId?.value || "";
        if (!courseId) {
          e.preventDefault();
          alert("Hãy chọn course để xóa.");
          return;
        }
        ensureHidden("parentId", parentId?.value || "");
        ensureHidden("courseId", courseId);
        return;
      }

      // Delete child
      if (submitter === btnDeleteChild) {
        const childId = selChild ? selChild.value : "";
        if (!childId) {
          e.preventDefault();
          alert("Hãy chọn child (L2) để xóa.");
          return;
        }
        hidCatId.value = childId;
        hidParentId.value = parentId?.value || "";
        hidCatName.value = "";
        return;
      }

      if (submitter === btnDeleteParent) {
        hidCatId.value = parentId?.value || "";
        hidParentId.value = "";
        hidCatName.value = txtParentName?.value || "";
        if (isEditingChildHidden) isEditingChildHidden.value = "0"; 
        if (boundChildId) boundChildId.value = "";
        return;
      }
    });

    // INIT
    toggleChild && toggleChild.addEventListener("change", onToggleChild);
    filterChild && filterChild.addEventListener("input", onFilterChild);
    selChild && selChild.addEventListener("change", onSelectChild);

    toggleCourse && toggleCourse.addEventListener("change", onToggleCourse);
    filterCourse && filterCourse.addEventListener("input", onFilterCourse);
    selCourse && selCourse.addEventListener("change", onSelectCourse);

    onToggleChild();
    onToggleCourse();
  });
})();
