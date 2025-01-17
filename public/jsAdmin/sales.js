const rowsPerPage = 10; // Number of rows to display per page
let currentPage = 1; // Current page number

// Function to toggle the visibility of the date fields
function toggleDateFields() {
  const predefinedRange = document.getElementById("predefinedRange").value;
  const isCustom = predefinedRange === "custom";
  document.getElementById("startDateContainer").style.display = isCustom ? "block" : "none";
  document.getElementById("endDateContainer").style.display = isCustom ? "block" : "none";
}

// Function to generate the report
function generateReport() {
  const predefinedRange = document.getElementById("predefinedRange").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  const filters = predefinedRange === "custom"
    ? { startDate, endDate }
    : { predefinedRange };

  fetch('/admin/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  })
    .then(response => response.json())
    .then(data => {
      updateTable(data.orders);
      paginateTable();
    })
    .catch(err => console.error(err));
}

// Function to update the table with data
function updateTable(orders) {
  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = '';

  orders.forEach(order => {
    const row = `
      <tr>
        <td>${new Date(order.createdAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}</td>
        <td>${order.orderId}</td>
        <td>₹${order.totalPrice}</td>
        <td>₹${order.CartTotalOffer || '0'}</td>
        <td>₹${order.coupenDiscountAmount || '0'}</td>
        <td>₹${order.totalPrice - (order.CartTotalOffer || 0) - (order.coupenDiscountAmount || 0)}</td>
      </tr>`;
    tableBody.insertAdjacentHTML('beforeend', row);
  });

  paginateTable();
}

// Function to handle pagination logic
function paginateTable() {
  const tableBody = document.getElementById("productTableBody");
  const rows = tableBody.querySelectorAll("tr");
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Hide all rows initially
  rows.forEach(row => row.style.display = "none");

  // Show rows for the current page
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  for (let i = start; i < end && i < totalRows; i++) {
    rows[i].style.display = "table-row";
  }

  
  document.getElementById("pageInfo").innerText = `${start + 1}-${Math.min(end, totalRows)} of ${totalRows}`;

  
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;

 
  document.getElementById("prevPage").onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      paginateTable();
    }
  };

  document.getElementById("nextPage").onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      paginateTable();
    }
  };
}


document.addEventListener("DOMContentLoaded", paginateTable);

document.getElementById("downloadReportBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Sales Report', 14, 20);

  const headers = ['Date', 'Order ID', 'Total Amount', 'Discount', 'Coupon', 'Net Sales'];
  const data = [];
  let totalPrice = 0;
  let totalOfferPrice = 0;
  let totalOrders = 0;
  
  // Get the table rows
  const tbody = document.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  console.log(rows);
  
  // Iterate through each row and extract data
  rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      console.log(cells);
      
      const rowData = [
          cells[0].innerText, // Date
          cells[1].innerText, // Order ID
          cells[2].innerText, // Total Amount
          cells[3].innerText, // Discount
          cells[4].innerText, // Coupon
          cells[5].innerText, // Net Sales
      ];
      data.push(rowData);
      
      // Accumulate totals
      totalPrice += parseFloat(cells[2].innerText.replace('₹', '').replace(/,/g, '')) || 0;
      totalOfferPrice += parseFloat(cells[3].innerText.replace('₹', '').replace(/,/g, '')) || 0;
      totalOrders++;
  });

  // Add the data table to the PDF
  doc.autoTable({
      head: [headers],
      body: data,
      startY: 30,
      theme: 'striped',
      styles: { fontSize: 10 },
  });

  // Add totals to the bottom of the PDF
  const totalStartY = doc.lastAutoTable.finalY + 10; // Positioning the totals below the table
  doc.setFontSize(12);
  doc.text('Total Price: ' + totalPrice.toLocaleString(), 14, totalStartY);
  doc.text('Total Offer Price: ' + totalOfferPrice.toLocaleString(), 14, totalStartY + 10);
  doc.text('Total Orders: ' + totalOrders, 14, totalStartY + 20);

  // Save the PDF
  doc.save('Sales_Report.pdf');
});


document.getElementById("downloadReportBtnExcel").addEventListener("click", () => {
// Parse the stringified orders data to an array
const orders = JSON.parse('<%- JSON.stringify(orders) %>');
console.log('Orders:', orders);

fetch('/admin/download-report/excel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orders }), // Send the actual orders array
})
.then(response => {
  if (!response.ok) {
    throw new Error('Failed to download Excel file');
  }
  return response.blob();
})
.then(blob => {
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'SalesReport.xlsx';
  link.click();
  window.URL.revokeObjectURL(link.href);
})
.catch(err => console.error('Error:', err));
});
