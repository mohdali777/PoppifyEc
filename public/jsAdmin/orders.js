function changeOrderStatus() {
    const statusSelect = document.getElementById("order-status");
    const currentStatus = document.getElementById("current-status");

    // Send the status update to the backend using fetch (AJAX)
    fetch(`/admin/update-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: statusSelect.value })
    })
    .then(response => response.json())
    .then(data => {
        currentStatus.textContent = data.status;

        if (data.status === "Delivered") {
            currentStatus.style.color = "#28a745"; 
        } else if (data.status === "Shipped") {
            currentStatus.style.color = "#6c757d"; 
        } else if (data.status === "Cancelled") {
            currentStatus.style.color = "#dc3545"; 
        } else {
            currentStatus.style.color = "#ff9f43"; 
        }
        Swal.fire({
   title: 'Status Updated',
   text: `Order status updated to "${data.status}"`,
   icon: 'success',
   confirmButtonText: 'OK'
});
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    });
}
function acceptReturn(itemId,orderId,userId){
   fetch("/admin/returnaccept", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ itemId, orderId,userId })
}).then((response)=> response.json()).then((data)=>{
if(data.success){
    Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message,
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      });
}else{
    Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message,
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      });  
}
}).catch((error)=>{
   console.log(error);
   
})

}
function rejectReturn(itemId,orderId){
   fetch("/admin/returnreject", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ itemId, orderId })
}).then((response)=> response.json()).then((data)=>{
if(data.success){
    Swal.fire({
        icon: "success",
        title: "Rejected Successfully",
        text: data.message,
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      }); 
}else{
    Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message,
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      });  
}
}).catch((error)=>{
   console.log(error);
   
})

}
