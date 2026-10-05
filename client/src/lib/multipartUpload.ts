export function startMultipartUpload(url: string, body: FormData, onProgress: (percent: number) => void) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ status: number; data: any }>((resolve, reject) => {
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded * 100 / event.total)); };
    xhr.onerror = () => reject(new Error("Se perdió la conexión. Comprueba tu red e inténtalo de nuevo."));
    xhr.onabort = () => reject(new Error("Subida cancelada"));
    xhr.onload = () => { let data: any = {}; try { data = JSON.parse(xhr.responseText); } catch {} resolve({ status: xhr.status, data }); };
    xhr.send(body);
  });
  return { promise, abort: () => xhr.abort() };
}
