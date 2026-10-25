(vl-load-com)

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
