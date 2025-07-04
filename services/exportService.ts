
import { StoryPage } from '../types';
// This assumes JSZip is loaded from a CDN and available globally.
declare var JSZip: any;

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const exportToHtml = (pages: StoryPage[], title: string) => {
    let pageContent = '';
    const audioData = pages.map(page => page.pcmData || '');

    pages.forEach((page, index) => {
        pageContent += `
      <div class="page" id="page-${index + 1}" style="display: ${index === 0 ? 'flex' : 'none'};">
        <img src="${page.imageUrl}" alt="Ilustración para la página ${index + 1}">
        <div class="text-container">
            <p>${page.text}</p>
        </div>
      </div>
    `;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; margin: 0; background-color: #f0f8ff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
        .storybook-container { position: relative; width: 90%; max-width: 800px; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }
        .page { display: flex; flex-direction: column; align-items: center; padding: 20px; animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        img { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; max-height: 400px; object-fit: cover; }
        .text-container { text-align: center; }
        p { font-size: 1.2rem; line-height: 1.6; color: #333; }
        .navigation { display: flex; justify-content: space-between; padding: 20px; width: 100%; max-width: 800px; box-sizing: border-box; }
        button { background-color: #4A90E2; color: white; border: none; padding: 10px 20px; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: background-color 0.3s; }
        button:disabled { background-color: #ccc; cursor: not-allowed; }
        button:hover:not(:disabled) { background-color: #357ABD; }
        #page-counter { font-size: 1rem; color: #555; align-self: center; }
        .replay-audio-btn {
            position: absolute;
            bottom: 30px;
            right: 30px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: background-color 0.2s;
        }
        .replay-audio-btn:hover { background-color: rgba(0, 0, 0, 0.8); }
        .replay-audio-btn svg { width: 24px; height: 24px; }
      </style>
    </head>
    <body>
      <h1 style="text-align: center; color: #333;">${title}</h1>
      <div class="storybook-container">
        ${pageContent}
        <button class="replay-audio-btn" id="replayBtn" title="Repetir narración">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07"/></svg>
        </button>
      </div>
      <div class="navigation">
        <button id="prevBtn">Anterior</button>
        <span id="page-counter">Página 1 de ${pages.length}</span>
        <button id="nextBtn">Siguiente</button>
      </div>
      <script>
        const audioData = ${JSON.stringify(audioData)};
        let currentPage = 1;
        const totalPages = ${pages.length};
        const pageCounter = document.getElementById('page-counter');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const replayBtn = document.getElementById('replayBtn');
        let audioContext = null;
        let currentSource = null;

        function initAudioContext() {
            if (!audioContext) {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.error('Web Audio API is not supported in this browser.');
                    replayBtn.style.display = 'none';
                }
            }
        }
        
        async function playNarration(pageIndex) {
            initAudioContext();
            if (!audioContext || !audioData[pageIndex]) return;

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            if (currentSource) {
                try { currentSource.stop(); } catch(e) {}
                currentSource.disconnect();
            }

            try {
                const binaryString = window.atob(audioData[pageIndex]);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const pcmData = new Int16Array(bytes.buffer);
                const floatData = new Float32Array(pcmData.length);
                
                for (let i = 0; i < pcmData.length; i++) {
                    floatData[i] = pcmData[i] / 32768.0;
                }
                
                const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000); // 1 channel, 24000 sample rate
                audioBuffer.copyToChannel(floatData, 0);

                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                currentSource = source;
            } catch (e) {
                console.error("Failed to decode or play audio:", e);
            }
        }
        
        function showPage(pageNumber) {
          document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
          document.getElementById('page-' + pageNumber).style.display = 'flex';
          pageCounter.textContent = 'Página ' + pageNumber + ' de ' + totalPages;
          prevBtn.disabled = pageNumber === 1;
          nextBtn.disabled = pageNumber === totalPages;
          currentPage = pageNumber;
          playNarration(currentPage - 1);
        }

        prevBtn.addEventListener('click', () => { if (currentPage > 1) showPage(currentPage - 1); });
        nextBtn.addEventListener('click', () => { if (currentPage < totalPages) showPage(currentPage + 1); });
        replayBtn.addEventListener('click', () => {
          initAudioContext();
          playNarration(currentPage - 1);
        });

        document.body.addEventListener('click', initAudioContext, { once: true });
        
        showPage(1);
      <\/script>
    </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToEpub = async (pages: StoryPage[], title: string) => {
    if (typeof JSZip === 'undefined') {
        alert("La librería para crear EPUB no se ha cargado. Por favor, revisa tu conexión a internet.");
        return;
    }
    const zip = new JSZip();
    const coverImage = pages[0]?.imageUrl;
    if (!coverImage) {
        alert("Se necesita al menos una imagen para crear la portada del EPUB.");
        return;
    }

    // mimetype file
    zip.file("mimetype", "application/epub+zip", {compression: "STORE"});

    // container.xml
    const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.file("META-INF/container.xml", containerXml);
    
    const oebps = zip.folder("OEBPS");
    const imagePromises: Promise<void>[] = [];
    const pageFiles: {id: string, href: string}[] = [];

    // Process cover
    const coverImageBlob = await (await fetch(coverImage)).blob();
    oebps?.file("images/cover.jpg", coverImageBlob);

    pages.forEach((page, index) => {
        const pageId = `page${index + 1}`;
        const pageHref = `text/${pageId}.xhtml`;
        pageFiles.push({id: pageId, href: pageHref});

        const pageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es">
<head>
  <title>Página ${index + 1}</title>
  <link rel="stylesheet" type="text/css" href="../css/stylesheet.css" />
</head>
<body>
  <img src="../images/page${index + 1}.jpg" alt="Ilustración de la página ${index + 1}" />
  <p>${page.text}</p>
</body>
</html>`;
        oebps?.file(pageHref, pageHtml);

        if (page.imageUrl) {
            const imagePromise = fetch(page.imageUrl)
                .then(res => res.blob())
                .then(blob => oebps?.file(`images/page${index + 1}.jpg`, blob));
            imagePromises.push(imagePromise);
        }
    });

    await Promise.all(imagePromises);

    const stylesheet = `body { font-family: sans-serif; } img { max-width: 100%; height: auto; display: block; margin: 0 auto; } p { text-align: center; margin-top: 1em; }`;
    oebps?.file("css/stylesheet.css", stylesheet);
    
    // content.opf
    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0" xml:lang="es">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>Cuentos Mágicos AI</dc:creator>
    <dc:language>es</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0] + 'Z'}</meta>
    <meta name="cover" content="cover-image" />
  </metadata>
  <manifest>
    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="css/stylesheet.css" media-type="text/css"/>
    ${pages.map((p, i) => `<item id="img${i + 1}" href="images/page${i + 1}.jpg" media-type="image/jpeg"/>`).join('\n    ')}
    ${pageFiles.map(f => `<item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${pageFiles.map(f => `<itemref idref="${f.id}"/>`).join('\n    ')}
  </spine>
</package>`;
    oebps?.file("content.opf", opfContent);

    // toc.ncx
    const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${crypto.randomUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    ${pages.map((p, i) => `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Página ${i + 1}</text></navLabel>
      <content src="text/page${i + 1}.xhtml"/>
    </navPoint>`).join('\n    ')}
  </navMap>
</ncx>`;
    oebps?.file("toc.ncx", ncxContent);

    const epubBlob = await zip.generateAsync({type: "blob", mimeType: "application/epub+zip"});
    const url = URL.createObjectURL(epubBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.epub`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportToWav = async (pages: StoryPage[], title: string) => {
    alert("La exportación a audiolibro WAV ya no está disponible. La narración ahora es generada en vivo por el navegador y no se puede guardar como un archivo.");
};
