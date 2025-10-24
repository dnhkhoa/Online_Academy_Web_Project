(function () {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById("frmAddCategory");
    if (!form) return;

    // --- Elements ---
    const selL1 = form.querySelector("#selL1");
    const selL2 = form.querySelector("#selL2");
    const txtNewL1 = form.querySelector("#txtNewL1");
    const txtNewL2 = form.querySelector("#txtNewL2");

    const switchCourseMode = form.querySelector("#switchCourseMode");
    const rowCourseTitle = form.querySelector("#rowCourseTitle");
    const detailBlocks = form.querySelectorAll(".detail-block");

    const mode = form.querySelector("#mode");
    const resolvedL2CatId = form.querySelector("#resolvedL2CatId");

    // ---------- MOCK DATA: thay bằng API ----------
    // L1 có sẵn
    const L1 = [
      { id: "1", name: "IT" },
      { id: "2", name: "Business" },
      { id: "3", name: "Design" },
    ];
    // Map L1 -> L2
    const L2 = {
      1: [
        { id: "11", name: "Lập trình Web" },
        { id: "12", name: "Lập trình thiết bị di động" },
      ],
      2: [
        { id: "21", name: "Marketing" },
        { id: "22", name: "Product Management" },
      ],
      3: [
        { id: "31", name: "UX/UI" },
        { id: "32", name: "Graphic Design" },
      ],
    };
    // ---------------------------------------------

    // helpers
    function fillL1() {
      selL1.innerHTML = `<option value="null">-- Select L1 --</option>`;
      L1.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        selL1.appendChild(opt);
      });
    }

    function fillL2(parentId) {
      selL2.innerHTML = `<option value="">-- Select L2 --</option>`;
      const list = L2[parentId] || [];
      list.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        selL2.appendChild(opt);
      });
      selL2.disabled = list.length === 0;
    }

    function toggleCourseUI(on) {
      rowCourseTitle.classList.toggle("d-none", !on);
      detailBlocks.forEach((el) => el.classList.toggle("d-none", !on));
      mode.value = on ? "course" : "category-only";
    }

    function onChangeL1() {
      const l1 = selL1.value;
      if (l1 && l1 !== "null") {
        fillL2(l1);
      } else {
        selL2.innerHTML = `<option value="">-- Select L2 --</option>`;
        selL2.disabled = true;
      }
    }

    function onChangeL2() {
      // L2 được chọn (nếu đang tạo course) => set catid
      resolvedL2CatId.value = selL2.value || "";
    }

    function onSwitchCourse() {
      const on = switchCourseMode.checked;
      toggleCourseUI(on);
    }

    // Khi submit:
    // - Nếu txtNewL1 có giá trị => backend tạo L1 mới (parentid = NULL) và dùng id đó.
    // - Nếu txtNewL2 có giá trị => backend tạo L2 mới với parentid = L1 (mới tạo hoặc đã chọn).
    // - Nếu mode = "course" => cần catid của L2 (chọn hoặc mới tạo) -> backend resolve và gán courses.catid.

    // init
    fillL1();
    onChangeL1();
    toggleCourseUI(false);

    // bind
    selL1.addEventListener("change", onChangeL1);
    selL2.addEventListener("change", onChangeL2);
    switchCourseMode.addEventListener("change", onSwitchCourse);
  });
})();
