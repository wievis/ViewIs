-- ==========================================================================
-- ViewIs MAXScript Loader - Hot-reload i automatyczne przeladowywanie skryptow
-- https://www.viewis.pl/artykuly/maxscript-hot-reload-automatyczne-ladowanie/
-- ==========================================================================

macroScript RegenScripts
category:"ViewIs Tools"
tooltip:"Przeładuj skrypty startup w locie"
buttonText:"Regen Scripts"
(
    -- ==========================================================================
    -- --- KONFIGURACJA GLOWNA ---
    -- Domyslnie uzywamy sciezki systemowej usera:
    -- local userStartupPath = (getDir #userStartupScripts) + "/"
    -- Mozesz tez podac wlasna sztywna sciezke (pamietaj o ukosnikach w prawo "/"):
    -- ==========================================================================
    local userStartupPath = "C:/Users/UZYTKOWNIK/Documents/3ds Max 2026/scripts/startup/"

    -- Pliki wylaczone z automatycznego przeladowywania:
    local excludedFiles = #(
        "_excluded.ms"
    )

    -- Normalizacja ukosnikow na koncu sciezki
    if not (matchPattern userStartupPath pattern:"*/") and not (matchPattern userStartupPath pattern:"*\\") do (
        userStartupPath += "/"
    )

    -- Sprawdzenie obecnosci katalogu w systemie
    if not (doesFileExist userStartupPath) then (
        format "\n[ViewIs MAXScript BŁĄD]: Wskazany folder nie istnieje: %\n" userStartupPath
    ) else (
        local scriptFiles = getFiles (userStartupPath + "*.ms")
        local loadedCount = 0
        local errorCount = 0

        format "\n[ViewIs MAXScript] Rozpoczynam przeladowywanie skryptow z: %\n" userStartupPath

        for f in scriptFiles do (
            local scriptName = filenameFromPath f

            if (findItem excludedFiles scriptName == 0) do (
                try (
                    fileIn f
                    format "  [OK]   %\n" scriptName
                    loadedCount += 1
                ) catch (
                    format "  [BŁĄD] % -> %\n" scriptName (getCurrentException())
                    errorCount += 1
                )
            )
        )

        format "[ViewIs MAXScript] Zakonczono. Przeladowano: % | Bledy: %\n\n" loadedCount errorCount
    )
)
