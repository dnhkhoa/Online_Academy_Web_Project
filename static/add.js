document.addEventListener("DOMContentLoaded", () => {
  const selParent = document.getElementById("selParent");
  const lblCatName = document.getElementById("lblCatName");
  const isParent = document.getElementById("isParent");
  const detailBlocks = document.querySelectorAll(".detail-block");

  const applyState = () => {
    const val = (selParent.value || "").trim();
    /* 0 = No parent => creating PARENT */
    const isStandalone = val === "0";

    // Update label + hidden flag
    lblCatName.textContent = isStandalone
      ? "Parent category name *"
      : "Course name *";
    isParent.value = isStandalone ? "1" : "0";

    // Show details only when a parent is selected
    detailBlocks.forEach((el) => {
      el.classList.toggle("d-none", isStandalone);
    });
  };

  selParent.addEventListener("change", applyState);
  applyState();
});
