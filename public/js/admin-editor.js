/**
 * Admin Rich Text Editor Integration (TinyMCE Self-Hosted)
 * Configured for bilingual articles with image upload and responsive preview.
 */

(function() {
  function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag && metaTag.getAttribute('content')) {
      return metaTag.getAttribute('content');
    }
    const inputToken = document.querySelector('input[name="_csrf"]');
    if (inputToken && inputToken.value) {
      return inputToken.value;
    }
    return '';
  }

  // TinyMCE Promise-based image upload handler
  function uploadImageHandler(blobInfo, progress) {
    return new Promise((resolve, reject) => {
      const csrfToken = getCsrfToken();
      const uploadUrl = '/admin/posts/upload-image?_csrf=' + encodeURIComponent(csrfToken);

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open('POST', uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof progress === 'function') {
          progress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 403) {
          reject({ message: 'Sesi pengiriman telah kedaluwarsa. Silakan muat ulang halaman.', remove: true });
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          let errorMsg = 'HTTP Error: ' + xhr.status;
          try {
            const errRes = JSON.parse(xhr.responseText);
            if (errRes && errRes.error) errorMsg = errRes.error;
          } catch (e) {}
          reject({ message: errorMsg, remove: true });
          return;
        }

        try {
          const json = JSON.parse(xhr.responseText);
          if (!json || typeof json.location !== 'string') {
            reject({ message: 'Format response upload tidak valid dari server.', remove: true });
            return;
          }
          resolve(json.location);
        } catch (e) {
          reject({ message: 'Gagal memproses response server: ' + xhr.responseText, remove: true });
        }
      };

      xhr.onerror = () => {
        reject({ message: 'Koneksi jaringan terputus saat mengunggah gambar.', remove: true });
      };

      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());
      xhr.send(formData);
    });
  }

  function initArticleEditors() {
    if (typeof tinymce === 'undefined') {
      return;
    }

    const contentIdEl = document.getElementById('content_id');
    const contentEnEl = document.getElementById('content_en');

    if (!contentIdEl && !contentEnEl) {
      return;
    }

    tinymce.init({
      selector: '#content_id, #content_en',
      license_key: 'gpl',
      height: 480,
      menubar: false,
      branding: false,
      promotion: false,
      skin: 'oxide',
      content_css: 'default',
      content_style: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #0F172A;
          padding: 16px 20px;
          margin: 0;
          background-color: #FFFFFF;
        }
        h2 { font-size: 1.5rem; font-weight: 700; color: #0A192F; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.3; }
        h3 { font-size: 1.25rem; font-weight: 600; color: #0A192F; margin-top: 1.25rem; margin-bottom: 0.5rem; line-height: 1.35; }
        h4 { font-size: 1.1rem; font-weight: 600; color: #0A192F; margin-top: 1rem; margin-bottom: 0.5rem; }
        p { margin-top: 0; margin-bottom: 1rem; }
        a { color: #0055B8; text-decoration: underline; text-underline-offset: 3px; }
        a:hover { color: #1D4ED8; }
        ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.35rem; }
        blockquote {
          margin: 1.5rem 0;
          padding: 0.75rem 1.25rem;
          border-left: 4px solid #0055B8;
          background-color: #FAF8FF;
          color: #424753;
          font-style: italic;
          border-radius: 0 6px 6px 0;
        }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
          display: block;
          box-shadow: 0 1px 3px rgba(10, 25, 47, 0.08);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          font-size: 14px;
        }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 10px 14px;
          text-align: left;
        }
        th {
          background-color: #F8FAFC;
          font-weight: 600;
          color: #0A192F;
        }
        code {
          background-color: #F1F5F9;
          color: #0F172A;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        pre {
          background-color: #0A192F;
          color: #F8FAFC;
          padding: 14px 18px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 13.5px;
        }
        hr {
          border: 0;
          border-top: 1px solid #E2E8F0;
          margin: 1.75rem 0;
        }
      `,
      plugins: 'lists link image table code wordcount autolink',
      toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image table | code | wordcount',
      block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
      images_upload_handler: uploadImageHandler,
      automatic_uploads: true,
      file_picker_types: 'image',
      image_dimensions: false,
      image_description: true,
      setup: (editor) => {
        // Synchronize textarea content on change to support browser form validations
        editor.on('change keyup NodeChange', () => {
          editor.save();
        });
      }
    });

    // Ensure all TinyMCE editors sync their content before form submit
    const postForms = document.querySelectorAll('form[action*="/admin/posts"]');
    postForms.forEach((form) => {
      form.addEventListener('submit', () => {
        if (typeof tinymce !== 'undefined') {
          tinymce.triggerSave();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleEditors);
  } else {
    initArticleEditors();
  }
})();
