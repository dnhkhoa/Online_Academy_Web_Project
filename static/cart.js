document.addEventListener('DOMContentLoaded', function () {
    const selectAll = document.getElementById('selectAll');
    const itemCheckboxes = document.querySelectorAll('.item-check');
    const selectedCount = document.getElementById('selectedCount');
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const taxEl = document.getElementById('tax');
    const grandTotalEl = document.getElementById('grandTotal');
  
    const TAX_RATE = 5000; // VND cố định (bạn có thể đổi theo % hoặc công thức khác)
  
    // Khi tick "Select all"
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        itemCheckboxes.forEach(cb => cb.checked = selectAll.checked);
        updateSummary();
      });
    }
  
    // Khi tick từng khóa học
    itemCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        // Nếu bỏ tick bất kỳ khóa học nào → bỏ tick "Select all"
        if (!cb.checked && selectAll.checked) selectAll.checked = false;
        updateSummary();
      });
    });
  
    // Hàm cập nhật phần tổng kết
    function updateSummary() {
      let selected = 0;
      let subtotal = 0;
      let discount = 0;
  
      itemCheckboxes.forEach(cb => {
        if (cb.checked) {
          selected++;
  
          // Tìm phần tử .cart-item cha để lấy giá
          const item = cb.closest('.cart-item');
          if (item) {
            const subtotalText = item.querySelector('.text-decoration-line-through')?.textContent || '0';
            const totalText = item.querySelector('.price')?.textContent || '0';
  
            // Chuyển từ "12,000 VND" → 12000
            const itemSubtotal = parseInt(subtotalText.replace(/[^\d]/g, '')) || 0;
            const itemTotal = parseInt(totalText.replace(/[^\d]/g, '')) || 0;
  
            subtotal += itemSubtotal;
            discount += (itemSubtotal - itemTotal);
          }
        }
      });
  
      const tax = selected > 0 ? TAX_RATE : 0;
      const grandTotal = subtotal - discount + tax;
  
      selectedCount.textContent = selected;
      subtotalEl.textContent = formatCurrency(subtotal);
      discountEl.textContent = formatCurrency(discount);
      taxEl.textContent = formatCurrency(tax);
      grandTotalEl.textContent = formatCurrency(grandTotal);
    }
  
    // Hàm format tiền VND
    function formatCurrency(value) {
      return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    document.getElementById('selectAll').addEventListener('change', function() {
        const checked = this.checked;
        document.querySelectorAll('.item-check').forEach(cb => cb.checked = checked);
      });
    
      document.getElementById('checkoutForm').addEventListener('submit', function(e) {
        const checked = document.querySelectorAll('.item-check:checked');
        if (checked.length === 0) {
          e.preventDefault();
          alert('Please select at least one course before proceeding.');
        }
      });
    
  
    // Cập nhật ban đầu
    updateSummary();
  });
  