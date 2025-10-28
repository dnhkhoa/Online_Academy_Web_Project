document.addEventListener("DOMContentLoaded", () => {
  const openAccordions = document.querySelectorAll(
    "#accordionPanelsStayOpenExample .accordion-collapse.show"
  );
  openAccordions.forEach((acc) => {
    new bootstrap.Collapse(acc, { toggle: false }).hide();
  });
});
