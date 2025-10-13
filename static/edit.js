(function () {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById("frmEditCategory");
    if (!form) return;

    // Elements
    const toggleChild = form.querySelector("#toggleChild");
    const childPicker = form.querySelector("#childPicker");
    const filterChild = form.querySelector("#filterChild");
    const selChild = form.querySelector("#selChild");
    const txtChildName = form.querySelector("#txtChildName");
    const isEditingChild = form.querySelector("#isEditingChild");

    const detailBlocks = form.querySelectorAll(".detail-block");
    const btnDeleteChild = form.querySelector("#btnDeleteChild");

    const txtParentName = form.querySelector("#txtParentName");
    const parentId = form.querySelector("#parentId");
    const txtParentId = document.getElementById("txtParentId");

    // Thay bằng render server hoặc fetch API
    const CHILDREN = [
      { id: "201", name: "aaa" },
      { id: "202", name: "bbb" },
      { id: "203", name: "ccc" },
      { id: "204", name: "ddd" },
    ];

    function toggleDetails(show) {
      detailBlocks.forEach((el) => el.classList.toggle("d-none", !show));
      btnDeleteChild.classList.toggle("d-none", !show);
    }

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
        toggleDetails(false);
      }
    }

    function onToggleChild() {
      const enable = toggleChild.checked;
      isEditingChild.value = enable ? "1" : "0";
      childPicker.classList.toggle("d-none", !enable);

      if (!enable) {
        // Chỉ sửa Parent
        toggleDetails(false);
        txtChildName.value = "";
        selChild.innerHTML = "";
        filterChild.value = "";
        return;
      }

      // Bật chế độ chỉnh Child
      populateChildren();
    }

    function onFilterChild() {
      if (!toggleChild.checked) return;
      populateChildren(filterChild.value);
    }

    function onSelectChild() {
      const id = selChild.value;
      const item = CHILDREN.find((x) => x.id === id);
      if (!item) {
        toggleDetails(false);
        txtChildName.value = "";
        return;
      }
      // Nạp tên child & show detail
      txtChildName.value = item.name;
      toggleDetails(true);
    }

    // Init Parent (có thể set từ server)
    txtParentName.value = txtParentName.value || "Parent Sample";
    parentId.value = parentId.value || "P-101";
    if (txtParentId) txtParentId.textContent = parentId.value;

    // Bind
    toggleChild.addEventListener("change", onToggleChild);
    filterChild.addEventListener("input", onFilterChild);
    selChild.addEventListener("change", onSelectChild);

    // Start
    onToggleChild(); // mặc định: OFF
  });
})();
