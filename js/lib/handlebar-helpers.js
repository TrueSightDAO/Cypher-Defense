Handlebars.registerHelper("img", function(img_path, img_id, img_class) {
  if(img_id) img_id = "id=" + img_id
  if(img_class) img_class = "class=" + img_class
  return "<img src=" + Env.imagePath(img_path) + " " + img_id + " " + img_class + " >";
});