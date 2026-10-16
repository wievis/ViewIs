;; ViewIs CAD Tools - 3 podstawowe narzedzia
;; https://www.viewis.pl/artykuly/autocad-lisp-narzedzia-przyspieszajace-prace/

(vl-load-com)

;; 1. Odwrocenie zaznaczenia w biezacym ukladzie
(defun c:selectreverse (/ inv_ss all_ss result_ss i ent)
  (setq inv_ss (ssget "_I"))
  (setq all_ss (ssget "_X" (list (cons 410 (getvar "CTAB")) '(-4 . "<NOT") '(60 . 1) '(-4 . "NOT>"))))
  (if all_ss
    (progn
      (setq result_ss (ssadd))
      (setq i 0)
      (repeat (sslength all_ss)
        (setq ent (ssname all_ss i))
        (if (or (null inv_ss) (not (ssmemb ent inv_ss)))
          (ssadd ent result_ss)
        )
        (setq i (1+ i))
      )
      (sssetfirst nil result_ss)
    )
  )
  (princ)
)

;; 2. Szybka suma powierzchni zaznaczonych obiektow [m2]
(defun c:calculatearea (/ ss i total ent obj area count)
  (setq total 0.0)
  (setq count 0)
  (prompt "
Wybierz obiekty do zliczenia powierzchni (Polilinie, Kregi, Kreskowania, Regiony)... ")
  (if (setq ss (ssget '((0 . "*POLYLINE,CIRCLE,HATCH,REGION") (-4 . "<NOT") (-4 . "&=") (70 . 128) (-4 . "NOT>"))))
    (progn
      (repeat (setq i (sslength ss))
        (setq ent (ssname ss (setq i (1- i))))
        (setq obj (vlax-ename->vla-object ent))
        (if (and (vlax-property-available-p obj 'Area)
                 (numberp (setq area (vlax-get-property obj 'Area))))
          (progn
            (setq total (+ total area))
            (setq count (1+ count))
          )
        )
      )
      (princ (strcat "
[ViewIs CAD] Zliczono obiektow: " (itoa count) " | Laczna powierzchnia: " (rtos (/ total 10000.0) 2 2) " m2"))
    )
    (prompt "
Nie wybrano wlasciwych obiektow.")
  )
  (princ)
)

;; 3. Blyskawiczny eksport biezacego pliku jako szablon DWT
(defun c:dwt (/ old_echo old_expert target_path file_path)
  (setq old_echo (getvar "CMDECHO"))
  (setq old_expert (getvar "EXPERT"))
  (setvar "CMDECHO" 0)
  (setvar "EXPERT" 2)
  (if (boundp '*path*)
    (progn
      (setq target_path (vl-string-right-trim "\\" (vl-string-right-trim "/" *path*)))
      (if (not (vl-file-directory-p target_path))
        (vl-mkdir target_path)
      )
      (setq file_path (strcat target_path "\\VI.dwt"))
      (command "_.saveas" "_Template" file_path)
      (while (> (getvar "CMDACTIVE") 0)
        (command "")
      )
      (prompt (strcat "
[ViewIs CAD] Szablon zapisany w: " file_path))
    )
    (prompt "
[ViewIs CAD Blad] Zmienna *path* nie jest zdefiniowana w srodowisku.")
  )
  (setvar "EXPERT" old_expert)
  (setvar "CMDECHO" old_echo)
  (princ)
)
