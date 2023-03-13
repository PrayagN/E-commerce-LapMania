const folderPath = 'upload/';

const uploadImage = (base64data) => {
  const image_parts = base64data.split(";base64,");
  const image_type_aux = image_parts[0].split("image/");
  const image_type = image_type_aux[1];
  const image_base64 = atob(image_parts[1]);
  const file = folderPath + Date.now() + '.png';
  const blob = new Blob([image_base64], { type: `image/${image_type}` });
  const formData = new FormData();
  formData.append('image', blob, file);

  fetch('upload.php', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    alert("success upload image");
  })
  .catch(error => console.error(error));
}

const cropButton = document.querySelector('#crop');
cropButton.addEventListener('click', () => {
  const canvas = cropper.getCroppedCanvas({
    width: 160,
    height: 160,
  });

  canvas.toBlob((blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      uploadImage(base64data);
      bs_modal.modal('hide');
    };
  });
});

// <% for (let j = 0; j < orders[i].products.length; j++) { %>
//   <tr>
//   <div class="d-flex" >
//       <td> <div style=" font-size: medium; width: 200px; color: black; word-wrap: break-word; display: -webkit-box; -webkit-box-orient: vertical; text-overflow: ellipsis; -webkit-line-clamp: 2; overflow: hidden;">
//           <% console.log(orders[0].products[0].productId[0].name)%>

//           <%= orders[i].products[j].productId[0].name%></div> </td>
//           <td><%= orders[i].products[j].quantity%></td>
//           <td> &#x20B9;<%= orders[i].products[j].price%></td>
              
//           <td>&#x20B9;<%= orders[i].products[j].quantity * orders[i].products[j].price%></td>
// </div>  
// </tr>
//   <% } %>