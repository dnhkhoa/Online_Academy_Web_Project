tinymce.init({
  selector: 'textarea',
  plugins: 'tinydrive code image link media',
  toolbar: 'insertfile | undo redo | link image media | code',
  height: 600,
  tinydrive_token_provider: '/tiny/jwt',
 
});