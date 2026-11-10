function copyCode(elementId, btn) {
  const codeEl = document.getElementById(elementId);
  if (!codeEl) return;
  const code = codeEl.innerText;
  navigator.clipboard.writeText(code).then(() => {
    const orig = btn.innerText;
    btn.innerText = (document.documentElement.lang === 'en') ? 'Copied!' : 'Skopiowano!';
    btn.classList.add('is-done');
    setTimeout(() => {
      btn.innerText = orig;
      btn.classList.remove('is-done');
    }, 2000);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre.code, pre.vscode-lisp").forEach((codeEl) => {
    const lang = codeEl.dataset.lang || (codeEl.id && codeEl.id.includes("ms") ? "ms" : "lsp");
    const lines = codeEl.innerText.split(/\r?\n/);
    const highlighted = lines.map(line => {
      if (lang === "ms" && line.trim().startsWith("--")) {
        return `<span class="hl-comment">${escapeHtml(line)}</span>`;
      }
      if (lang === "lsp" && line.trim().startsWith(";")) {
        return `<span class="hl-comment">${escapeHtml(line)}</span>`;
      }
      let res = escapeHtml(line);
      res = res.replace(/(".*?")/g, '<span class="hl-string">$1</span>');
      if (lang === "ms") {
        res = res.replace(/\b(macroScript|category|tooltip|buttonText|local|global|if|not|then|else|do|for|in|try|catch|while|return)\b/g, '<span class="hl-keyword">$1</span>');
        res = res.replace(/\b(getDir|getFiles|doesFileExist|matchPattern|filenameFromPath|findItem|fileIn|format|getCurrentException)\b/g, '<span class="hl-function">$1</span>');
      } else {
        res = res.replace(/\b(defun|setq|vl-load-com|princ|prompt|if|progn|repeat|while|cond|not|and|or|member|append|itoa|rtos|strcat|strcase|foreach)\b/g, '<span class="hl-keyword">$1</span>');
        res = res.replace(/\b(ssget|ssadd|sslength|ssname|ssmemb|sssetfirst|getvar|setvar|vlax-ename(?:->|-&gt;)vla-object|vlax-property-available-p|vlax-get-property|vl-string-right-trim|vl-file-directory-p|vl-mkdir|command|vl-catch-all-apply|vl-catch-all-error-p|vl-directory-files|load|boundp)\b/g, '<span class="hl-function">$1</span>');
      }
      res = res.replace(/([\(\)])/g, '<span class="hl-paren">$1</span>');
      return res;
    }).join("\n");
    codeEl.innerHTML = highlighted;
  });
});
