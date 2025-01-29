function downloadInvoice(orderId){
    fetch(`/download-invoice/${orderId}`,{method:"POST"}).then((response)=>{
       return response.json()
    }).then((data)=>{
if(data.ok){
const orderDetails = {
    orderId: data.order.orderId,
    date: new Date(data.order.createdAt).toLocaleDateString(),
    customer: {
      name: data.order.address.firstName,
      address: `${data.order.address.streetAddress}, ${data.order.address.city}`,
      email: data.order.address.email,
      phone: data.order.address.phone,
    },
    items: data.order.cartItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
    total: data.order.totalPrice,
    paymentMethod: data.order.paymentMethod,
  };
  DownloadPdf(orderDetails);
}
    })
}

function DownloadPdf(orderDetails) {
    
const { orderId, date, customer, items, total, paymentMethod } = orderDetails;

// Use destructured values dynamically in your PDF definition
const docDefinition = {
content: [
  { text: 'Invoice', style: 'header' },
  { text: `Invoice Number: ${orderId}`, margin: [0, 10, 0, 0] },
  { text: `Date: ${date}`, margin: [0, 0, 0, 10] },
  { text: 'Bill To:', style: 'subheader' },
  { text: `Name: ${customer.name}` },
  { text: `Address: ${customer.address}` },
  { text: `Email: ${customer.email}` },
  { text: `Phone: ${customer.phone}` },
  { text: 'Order Details:', style: 'subheader', margin: [0, 10, 0, 5] },
  {
    style: 'tableExample',
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: [
        ['Item', 'Quantity', 'Unit Price', 'Total'],
        ...items.map((item) => [item.name, item.quantity, `$${item.price}`, `$${item.total}`]),
      ],
    },
    layout: 'lightHorizontalLines',
  },
  { text: `Total: $${total}`, style: 'total', margin: [0, 10, 0, 0] },
  { text: `Payment Method: ${paymentMethod}`, margin: [0, 5, 0, 0] },
],
};

pdfMake.createPdf(docDefinition).download(`Invoice-${orderId}.pdf`);
}