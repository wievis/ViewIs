;; ==========================================================================
;; ViewIs AutoLISP Loader - Automatyczne ladowanie i hot-reload skryptow
;; https://www.viewis.pl/artykuly/autolisp-pierwsze-kroki-automatyczne-ladowanie/
;; ==========================================================================

(vl-load-com)

;; --- KONFIGURACJA GLOWNA ---
;; Wskaz wlasna sciezke do katalogu, w ktorym trzymasz swoje pliki .lsp:
(setq *path-acad* "C:/Users/UZYTKOWNIK/Documents/AUTOCAD/lsp/start/")

;; --- PROCEDURA REGENLISP ---
;; Przeladowuje rekurencyjnie wszystkie pliki .lsp ze wskazanej sciezki w locie
(defun c:regenlisp (/ ignore scan)
  ;; Katalogi ignorowane podczas skanowania:
  (setq ignore '(".git" "archiwum" "test" ".venv"))

  (defun scan (dir / full)
    ;; Ladowanie wszystkich plikow .lsp w biezacym podfolderze
    (foreach f (vl-directory-files dir "*.lsp" 1)
      (setq full (strcat dir "/" f))
      (if (vl-catch-all-error-p (vl-catch-all-apply 'load (list full)))
        (princ (strcat "
BŁĄD: " f))
        (princ (strcat "
OK: " f))))
    ;; Rekurencyjne przejscie do kolejnych podfolderow
    (foreach d (vl-directory-files dir nil -1)
      (if (not (member (strcase d t) (append '("." "..") ignore)))
        (scan (strcat dir "/" d)))))

  ;; Weryfikacja sciezki i start skanowania
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
