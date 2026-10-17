;; ==========================================================================
;; ViewIs CAD Tools - Zestaw 3 autorskich narzedzi przyspieszajacych prace
;; https://www.viewis.pl/artykuly/autocad-lisp-narzedzia-przyspieszajace-prace/
;; ==========================================================================

(vl-load-com)

;; ==========================================================================
;; --- 1. PROCEDURA SELECTREVERSE ---
;; Odwraca aktywne zaznaczenie w biezacej przestrzeni (Model lub Layout)
;; ==========================================================================
(defun c:selectreverse (/ inv_ss all_ss result_ss i ent)
  ;; Pobranie obiektow zaznaczonych przed wywolaniem polecenia (Pickfirst)
  (setq inv_ss (ssget "_I"))
  
  ;; Pobranie wszystkich widocznych obiektow z aktywnej przestrzeni (DXF 60 /= 1)
  (setq all_ss (ssget "_X" (list (cons 410 (getvar "CTAB")) 
                                 '(-4 . "<NOT") 
                                 '(60 . 1) 
                                 '(-4 . "NOT>"))))
  
  (if all_ss
    (progn
      (setq result_ss (ssadd))
      (setq i 0)
      ;; Iteracja po wszystkich widocznych obiektach i budowa zbioru roznicowego
      (repeat (sslength all_ss)
        (setq ent (ssname all_ss i))
        (if (or (null inv_ss) (not (ssmemb ent inv_ss)))
          (ssadd ent result_ss)
        )
        (setq i (1+ i))
      )
      ;; Aktywacja i podswietlenie nowego zaznaczenia uchwytami
      (sssetfirst nil result_ss)
      (princ (strcat "\n[ViewIs CAD] Odwrocono zaznaczenie: " (itoa (sslength result_ss)) " obiektow."))
    )
    (princ "\n[ViewIs CAD] Brak widocznych obiektow w biezacej przestrzeni.")
  )
  (princ)
)

;; ==========================================================================
;; --- 2. PROCEDURA CALCULATEAREA ---
;; Sumuje pole powierzchni zaznaczonych obiektow (polilinie, okregi, kreskowania, regiony)
;; ==========================================================================
(defun c:calculatearea (/ ss i total ent obj area count)
  (setq total 0.0)
  (setq count 0)
  (prompt "\n[ViewIs CAD] Wybierz obiekty do zliczenia powierzchni (Polilinie, Kregi, Kreskowania, Regiony)... ")
  
  ;; Filtrowanie dopuszczalnych typow obiektow posiadajacych pole powierzchni
  (if (setq ss (ssget '((0 . "*POLYLINE,CIRCLE,HATCH,REGION"))))
    (progn
      (repeat (setq i (sslength ss))
        (setq ent (ssname ss (setq i (1- i))))
        (setq obj (vlax-ename->vla-object ent))
        ;; Bezpieczne odpytanie obiektu o wlasciwosc Area przez interfejs ActiveX
        (if (vlax-property-available-p obj 'Area)
          (progn
            (setq area (vl-catch-all-apply 'vlax-get-property (list obj 'Area)))
            (if (and (not (vl-catch-all-error-p area)) (numberp area))
              (setq total (+ total area)
                    count (1+ count))
            )
          )
        )
      )
      ;; UWAGA DOTYCZACA JEDNOSTEK:
      ;; Dzielnik 10000.0 zaklada jednostke rysunkowa cm (1 m2 = 10 000 cm2).
      ;; Jesli rysujesz w mm, zmien dzielnik na 1000000.0 (1 m2 = 1 000 000 mm2).
      ;; Jesli rysujesz w m, usun dzielenie.
      (princ (strcat "\n[ViewIs CAD] Zliczono obiektow: " (itoa count) 
                     " | Laczna powierzchnia: " (rtos (/ total 10000.0) 2 2) " m2"))
    )
    (prompt "\n[ViewIs CAD] Nie wybrano wlasciwych obiektow.")
  )
  (princ)
)

;; ==========================================================================
;; --- 3. PROCEDURA DWT ---
;; Blyskawiczny eksport biezacego stanu rysunku do pliku szablonu VI.dwt
;; ==========================================================================
(defun c:dwt (/ old_echo old_expert raw_path target_path file_path)
  (setq old_echo (getvar "CMDECHO"))
  (setq old_expert (getvar "EXPERT"))
  
  ;; Wyciszenie komunikatow i autozgoda na nadpisywanie istniejacych plikow
  (setvar "CMDECHO" 0)
  (setvar "EXPERT" 2)
  
  ;; Sprawdzenie konfiguracji sciezki (kompatybilnosc z *path-acad* oraz *path*)
  (setq raw_path (cond 
                   ((boundp '*path-acad*) *path-acad*)
                   ((boundp '*path*) *path*)
                   (t nil)))
                   
  (if raw_path
    (progn
      ;; Normalizacja sciezki: usuniecie konczacych ukosnikow i tworzenie katalogu
      (setq target_path (vl-string-right-trim "/\\" raw_path))
      (if (not (vl-file-directory-p target_path))
        (vl-mkdir target_path)
      )
      (setq file_path (strcat target_path "\\VI.dwt"))
      
      ;; Zapis szablonu z automatycznym potwierdzeniem domyslnych monitow AutoCADa
      (command "_.saveas" "_Template" file_path)
      (while (> (getvar "CMDACTIVE") 0)
        (command "")
      )
      (prompt (strcat "\n[ViewIs CAD] Szablon zapisany pomyslnie w: " file_path))
    )
    (prompt "\n[ViewIs CAD Blad] Zmienna sciezki (*path-acad* lub *path*) nie jest zdefiniowana w srodowisku.")
  )
  
  ;; Przywrocenie poczatkowych ustawien srodowiska
  (setvar "EXPERT" old_expert)
  (setvar "CMDECHO" old_echo)
  (princ)
)
