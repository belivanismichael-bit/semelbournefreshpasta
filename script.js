const rows = document.querySelectorAll('.pasta-row');
const summaryList = document.getElementById('summary-list');
const orderTotal = document.getElementById('order-total');
const orderItems = {};

// Update order summary list and calculated total
function renderSummary() {
  const names = Object.keys(orderItems).filter(n => orderItems[n].qty > 0);
  summaryList.innerHTML = '';

  if (names.length === 0) {
    summaryList.innerHTML = '<li id="summary-empty">No items selected yet.</li>';
    orderTotal.textContent = '';
    return;
  }

  let total = 0;
  names.forEach(name => {
    const item = orderItems[name];
    const lineTotal = item.qty * item.price;
    total += lineTotal;
    const li = document.createElement('li');
    li.textContent = `${name} (300g) x${item.qty} — $${lineTotal.toFixed(2)}`;
    summaryList.appendChild(li);
  });

  orderTotal.textContent = `Total: $${total.toFixed(2)}`;
}

// Set up event listeners for + and - quantity buttons
rows.forEach(row => {
  const pastaName = row.getAttribute('data-pasta');
  const price = parseFloat(row.getAttribute('data-price'));
  const qtySpan = row.querySelector('.qty');

  if (!orderItems[pastaName]) {
    orderItems[pastaName] = { qty: 0, price: price };
  }

  row.querySelector('.increase').addEventListener('click', () => {
    orderItems[pastaName].qty++;
    qtySpan.textContent = orderItems[pastaName].qty;
    renderSummary();
  });

  row.querySelector('.decrease').addEventListener('click', () => {
    if (orderItems[pastaName].qty > 0) {
      orderItems[pastaName].qty--;
      qtySpan.textContent = orderItems[pastaName].qty;
      renderSummary();
    }
  });
});

// Handle order form submission to Google Sheets
document.getElementById('order-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const names = Object.keys(orderItems).filter(n => orderItems[n].qty > 0);
  const statusDiv = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  // Validate that at least one item is chosen
  if (names.length === 0) {
    alert('Please select at least one pasta item before submitting.');
    return;
  }

  let orderSummaryText = [];
  let total = 0;

  names.forEach(name => {
    const item = orderItems[name];
    const lineTotal = item.qty * item.price;
    total += lineTotal;
    orderSummaryText.push(`${name} (300g) x${item.qty} - $${lineTotal.toFixed(2)}`);
  });

  const payload = {
    phone: document.getElementById('phone').value,
    comments: document.getElementById('comments').value,
    orderDetails: orderSummaryText.join(', '),
    totalPrice: `$${total.toFixed(2)}`
  };

  submitBtn.disabled = true;
  statusDiv.style.color = '#2e2620';
  statusDiv.textContent = 'Submitting order...';

  // Your updated Google Apps Script Web App Endpoint
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyyNVjkxm9nr-xnRu2WuONKSitIFhjQaMWJTmL_NNu67E1iFf2iVWoYEmFFQQlTQwwf6A/exec';

  fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  .then(() => {
    statusDiv.style.color = 'green';
    statusDiv.textContent = 'Order submitted successfully! Thank you.';
    document.getElementById('order-form').reset();
    
    // Reset quantities and summary
    Object.keys(orderItems).forEach(key => {
      orderItems[key].qty = 0;
    });
    document.querySelectorAll('.qty').forEach(span => span.textContent = '0');
    renderSummary();

    submitBtn.disabled = false;
  })
  .catch(error => {
    console.error('Error submitting order:', error);
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Failed to submit order. Please try again.';
    submitBtn.disabled = false;
  });
});