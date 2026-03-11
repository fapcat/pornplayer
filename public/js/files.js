function update_files_list() {
  let files_div = document.getElementById("files_list");

  files_div.innerHTML = '';

  for (let f = 0; f < files.length; f++) {
    file_item = document.createElement("li");
    file_item.classList.add("file_item");
    file_item.setAttribute("data-id", f);
    file_item.innerText = files[f];
    file_item.addEventListener("click", function () {
      select_list_item(f, true);
      play_video("specific", f);
      switch_section("player");
    });
    files_div.appendChild(file_item);
  }

  file_items = document.querySelectorAll("#files_list li");
  select_list_item(0);
}
