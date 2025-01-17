function addcategory(){
    fetch("/admin/add-category",{method:"GET"}).then((response)=>{
    if(response.ok) window.location.href = "/admin/add-category"
    }).catch((err)=>{
    console.log(err);
    
    })
    }
    
    function deletecategory(categoryId) {
      Swal.fire({
        title: 'Are you sure?',
        text: 'You won\'t be able to revert this!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/admin/deletecategory/${categoryId}`, { method: 'POST' })
            .then((response) => {
              if (response.ok) {
                Swal.fire(
                  'Deleted!',
                  'The category has been deleted.',
                  'success'
                ).then(()=>{
                  const row = document.getElementById(`category-body-${categoryId}`) 
                  row.remove();
                }) 
              } else {
                Swal.fire(
                  'Failed!',
                  'Failed to delete category. Please try again.',
                  'error'
                );
              }
            })
            .catch((err) => {
              console.error(err);
              Swal.fire(
                'Error!',
                'An error occurred. Please check the console for details.',
                'error'
              );
            });
        }
      });
    }
    
    function Editcategory(categoryId) {
        fetch(`/admin/editcategory/${categoryId}`, { method: "GET" })
            .then((response) => {
                if (response.ok) {
                    window.location.href = `/admin/editcategory/${categoryId}`;
                }
            })
            .catch((err) => {
                console.log('Error navigating to edit category page:', err);
            });
    }
    
    