;; ==========================================================================
;; ViewIs AutoLISP Loader - Automatyczne ladowanie i hot-reload skryptow
;; https://www.viewis.pl/artykuly/autolisp-pierwsze-kroki-automatyczne-ladowanie/
;; ==========================================================================

(vl-load-com)

;; ==========================================================================
;; --- KONFIGURACJA GLOWNA ---
;; Wskaz wlasna sciezke do katalogu, w ktorym trzymasz swoje pliki .lsp.
;; Zalecamy uzywanie ukosnikow w prawo "/" zamiast podwojnych backslashy "\".
;; ==========================================================================
(setq *path-acad* "C:/Users/UZYTKOWNIK/Documents/AUTOCAD/lsp/start/")

;; ==========================================================================
;; --- PROCEDURA REGENLISP ---
;; Przeladowuje rekurencyjnie wszystkie pliki .lsp ze wskazanej sciezki w locie
;; ==========================================================================
(defun c:regenlisp (/ ignore scan loaded_count error_count)
  (setq loaded_count 0)
  (setq error_count 0)
  
  ;; Katalogi ignorowane podczas rekurencyjnego skanowania:
  (setq ignore '(".git" "archiwum" "test" ".venv"))

  (defun scan (dir / full)
    ;; Ladowanie wszystkich plikow .lsp w biezacym podfolderze
    (foreach f (vl-directory-files dir "*.lsp" 1)
      (setq full (strcat dir "/" f))
      (if (vl-catch-all-error-p (vl-catch-all-apply 'load (list full)))
        (progn
          (princ (strcat "\n  [BŁĄD] " f))
          (setq error_count (1+ error_count))
        )
        (progn
          (princ (strcat "\n  [OK]   " f))
          (setq loaded_count (1+ loaded_count))
        )
      )
    )
    ;; Rekurencyjne przejscie do kolejnych podfolderow
    (foreach d (vl-directory-files dir nil -1)
      (if (not (member (strcase d t) (append '("." "..") ignore)))
        (scan (strcat dir "/" d))
      )
    )
  )

  ;; Weryfikacja sciezki i start skanowania
  (cond
    ((not (boundp '*path-acad*))
     (princ "\n[ViewIs Loader BŁĄD]: Zmienna *path-acad* nie jest ustawiona."))
    ((not (vl-file-directory-p (vl-string-right-trim "/\\" *path-acad*)))
     (princ (strcat "\n[ViewIs Loader BŁĄD]: Wskazany folder nie istnieje: " *path-acad*)))
    (t
     (princ (strcat "\n[ViewIs Loader] Skanowanie folderu: " *path-acad*))
     (scan (vl-string-right-trim "/\\" *path-acad*))
     (princ (strcat "\n[ViewIs Loader] Przeładowano plików: " (itoa loaded_count) 
                    (if (> error_count 0) (strcat " (Błędy: " (itoa error_count) ")") "") 
                    "."))
    )
  )
  (princ)
)
