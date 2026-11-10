PROCEDURE_GROUPS = [
    {
        "id": "G-01",
        "name": "Przedmiary instalacji (MEP)",
        "name_en": "MEP Quantity Takeoffs",
        "volume": "Modele IFC 2x3 / IFC4, rysunki DWG, bilans 1:1 z geometrią",
        "volume_en": "IFC 2x3 / IFC4 models, DWG drawings, 1:1 balance with geometry",
        "items": [
            {
                "id": "P-01",
                "name": "Kanały i kształtki wentylacyjne",
                "name_en": "Ducts and ventilation fittings",
                "desc": "Zestawienie powierzchni blachy, obwody, izolacja, naddatek montażowy i GUID elementów.",
                "desc_en": "Sheet metal surface area, perimeters, insulation, fitting allowance and element GUID.",
                "inp": "IFC · DWG",
                "out": "XLSX · CSV",
                "price_from": None
            },
            {
                "id": "P-02",
                "name": "Rurociągi i armatura",
                "name_en": "Pipes and pipe fittings",
                "desc": "Długości tras wg średnic, armatura odcinająca i regulacyjna, bilans systemów.",
                "desc_en": "Pipe run lengths by diameter, valves, fittings and system breakdown.",
                "inp": "IFC · DWG",
                "out": "XLSX · CSV",
                "price_from": None
            },
            {
                "id": "P-03",
                "name": "Delta rewizji (porównanie v1 vs v2)",
                "name_en": "Revision delta (v1 vs v2)",
                "desc": "Zestawienie różnicowe zmian w geometrii i ilościach między kolejnymi wydaniami projektu.",
                "desc_en": "Differential change register of quantities and elements across project revisions.",
                "inp": "IFC v1/v2",
                "out": "XLSX (Delta)",
                "price_from": None
            }
        ]
    },
    {
        "id": "G-02",
        "name": "Inżynieria danych i audyt BIM",
        "name_en": "Data Engineering & BIM Audit",
        "volume": "Walidacja OpenBIM, korygowanie struktur, automatyzacja arkuszy",
        "volume_en": "OpenBIM validation, structural fixes, spreadsheet automation",
        "items": [
            {
                "id": "P-04",
                "name": "Audyt i naprawa modeli IFC",
                "name_en": "IFC model audit and repair",
                "desc": "Uzupełnianie brakujących parametrów, poziomów (storey) i zgodności z EIR/BEP.",
                "desc_en": "Restoring missing parameters, storeys, and EIR/BEP compliance check.",
                "inp": "IFC",
                "out": "Poprawiony IFC · Raport",
                "price_from": None
            },
            {
                "id": "P-05",
                "name": "Dedykowana automatyzacja i programy (.exe)",
                "name_en": "Custom Excel & CAD automation (.exe)",
                "desc": "Automatyczne przetwarzanie rejestrów, skrypty AutoLISP/MAXScript, programy bez instalacji.",
                "desc_en": "Automated ledger cleaning, AutoLISP/MAXScript scripts, standalone executable tools.",
                "inp": "XLSX · CSV · DWG",
                "out": "Program (.exe) · Raport",
                "price_from": None
            }
        ]
    }
]
