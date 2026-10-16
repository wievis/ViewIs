(vl-load-com)

;; WSKAZ WLASNA SCIEZKE DO FOLDERU ZE SKRYPTAMI LISP:
(setq *path-acad* "C:/Users/UZYTKOWNIK/Documents/AUTOCAD/lsp/start/")

(defun c:regenlisp (/ ignore scan)
  (setq ignore '(".git" "archiwum" "test" ".venv"))

  (defun scan (dir / full)
    (foreach f (vl-directory-files dir "*.lsp" 1)
      (setq full (strcat dir "/" f))
      (if (vl-catch-all-error-p (vl-catch-all-apply 'load (list full)))
        (princ (strcat "
BŁĄD: " f))
        (princ (strcat "
OK: " f))))
    (foreach d (vl-directory-files dir nil -1)
      (if (not (member (strcase d t) (append '("." "..") ignore)))
        (scan (strcat dir "/" d)))))

  (cond
    ((not (boundp '*path-acad*))
     (princ "
BŁĄD: zmienna *path-acad* nie jest ustawiona."))
    ((not (vl-file-directory-p *path-acad*))
     (princ (strcat "
BŁĄD: folder nie istnieje: " *path-acad*)))
    (t
     (scan (vl-string-right-trim "/" *path-acad*))))
  (princ)
)
