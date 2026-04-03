// recognize.js – Gọi POST /recognize và xử lý kết quả

import { API_BASE } from "./app.js";

export async function recognizeBlob(blob) {
  console.log("Gửi ảnh đến server để nhận diện...");
  const form = new FormData();
  form.append("file", blob, "capture.jpg");

  const res = await fetch(`${API_BASE}/recognize`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Server lỗi: ${res.status}`);
  return await res.json();
}
