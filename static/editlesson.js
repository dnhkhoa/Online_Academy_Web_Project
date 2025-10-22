(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById('frmEditLesson');
    if (!form) return;

    const targetInput = form.querySelector('#targetLessonId');

    document.getElementById('btnEditSection')?.addEventListener('click', function () {
      form.setAttribute('action', '/course/section/edit');
      targetInput.value = '';
      form.submit();
    });

    form.addEventListener('click', function (e) {
      const btn = e.target.closest('.btnSaveLesson');
      if (!btn) return;

      const lid = btn.getAttribute('data-lesson-id');
      if (!lid) return;

      form.setAttribute('action', '/course/lesson/editLesson');
      targetInput.value = lid;

      const cb = form.querySelector(`.lesson-item[data-lesson-id="${lid}"] input[type="checkbox"][name="previews[${lid}]"]`);
      if (!cb || !cb.checked) {
        form.querySelectorAll(`input[name="previews[${lid}]"][type="hidden"]`).forEach(n => n.remove());
        const h = document.createElement('input');
        h.type = 'hidden';
        h.name = `previews[${lid}]`;
        h.value = '0';
        form.appendChild(h);
      }
      form.submit();
    });
  });
})();
