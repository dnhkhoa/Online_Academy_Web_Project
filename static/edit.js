(function () {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById("frmEditCategory");
    if (!form) return;

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

    // ===== MOCK DATA (thay bằng API/SSR khi tích hợp thật) =====
    // Child categories (L2) của parent hiện tại
    const CHILDREN = [
      { id: "11", name: "Lập trình Web" },
      { id: "12", name: "Lập trình thiết bị di động" },
      { id: "13", name: "Khoa học dữ liệu" },
    ];
    // Courses theo childId
    const COURSES = {
      11: [
        {
          courseid: "201",
          title: "Web cơ bản",
          tinydes: "Tiny MCE",
          fulldes: "TinyMCE",
          price: 1200000,
          discount: 200000,
          thumbnail: "",
          status: "published",
        },
        {
          courseid: "202",
          title: "Web nâng cao",
          tinydes: "Tiny MCE",
          fulldes: "TinyMCE",
          price: 2200000,
          discount: 0,
          thumbnail: "",
          status: "draft",
        },
      ],
      12: [
        {
          courseid: "301",
          title: "Android Kotlin",
          tinydes: "Tiny MCE",
          fulldes: "TinyMCE",
          price: 2400000,
          discount: 300000,
          thumbnail: "",
          status: "published",
        },
      ],
      13: [],
    };
    // ===========================================================

    function show(el, on) {
      el.classList.toggle("d-none", !on);
    }

    // ---- CHILD (L2) ----
    function populateChildren(keyword = "") {
      selChild.innerHTML = "";
      const kw = (keyword || "").toLowerCase();
      CHILDREN.filter((c) =>
        kw ? c.name.toLowerCase().includes(kw) : true
      ).forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        selChild.appendChild(opt);
      });

      if (selChild.options.length) {
        selChild.disabled = false;
        selChild.selectedIndex = 0;
        onSelectChild();
      } else {
        selChild.disabled = true;
        txtChildName.value = "";
        boundChildId.value = "";
        // Ẩn nhánh Course luôn
        show(courseToggleRow, false);
        show(coursePicker, false);
        toggleCourse.checked = false;
        onToggleCourse();
      }
    }

    function onToggleChild() {
      const on = toggleChild.checked;
      isEditingChildHidden.value = on ? "1" : "0";
      show(childPicker, on);
      show(courseToggleRow, on); // chỉ khi có child mới cho bật Course
      if (!on) {
        // reset child state
        selChild.innerHTML = "";
        filterChild.value = "";
        txtChildName.value = "";
        boundChildId.value = "";
        // tắt course branch
        toggleCourse.checked = false;
        onToggleCourse();
      } else {
        populateChildren();
      }
    }

    function onFilterChild() {
      if (!toggleChild.checked) return;
      populateChildren(filterChild.value);
    }

    function onSelectChild() {
      const id = selChild.value;
      const item = CHILDREN.find((x) => x.id === id);
      if (!item) {
        txtChildName.value = "";
        boundChildId.value = "";
        show(courseToggleRow, false);
        toggleCourse.checked = false;
        onToggleCourse();
        return;
      }
      txtChildName.value = item.name;
      boundChildId.value = item.id;
      show(courseToggleRow, true);
      // khi đổi child mà đang bật course → reload course list
      if (toggleCourse.checked) populateCourses();
    }

    // ---- COURSE (courses) ----
    function populateCourses(keyword = "") {
      const childId = boundChildId.value;
      const list = COURSES[childId] || [];
      const kw = (keyword || "").toLowerCase();

      selCourse.innerHTML = "";
      list
        .filter((c) => {
          if (!kw) return true;
          return (c.title || "").toLowerCase().includes(kw);
        })
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
        // clear course fields
        fillCourseFields(null);
      }
    }

    function onToggleCourse() {
      const on = toggleCourse.checked && !!boundChildId.value;
      isEditingCourseHidden.value = on ? "1" : "0";
      show(coursePicker, on);
      show(panelMedia, on);
      show(panelCourseMain, on);
      show(panelRich, on);
      show(btnDeleteCourse, on);
      if (on) populateCourses();
      else fillCourseFields(null);
    }

    function onFilterCourse() {
      if (!toggleCourse.checked) return;
      populateCourses(filterCourse.value);
    }

    function onSelectCourse() {
      const id = selCourse.value;
      const childId = boundChildId.value;
      const list = COURSES[childId] || [];
      const course = list.find((x) => x.courseid === id) || null;
      fillCourseFields(course);
    }

    function fillCourseFields(course) {
      if (!course) {
        boundCourseId.value = "";
        txtCourseTitle.value = "";
        txtThumbnailUrl.value = "";
        if (previewImg)
          previewImg.src =
            "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=80";
        txtTinyDes.value = "Tiny MCE";
        txtFullDes.value = "TinyMCE";
        numPrice.value = "";
        numDiscount.value = "";
        txtStatus.value = "";
        return;
      }
      boundCourseId.value = course.courseid;
      txtCourseTitle.value = course.title || "";
      txtThumbnailUrl.value = course.thumbnail || "";
      if (previewImg && course.thumbnail) previewImg.src = course.thumbnail;
      txtTinyDes.value = course.tinydes || "Tiny MCE";
      txtFullDes.value = course.fulldes || "TinyMCE";
      numPrice.value = course.price ?? "";
      numDiscount.value = course.discount ?? "";
      txtStatus.value = course.status || "";
    }

    // Preview khi nhập URL thumbnail
    if (txtThumbnailUrl && previewImg) {
      txtThumbnailUrl.addEventListener("input", () => {
        const url = (txtThumbnailUrl.value || "").trim();
        if (url) previewImg.src = url;
      });
    }

    // ===== INIT =====
    txtParentName.value = txtParentName.value || "Parent Sample";
    parentId.value = parentId.value || "P-101";
    if (txtParentId) txtParentId.textContent = parentId.value;

    toggleChild.addEventListener("change", onToggleChild);
    filterChild.addEventListener("input", onFilterChild);
    selChild.addEventListener("change", onSelectChild);

    toggleCourse.addEventListener("change", onToggleCourse);
    filterCourse.addEventListener("input", onFilterCourse);
    selCourse.addEventListener("change", onSelectCourse);

    // mặc định: chỉ sửa Parent
    onToggleChild();
    onToggleCourse();
  });
})();

