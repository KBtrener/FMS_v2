# Prompt startowy do Google Stitch

Rozwijaj responsywny system **FMS QuickScreen** na podstawie `design.md` i materiałów `stitch_fms_quickscreen_design_system`.

`design.md` jest nadrzędnym kontraktem UX, dostępności i danych. Materiały w `stitch_fms_quickscreen_design_system` są nowym wzorcem wizualnym „Studio Biomechanics”. Obecna aplikacja i starsze screenshoty dokumentują funkcje, pola i przepływy, ale nie są wzorcem wyglądu.

Zachowaj polski język, wszystkie odpowiedzi i reguły punktacji. Stosuj dokładnie kanoniczne tokeny (primary `#0F172A`, teal `#0D9488`, Outfit + Inter) oraz globalny system statusów: zielony 2–3/Pass/brak bólu, pomarańczowy 1/Fail/asymetria, czerwony 0/ból/red flag, niebieski szkic/informacja. Każdy status musi mieć ikonę, tekst i dostępny opis.

Najpierw dopracuj wizard do obsługi jedną ręką: nazwane kroki, porównanie L/P, Shoulder Clearing w dwóch wzorcach, kryteria domyślnie zamknięte i sticky actions. Następnie zachowaj ten sam system na liście klientów, profilu, szczegółach badania i w responsywnym podglądzie raportu A4.

Raport ma pokazywać ostatnie kompletne badanie i składać się z niezależnych sekcji. Historia jest widoczna dopiero od dwóch badań. Nie renderuj pustych sekcji. HTML i PDF mają ten sam zakres informacji, a disclaimer jest obowiązkowy.

Używaj wyłącznie lokalnego mastera logo, nie kopiuj adresów `googleusercontent.com`. Dwa pliki 28-bajtowe wymienione w `STITCH_SCREENSHOTS.md` są uszkodzone — ich `code.html` jest źródłem zastępczym.

Przygotuj mobile 390 × 844, tablet 1024 × 768, desktop 1440 px oraz podgląd raportu A4. Zweryfikuj brak overflow przy 390 px, targety 48 × 48 px, focus, czytelność L/P i nieprzecinanie kart raportu w druku.
