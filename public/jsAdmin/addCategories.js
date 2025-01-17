document.getElementById('category-form').addEventListener('submit', function (e) {
    e.preventDefault();  // Prevent default form submission

    const categoryName = document.getElementById('category-name').value.trim();
    const categoryDescription = document.getElementById('category-description').value.trim();
    const categoryImage = document.getElementById('category-image').files[0];
    const isListed = document.getElementById('is-listed').value;
    const offer = document.getElementById('offers').value;

    // Validation
    if (!categoryName || !categoryDescription || !isListed) {
      Swal.fire({
        icon: 'warning',
        title: 'Please fill out all required fields.',
        text: 'Make sure all fields are filled out before submitting.',
      });
      return;
    }

    if (!categoryImage) {
      Swal.fire({
        icon: 'warning',
        title: 'No image uploaded',
        text: 'Please upload an image for the category.',
      });
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(categoryImage.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid image format',
        text: 'Please upload a JPEG, PNG, or WEBP image.',
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (categoryImage.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'Image size exceeds limit',
        text: 'Image size exceeds 2MB. Please upload a smaller image.',
      });
      return;
    }
    const formData = new FormData();
    formData.append('name', categoryName);
    formData.append('description', categoryDescription);
    formData.append('image_url', categoryImage);
    formData.append('is_listed', isListed);
    formData.append('offer', offer);

    // Send data via fetch
    fetch('/admin/add-category', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())  // Parse JSON response
    .then(data => {
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: data.message,
        }).then(() => {
          window.location.href = '/admin/category';  // Redirect to category page
        });
      }else{
        Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message,
                });
      }
    })
    .catch(error => {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'An error occurred',
        text: 'Please try again later.',
      });
    });
  });