(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    var form = document.getElementById("frmEditCategory");
    if (!form) return;

    var toggleChild = form.querySelector("#toggleChild");
    var childPicker = form.querySelector("#childPicker");
    var selChild = form.querySelector("#selChild");
    var isEditingChild = form.querySelector("#isEditingChild"); // LƯU Ý: đúng id với HTML hiện tại
    var btnDeleteChild = form.querySelector("#btnDeleteChild");
    var courseToggleRow = form.querySelector("#courseToggleRow"); // chỉ cho bật Course khi có child

    function show(el, on) {
      if (!el) return;
      el.classList.toggle("d-none", !on);
    }

    function refreshChildUI() {
      var editing = !!(toggleChild && toggleChild.checked);
      // bật/tắt nhóm chọn child
      show(childPicker, editing);
      if (isEditingChild) isEditingChild.value = editing ? "1" : "0";

      // có child được chọn?
      var hasChild =
        !!selChild &&
        selChild.options &&
        selChild.options.length > 0 &&
        selChild.value &&
        selChild.value.trim() !== "";

      // chỉ hiện nút Delete khi đang chỉnh child và có child được chọn
      show(btnDeleteChild, editing && hasChild);

      // chỉ hiện công tắc chỉnh course khi có child
      show(courseToggleRow, editing && hasChild);
    }

    // Khi đổi trạng thái toggle hoặc chọn child mới → cập nhật UI
    if (toggleChild) toggleChild.addEventListener("change", refreshChildUI);
    if (selChild) selChild.addEventListener("change", refreshChildUI);

    // Khởi tạo UI lúc vào trang
    refreshChildUI();
  });
})();
