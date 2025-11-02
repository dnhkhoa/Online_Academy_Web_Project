(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const form = document.getElementById("frmAddCategory");
    if (!form) return;

    const selL1 = form.querySelector("#selL1");
    const selL2 = form.querySelector("#selL2");
    const txtNewL1 = form.querySelector("#txtNewL1");
    const txtNewL2 = form.querySelector("#txtNewL2");

    const switchCourseMode = form.querySelector("#switchCourseMode");
    const rowCourseTitle = form.querySelector("#rowCourseTitle");
    const detailBlocks = form.querySelectorAll(".detail-block");

    const mode = form.querySelector("#mode");
    const resolvedL2CatId = form.querySelector("#resolvedL2CatId");
    const hidCatname = form.querySelector("#catname");
    const hidParentid = form.querySelector("#parentid");

     const fileCover = document.getElementById("fileCover");
    const imgPreview = document.getElementById("imgCourseCoverPreview");
    const txtThumbnailUrl = document.getElementById("txtThumbnailUrl");
    const hidPhotos = document.getElementById("photos");

    function renderL2Options(children) {
      const opts = ['<option value="">-- Select L2 --</option>'];
      for (const c of (children || [])) {
        opts.push(`<option value="${c.catid}">${c.catname}</option>`);
      }
      selL2.innerHTML = opts.join('');
      selL2.disabled = selL2.options.length <= 1;
    }

    function loadChildrenFromTemplates(parentid) {
      selL2.innerHTML = `<option value="">-- Select L2 --</option>`;
      selL2.disabled = true;
      if (!parentid) return false;
      const tpl = form.querySelector(`#l2-templates select[data-parentid="${parentid}"]`);
      if (tpl && tpl.innerHTML.trim()) {
        selL2.innerHTML = tpl.innerHTML;
        selL2.disabled = selL2.options.length <= 1;
        return true;
      }
      return false;
    }

    async function loadChildrenFallbackAPI(parentid) {
      try {
        const res = await fetch(`/admin/categories/children.json?parentid=${encodeURIComponent(parentid)}`);
        if (!res.ok) throw new Error(await res.text());
        const children = await res.json();
        renderL2Options(children);
      } catch (e) {
        console.error('Load L2 via API failed:', e);
        renderL2Options([]); 
      }
    }

    function toggleCourseUI(on) {
      rowCourseTitle?.classList.toggle("d-none", !on);
      detailBlocks.forEach(el => el.classList.toggle("d-none", !on));
      mode.value = on ? "course" : "category-only";
      form.action = on ? "/course/add" : "/admin/categories/add";
    }

    async function onChangeL1() {
      const l1 = selL1.value;
      hidParentid.value = l1 || "";

      const filled = loadChildrenFromTemplates(l1);
      if (!filled && l1) await loadChildrenFallbackAPI(l1);

      resolvedL2CatId.value = "";
      selL2.value = "";
      txtNewL2.value = "";
    }

    function onChangeL2() {
      resolvedL2CatId.value = selL2.value || "";
      if (selL2.value) {
        txtNewL2.value = "";
        hidCatname.value = "";
      }
    }

    function onSwitchCourse() {
      const on = switchCourseMode.checked;
      toggleCourseUI(on);
      if (on && window.initTinyOnce) {
        setTimeout(() => window.initTinyOnce(), 30);
      }
    }

    txtNewL2?.addEventListener("input", function () {
      if (txtNewL2.value.trim()) {
        selL2.value = "";
        resolvedL2CatId.value = "";
      }
    });

    txtThumbnailUrl?.addEventListener('input', function(){
      if (txtThumbnailUrl.value.trim()) {
        hidPhotos.value = "";                 
        imgPreview && (imgPreview.src = txtThumbnailUrl.value.trim());
      }
    });

    fileCover?.addEventListener('change', async function(){
      if (!fileCover.files || !fileCover.files.length) return;

      if (!switchCourseMode.checked) {
        switchCourseMode.checked = true;
        onSwitchCourse();
      }

      const fd = new FormData();
      for (const f of fileCover.files) fd.append('photos', f);
      try {
        const res = await fetch('/course/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data?.success) throw new Error('Upload failed');

        const filenames = (data.files || []).map(f => f.filename);
        hidPhotos.value = JSON.stringify(filenames);  
        txtThumbnailUrl.value = "";                  

        if (filenames.length > 0 && imgPreview) {
          imgPreview.src = `/static/temp_uploads/${filenames[0]}`;
        }
      } catch (e) {
        console.error(e);
        alert('Upload ảnh thất bại, thử lại nhé!');
      } finally {
        fileCover.value = '';
      }
    });

    form.addEventListener("submit", (e) => {
      if (mode.value === "category-only") {
        const newL1 = (txtNewL1?.value || "").trim();
        const newL2 = (txtNewL2?.value || "").trim();
        const l1Selected = selL1.value;

        if (newL1) { hidCatname.value = newL1; hidParentid.value = ""; return; }
        if (newL2 && l1Selected) { hidCatname.value = newL2; hidParentid.value = l1Selected; return; }

        e.preventDefault();
        alert("Vui lòng nhập L1 mới hoặc L2 mới (và chọn L1) để tạo category.");
        return;
      } else {
        const title = (form.querySelector("#txtCourseTitle")?.value || "").trim();
        const l1Selected = selL1.value;
        const l2Selected = selL2.value;
        const newL2 = (txtNewL2?.value || "").trim();

        if (!title) { e.preventDefault(); alert("Vui lòng nhập Course title."); return; }

    

        if (l2Selected) { resolvedL2CatId.value = l2Selected; hidCatname.value = ""; hidParentid.value = ""; return; }
        if (newL2 && l1Selected) { resolvedL2CatId.value = ""; hidCatname.value = newL2; hidParentid.value = l1Selected; return; }

        e.preventDefault();
        alert("Hãy chọn L2 có sẵn hoặc nhập L2 mới (và chọn L1) để tạo course.");
        return;
      }
    });

    // init
    onChangeL1();
    toggleCourseUI(false);

    const preset = form.dataset.preset || new URLSearchParams(location.search).get("mode");
    if (preset === "course") {
      switchCourseMode.checked = true;
      toggleCourseUI(true);
      if (window.initTinyOnce) {
        setTimeout(() => window.initTinyOnce(), 30);
      }
    }

    selL1.addEventListener("change", onChangeL1);
    selL2.addEventListener("change", onChangeL2);
    switchCourseMode.addEventListener("change", onSwitchCourse);
  });
})();
